"""Check content/*.json before the site is built.

Run on its own (python tools/validate.py) or from build.py. It prints every
problem it finds, with the file, the item and the field, and exits with 1.
No third-party packages: it must run on a plain Python 3 install.
"""
import json
import re
import sys
from pathlib import Path

SLUG = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")

# Field -> type for every item of the list files. A trailing "?" marks an optional field.
LIST_FILES = {
    "entries.json": {"slug": str, "kind": str, "name": str, "intl": str, "oneLine": str, "examples": list,
                     "detect": str, "respond": str, "notConfuse": dict, "evidence": str, "sources": list,
                     "reviewed": bool, "limits?": (str, list)},
    "philosophy.json": {"slug": str, "kind": str, "name": str, "intl": str, "era": str, "oneLine": str,
                        "idea": str, "life": str, "useIt": str, "critique": str, "related": list, "sources": list},
    "puzzles.json": {"id": int, "scene": str, "options": list, "answer": int, "why": str, "entry": str, "reviewed": bool},
    "paths.json": {"slug": str, "title": str, "intro": str, "days": list, "level": str},
    "dilemmas.json": {"slug": str, "title": str, "scene": str, "question": str, "options": list, "views": (list, dict)},
    "weekly.json": {"slug": str, "title": str, "scene": str, "question": str, "options": list, "views": (list, dict)},
    "thought.json": {"slug": str, "title": str, "by": str, "story": str, "question": str, "options": list,
                     "views": (list, dict), "why": str, "related": list, "sources": list},
    "problems.json": {"slug": str, "title": str, "feel": str, "answers": list, "note?": str},
    "trends.json": {"slug": str, "title": str, "claim": str, "fair": str, "analysis": (str, list), "verdict": str},
}

# Top-level keys the object files must keep, because the site code reads them.
OBJECT_FILES = {
    "argue.json": ["levels"], "bayes.json": ["cases"], "charts.json": ["stages"], "court.json": ["cases"],
    "debate.json": ["topics"], "escape.json": ["rooms"], "family.json": ["rounds"], "games.json": [],
    "live.json": ["episodes"], "profile.json": ["items"], "rumor.json": ["levels"], "teachers.json": ["lessons"],
    "verify.json": ["cases"],
}

ENTRY_KINDS = {"fallacy", "bias", "tool"}

# Fields that are allowed to be "" for now: the site hides the section when they are.
MAY_BE_EMPTY = {"entries.json": ("evidence",)}


class Report:
    def __init__(self):
        self.errors = []

    def add(self, file, where, msg):
        self.errors.append(f"{file} › {where}: {msg}")


def _type_name(t):
    return " or ".join(x.__name__ for x in t) if isinstance(t, tuple) else t.__name__


def check_items(rep, name, items, spec):
    if not isinstance(items, list):
        rep.add(name, "(root)", "must be a list")
        return
    seen = {}
    key = "id" if "id" in spec else "slug"
    for i, it in enumerate(items):
        where = f"#{i}"
        if not isinstance(it, dict):
            rep.add(name, where, "item must be an object")
            continue
        ident = it.get(key)
        if ident is not None:
            where = f"{key}={ident}"
        for field, typ in spec.items():
            optional = field.endswith("?")
            field = field.rstrip("?")
            if field not in it:
                if not optional:
                    rep.add(name, where, f"missing field «{field}»")
                continue
            val = it[field]
            # bool is a subclass of int in Python: don't accept True as an id.
            if typ is int and isinstance(val, bool):
                rep.add(name, where, f"«{field}» must be int")
            elif not isinstance(val, typ):
                rep.add(name, where, f"«{field}» must be {_type_name(typ)}, got {type(val).__name__}")
            elif isinstance(val, str) and not val.strip() and field not in MAY_BE_EMPTY.get(name, ()):
                rep.add(name, where, f"«{field}» is empty")
        if key == "slug" and isinstance(ident, str) and not SLUG.match(ident):
            rep.add(name, where, "slug must be lowercase letters, digits and single dashes")
        if ident is not None:
            if ident in seen:
                rep.add(name, where, f"duplicate {key} (also item #{seen[ident]})")
            seen[ident] = i


def load(rep, root, name):
    path = root / "content" / name
    if not path.exists():
        rep.add(name, "(file)", "missing")
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        rep.add(name, f"line {e.lineno} col {e.colno}", f"invalid JSON: {e.msg}")
        return None


def worker_list(src, const):
    m = re.search(r"const " + const + r" = \[([^\]]*)\]", src)
    return set(re.findall(r'"([^"]+)"', m.group(1))) if m else None


def check(root):
    root = Path(root)
    rep = Report()
    data = {}
    for name, spec in LIST_FILES.items():
        d = load(rep, root, name)
        if d is not None:
            data[name] = d
            check_items(rep, name, d, spec)
    for name, keys in OBJECT_FILES.items():
        d = load(rep, root, name)
        if d is None:
            continue
        if not isinstance(d, dict):
            rep.add(name, "(root)", "must be an object")
            continue
        for k in keys:
            if k not in d:
                rep.add(name, "(root)", f"missing key «{k}»")

    entries = [x for x in data.get("entries.json", []) if isinstance(x, dict)]
    philo = [x for x in data.get("philosophy.json", []) if isinstance(x, dict)]
    e_slugs = {x.get("slug") for x in entries}
    known = e_slugs | {x.get("slug") for x in philo}

    for x in entries:
        if x.get("kind") not in ENTRY_KINDS:
            rep.add("entries.json", f"slug={x.get('slug')}", f"kind must be one of {sorted(ENTRY_KINDS)}")
    for name in ("philosophy.json", "thought.json"):
        for x in data.get(name, []):
            for r in x.get("related", []) if isinstance(x, dict) else []:
                if r not in known:
                    rep.add(name, f"slug={x.get('slug')}", f"related «{r}» is not an entry or a philosophy item")
    for x in data.get("puzzles.json", []):
        if not isinstance(x, dict):
            continue
        where = f"id={x.get('id')}"
        if x.get("entry") not in e_slugs:
            rep.add("puzzles.json", where, f"entry «{x.get('entry')}» does not exist")
        opts, ans = x.get("options"), x.get("answer")
        if isinstance(opts, list) and isinstance(ans, int) and not 0 <= ans < len(opts):
            rep.add("puzzles.json", where, f"answer {ans} is outside the {len(opts)} options")
        if isinstance(opts, list) and len(set(map(str, opts))) != len(opts):
            rep.add("puzzles.json", where, "two options are the same, so the review card can't tell them apart")
    # Review cards («مراجعة اليوم») are built from examples, with notConfuse as the hard wrong option.
    names = [x.get("name") for x in entries]
    for n in {n for n in names if names.count(n) > 1}:
        rep.add("entries.json", f"name={n}", "two entries share this name, so review answers would be ambiguous")
    for x in entries:
        nc = x.get("notConfuse") if isinstance(x.get("notConfuse"), dict) else {}
        if nc.get("slug") and nc["slug"] not in e_slugs:
            rep.add("entries.json", f"slug={x.get('slug')}", f"notConfuse «{nc['slug']}» does not exist")
        if nc.get("slug") == x.get("slug"):
            rep.add("entries.json", f"slug={x.get('slug')}", "notConfuse points to the entry itself")
        if x.get("kind") != "tool" and not x.get("examples"):
            rep.add("entries.json", f"slug={x.get('slug')}", "needs at least one example for its review card")
    for x in data.get("paths.json", []):
        for di, day in enumerate(x.get("days", []) if isinstance(x, dict) else []):
            if isinstance(day, dict) and "entry" in day and day["entry"] not in known:
                rep.add("paths.json", f"slug={x.get('slug')} day {di + 1}", f"entry «{day['entry']}» does not exist")
    # build.py renders an unknown slug here as an empty link, so catch it.
    for x in data.get("trends.json", []):
        for a in x.get("analysis", []) if isinstance(x, dict) and isinstance(x.get("analysis"), list) else []:
            if isinstance(a, dict) and a.get("entry") and a["entry"] not in known:
                rep.add("trends.json", f"slug={x.get('slug')}", f"analysis entry «{a['entry']}» does not exist")

    # The Worker keeps its own copies of these ids. If they drift, votes and analysis break silently.
    wpath = root / "worker" / "src" / "index.js"
    if wpath.exists():
        src = wpath.read_text(encoding="utf-8")
        expect = {
            "SLUGS": {x.get("slug") for x in entries if x.get("kind") != "tool"},
            "DILEMMAS": {x.get("slug") for x in data.get("dilemmas.json", [])},
            "WEEKLY": {"week-" + x.get("slug", "") for x in data.get("weekly.json", [])},
            "THOUGHT": {"thought-" + x.get("slug", "") for x in data.get("thought.json", [])},
        }
        for const, want in expect.items():
            have = worker_list(src, const)
            if have is None:
                rep.add("worker/src/index.js", const, "list not found")
                continue
            for s in sorted(want - have):
                rep.add("worker/src/index.js", const, f"missing «{s}» (it is in content/)")
            for s in sorted(have - want):
                rep.add("worker/src/index.js", const, f"has «{s}», which is not in content/")
    return rep.errors


def main():
    errors = check(Path(__file__).resolve().parent.parent)
    if errors:
        print(f"content check failed ({len(errors)}):", file=sys.stderr)
        for e in errors:
            print("  - " + e, file=sys.stderr)
        sys.exit(1)
    print("content ok")


if __name__ == "__main__":
    main()
