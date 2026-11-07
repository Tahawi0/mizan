"""Build the Mizan static site into docs/ from content/*.json."""
import json, shutil, html, hashlib
from pathlib import Path

ROOT = Path(__file__).parent
OUT = ROOT / "docs"
entries = json.loads((ROOT / "content/entries.json").read_text(encoding="utf-8"))
puzzles = json.loads((ROOT / "content/puzzles.json").read_text(encoding="utf-8"))
by_slug = {e["slug"]: e for e in entries}
KIND = {"fallacy": "مغالطة", "bias": "انحياز"}
e_ = html.escape
VER = hashlib.md5(b"".join((ROOT / "assets" / f).read_bytes() for f in ["daily.js", "style.css", "dilemma.js", "analyze.js", "config.js"])).hexdigest()[:8]
dilemmas = json.loads((ROOT / "content/dilemmas.json").read_text(encoding="utf-8"))

LOGO = ('<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">'
        '<path d="M16 4v24M8 28h16M5 9h22"/><path d="M9 9l-4 9h8zM23 9l-4 9h8z"/></svg>')


SCALE = """<svg class="scale" viewBox="0 0 200 150" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
<path d="M100 30v100M70 132h60M84 132l16-12 16 12"/><circle cx="100" cy="24" r="6"/>
<g class="beam"><path d="M24 46h152"/><circle cx="100" cy="46" r="3" fill="currentColor"/>
<g class="pan-r"><path d="M34 46l-18 40M34 46l18 40M10 86h48a24 9 0 0 1-48 0z"/></g>
<g class="pan-l"><path d="M166 46l-18 40M166 46l18 40M142 86h48a24 9 0 0 1-48 0z"/></g></g></svg>"""
ORN = '<div class="orn" aria-hidden="true"><span></span></div>'


def page(title, body, root, active="", desc=""):
    nav = [("daily/", "مغالطة اليوم"), ("atlas/", "الأطلس"), ("dilemmas/", "معضلات"), ("analyze/", "حلّل الكلام"), ("about/", "عن ميزان")]
    links = "".join(f'<a href="{root}{h}"{" class=active" if h == active else ""}>{t}</a>' for h, t in nav)
    return f"""<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e_(title)}</title>
<meta name="description" content="{e_(desc or 'ميزان: مرجع مصري مفتوح عن التفكير الصح، المغالطات والانحيازات بأمثلة من حياتنا.')}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Reem+Kufi:wght@500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{root}assets/style.css?v={VER}">
<link rel="manifest" href="{root}manifest.webmanifest"><meta name="theme-color" content="#A47E2E">
</head><body data-root="{root}">
<header class="top"><div class="wrap"><a class="logo" href="{root}">{LOGO}ميزان</a><nav>{links}</nav></div></header>
<main><div class="wrap">{body}</div></main>
<footer><div class="wrap"><a class="logo" href="{root}">{LOGO}ميزان</a><p>زِن كلامك. مرجع مفتوح، اتكتب بإيد إنسان مع الذكاء الاصطناعي، وكل مدخل اتراجع قبل النشر.</p></div></footer>
</body></html>"""


def write(rel, content):
    p = OUT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")


def status(e):
    return '<span class="tag">اتراجع</span>' if e.get("reviewed") else '<span class="tag draft">مسودة — لسه متراجعتش</span>'


def tile(e, root):
    return (f'<a class="tile" data-kind="{e["kind"]}" href="{root}atlas/{e["slug"]}/">'
            f'<span>{KIND[e["kind"]]}</span><b>{e_(e["name"])}</b><span>{e_(e["oneLine"])}</span></a>')


def build():
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(ROOT / "assets", OUT / "assets")
    (OUT / ".nojekyll").write_text("")

    # home
    sample = [by_slug[x] for x in ["straw-man", "confirmation-bias", "sunk-cost", "survivorship", "ad-hominem", "anchoring"] if x in by_slug]
    doors = [("daily/", "مغالطة اليوم", "لغز صغير كل يوم من مواقف حياتنا. اكتشف الغلط في الكلام وشارك نتيجتك."),
             ("atlas/", "الأطلس", f"{len(entries)} مغالطة وانحياز، كل واحدة بأمثلة من البيت والشارع، وإزاي ترد عليها."),
             ("dilemmas/", "معضلات", f"{len(dilemmas)} موقف مفيهوش إجابة سهلة. اختار، وشوف الناس اختارت إيه والفلاسفة قالوا إيه."),
             ("analyze/", "حلّل الكلام", "حط أي جملة سمعتها، وميزان يوزنها ويقولك فيها غلط ولا لأ.")]
    doors_html = "".join(f'<li><a href="{h}"><b>{t}</b><span>{d}</span></a></li>' for h, t, d in doors)
    idx = "".join(f'<li><a href="atlas/{e["slug"]}/"><b>{e_(e["name"])}</b><em>{KIND[e["kind"]]}</em><span>{e_(e["oneLine"])}</span></a></li>' for e in sample)
    body = f"""<section class="hero">{SCALE}<h1>زِن كلامك</h1>
<p class="lead">ميزان مرجع مصري مفتوح عن إزاي نفكر صح، وليه بنغلط. بالبلدي، وبأمثلة من حياتنا.</p></section>
<section class="today"><h2>لغز النهارده</h2><blockquote id="today-scene">…</blockquote><a class="btn" href="daily/">حلّ اللغز</a></section>
{ORN}<h2>إيه اللي في ميزان؟</h2><ul class="doors">{doors_html}</ul>
{ORN}<h2>من الأطلس</h2><ul class="index">{idx}</ul><p class="back"><a href="atlas/">كل المداخل</a></p>
<script>(function(){{var d={json.dumps([p["scene"] for p in puzzles], ensure_ascii=False)};var n=Math.floor((Date.now()-Date.UTC(2026,10,1))/864e5);document.getElementById("today-scene").textContent=d[((n%d.length)+d.length)%d.length];}})();</script>"""
    write("index.html", page("ميزان — زِن كلامك", body, "./", ""))

    # atlas index
    def key(e):
        n = e["name"].strip("«»\"' ")
        return n[2:] if n.startswith("ال") and len(n) > 3 else n
    groups = {}
    for e in sorted(entries, key=key):
        groups.setdefault(key(e)[0], []).append(e)
    ix = "".join(f'<section class="grp"><div class="letter">{L}</div><ul class="index">' + "".join(
        f'<li data-kind="{e["kind"]}"><a href="{e["slug"]}/"><b>{e_(e["name"])}</b><em>{KIND[e["kind"]]}</em><span>{e_(e["oneLine"])}</span></a></li>' for e in es) + '</ul></section>' for L, es in groups.items())
    body = f"""<h1>الأطلس</h1><p class="lead">فهرس المغالطات والانحيازات، مرتب بالحروف. كل مدخل فيه أمثلة من حياتنا، وإزاي تكشفها، وإزاي ترد.</p>
<div class="filters"><button class="on" data-f="all">الكل ({len(entries)})</button><button data-f="fallacy">مغالطات</button><button data-f="bias">انحيازات</button></div>
<div id="g">{ix}</div>
<script>document.querySelectorAll('.filters button').forEach(function(b){{b.onclick=function(){{
document.querySelectorAll('.filters button').forEach(function(x){{x.classList.remove('on')}});b.classList.add('on');
document.querySelectorAll('#g li').forEach(function(t){{t.style.display=(b.dataset.f==='all'||t.dataset.kind===b.dataset.f)?'':'none'}});
document.querySelectorAll('#g .grp').forEach(function(g){{g.style.display=[].some.call(g.querySelectorAll('li'),function(l){{return l.style.display!=='none'}})?'':'none'}});}}}});</script>"""
    write("atlas/index.html", page("الأطلس — ميزان", body, "../", "atlas/"))

    # entries
    for e in entries:
        r = "../../"
        exs = "".join(f'<div class="ex"><small>{e_(x["where"])}</small><div>{e_(x["text"])}</div></div>' for x in e["examples"])
        nc = e.get("notConfuse") or {}
        ev = f'<h2>قوة الدليل</h2><p>{e_(e["evidence"])}</p>' if e.get("evidence") else ""
        src = "".join(f"<li>{e_(s)}</li>" for s in e.get("sources", []))
        body = f"""<p class="kicker">{KIND[e['kind']]}{"" if e.get("reviewed") else " " + status(e)}</p>
<h1>{e_(e['name'])}</h1><span class="intl">{e_(e['intl'])}</span>
<p class="oneline">{e_(e['oneLine'])}</p>
<h2>من حياتنا</h2>{exs}
<h2>إزاي تكشفها</h2><p>{e_(e['detect'])}</p>
<h2>إزاي ترد من غير خناق</h2><p>{e_(e['respond'])}</p>
{f"<h2>متتلخبطش بينها وبين: " + (f'<a href="{r}atlas/{nc["slug"]}/">{e_(nc["name"])}</a>' if nc.get("slug") else e_(nc["name"])) + f"</h2><p>{e_(nc['diff'])}</p>" if nc else ""}
{ev}<h2>مصادر</h2><ul class="sources">{src}</ul>
<p class="back"><a href="{r}atlas/">ارجع للفهرس</a></p>"""
        write(f"atlas/{e['slug']}/index.html", page(f"{e['name']} — ميزان", body, r, "atlas/", e["oneLine"]))

    # daily
    body = """<p class="kicker">لغز رقم <span id="dayno"></span></p>
<h1 style="font-size:2rem">مغالطة اليوم</h1><div class="sheet"><p class="scene" id="scene"></p><div class="opts" id="opts"></div>
<div class="reveal" id="reveal"><h2 id="verdict" style="margin-top:8px"></h2><p id="why"></p>
<a class="btn ghost" id="more" href="#">اقرأ عنها في الأطلس</a> <button class="btn" id="share">شارك نتيجتك</button></div></div>
<div class="stats"><div><b id="s-streak">0</b>أيام ورا بعض</div><div><b id="s-best">0</b>أحسن سلسلة</div><div><b id="s-played">0</b>لعبت</div></div>
<p class="note">لغز جديد كل يوم.</p>
<h2 id="past-h">ألغاز فاتت</h2><p class="lead" style="font-size:15px">العبها تمرين، مش هتأثر على عدد الأيام.</p><div class="grid" id="past"></div>"""
    body += f"<script>window.MIZAN_PUZZLES={json.dumps(puzzles, ensure_ascii=False)};</script><script src=\"../assets/daily.js?v={VER}\"></script>"
    write("daily/index.html", page("مغالطة اليوم — ميزان", body, "../", "daily/"))


    # dilemmas
    tiles = "".join(f'<a class="tile" href="{d["slug"]}/"><span>معضلة</span><b>{e_(d["title"])}</b><span>{e_(d["question"])}</span></a>' for d in dilemmas)
    write("dilemmas/index.html", page("معضلات — ميزان", f'<h1>معضلات</h1><p class="lead">مواقف مفيهاش إجابة سهلة. اختار، وبعدين شوف الفلاسفة شايفينها إزاي.</p><div class="grid">{tiles}</div>', "../", "dilemmas/"))
    for d in dilemmas:
        r = "../../"
        opts = "".join(f"<button>{e_(o)}</button>" for o in d["options"])
        views = "".join(f'<div class="ex"><small>{e_(v["school"])}</small><div>{e_(v["text"])}</div></div>' for v in d["views"])
        body = f"""<p class="kicker">معضلة</p><h1>{e_(d['title'])}</h1>
<div class="sheet" id="dilemma" data-id="{d['slug']}"><p class="scene">{e_(d['scene'])}</p><h2 style="margin-top:4px">{e_(d['question'])}</h2>
<div class="opts">{opts}</div><p class="lead" id="vote-note" style="font-size:14px;margin-top:10px"></p>
<div class="reveal" id="views"><h2>الفلاسفة شايفينها إزاي؟</h2>{views}
<p class="note">مفيش إجابة صح واحدة هنا. الهدف إنك تعرف إنت اخترت ليه.</p></div></div>
<p class="back"><a href="{r}dilemmas/">كل المعضلات</a></p>
<script src="{r}assets/config.js?v={VER}"></script><script src="{r}assets/dilemma.js?v={VER}"></script>"""
        write(f"dilemmas/{d['slug']}/index.html", page(f"{d['title']} — ميزان", body, r, "dilemmas/", d["scene"]))

    # analyze
    names = json.dumps({x["slug"]: x["name"] for x in entries}, ensure_ascii=False)
    body = f"""<h1>حلّل الكلام</h1><p class="lead">حط أي جملة أو بوست أو كلام سمعته، وميزان هيقولك فيه مغالطة ولا انحياز، وترد إزاي.</p>
<form id="an-form" class="sheet"><textarea id="an-text" rows="6" maxlength="1000" placeholder="مثلاً: «كل الناس بتشتري الموبايل ده، يبقى أكيد أحسن واحد.»"></textarea>
<p style="margin:10px 0 0"><button class="btn" type="submit">وزّن الكلام</button> <span id="an-status" class="lead" style="font-size:14px"></span></p></form>
<div id="an-out" style="margin-top:16px"></div>
<p class="note">متكتبش بيانات شخصية، زي أسماء أو أرقام تليفونات. الكلام بيتبعت لسيرفر عشان يتحلل.</p>
<script>window.MIZAN_NAMES={names};</script><script src="../assets/config.js?v={VER}"></script><script src="../assets/analyze.js?v={VER}"></script>"""
    write("analyze/index.html", page("حلّل الكلام — ميزان", body, "../", "analyze/"))

    # about
    body = """<h1>عن ميزان</h1>
<p>ميزان مشروع مفتوح هدفه يبقى أكبر مرجع عربي عن التفكير: المنطق، والانحيازات المعرفية، والأسئلة الفلسفية الكبيرة، مشروحة بالعامية المصرية وبأمثلة من حياتنا.</p>
<h2>إزاي بنشتغل</h2><p>المحتوى بيتكتب بشراكة بين إنسان متخصص وذكاء اصطناعي، وكل مدخل بيعدي على مراجعة بشرية قبل ما يتعلّم «اتراجع». أي مدخل مكتوب عليه «مسودة» لسه متراجعش.</p>
<h2>الأمانة العلمية</h2><p>بنكتب مصادر كل مدخل، وبنوضح قوة الدليل على كل انحياز. أي معلومة الدليل عليها ضعيف أو مختلف عليه، بنقول كده صراحة.</p>
<p class="note">ميزان تمرين على التفكير، مش تشخيص نفسي ولا استشارة متخصصة.</p>"""
    write("about/index.html", page("عن ميزان", body, "../", "about/"))

    write("manifest.webmanifest", json.dumps({"name": "ميزان", "short_name": "ميزان", "lang": "ar", "dir": "rtl",
        "start_url": "./", "display": "standalone", "background_color": "#E9E1CC", "theme_color": "#A47E2E"}, ensure_ascii=False))
    print("built", len(entries), "entries,", len(puzzles), "puzzles")


if __name__ == "__main__":
    build()
