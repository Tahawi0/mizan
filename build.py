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
VER = hashlib.md5((ROOT / "assets/daily.js").read_bytes() + (ROOT / "assets/style.css").read_bytes()).hexdigest()[:8]

LOGO = ('<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">'
        '<path d="M16 4v24M8 28h16M5 9h22"/><path d="M9 9l-4 9h8zM23 9l-4 9h8z"/></svg>')


def page(title, body, root, active="", desc=""):
    nav = [("", "الرئيسية"), ("daily/", "مغالطة اليوم"), ("atlas/", "الأطلس"), ("about/", "عن ميزان")]
    links = "".join(f'<a href="{root}{h}"{" class=active" if h == active else ""}>{t}</a>' for h, t in nav)
    return f"""<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e_(title)}</title>
<meta name="description" content="{e_(desc or 'ميزان: مرجع مصري مفتوح عن التفكير الصح، المغالطات والانحيازات بأمثلة من حياتنا.')}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{root}assets/style.css?v={VER}">
<link rel="manifest" href="{root}manifest.webmanifest"><meta name="theme-color" content="#a3762c">
</head><body data-root="{root}">
<header class="top"><div class="wrap"><a class="logo" href="{root}">{LOGO}ميزان</a><nav>{links}</nav></div></header>
<main><div class="wrap">{body}</div></main>
<footer><div class="wrap">ميزان — زِن كلامك. اتعمل بإيد إنسان مع الذكاء الاصطناعي، وكل مدخل بيتراجع قبل ما يتعلّم «اتراجع».</div></footer>
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
    body = f"""<section class="hero"><h1>زِن كلامك</h1>
<p class="lead">ميزان مرجع مصري مفتوح عن إزاي نفكر صح، وليه بنغلط. مغالطات وانحيازات وأسئلة كبيرة، بأمثلة من البيت والشارع والسوشيال.</p>
<a class="btn" href="daily/">العب مغالطة النهارده</a> <a class="btn ghost" href="atlas/">افتح الأطلس</a></section>
<h2>من الأطلس</h2><div class="grid">{''.join(tile(e, './') for e in entries)}</div>"""
    write("index.html", page("ميزان — زِن كلامك", body, "./", ""))

    # atlas index
    body = f"""<h1>الأطلس</h1><p class="lead">كل مغالطة وانحياز، مشروحة بالبلدي ومعاها أمثلة وإزاي ترد.</p>
<div class="filters"><button class="on" data-f="all">الكل</button><button data-f="fallacy">مغالطات</button><button data-f="bias">انحيازات</button></div>
<div class="grid" id="g">{''.join(tile(e, '../') for e in entries)}</div>
<script>document.querySelectorAll('.filters button').forEach(function(b){{b.onclick=function(){{
document.querySelectorAll('.filters button').forEach(function(x){{x.classList.remove('on')}});b.classList.add('on');
document.querySelectorAll('#g .tile').forEach(function(t){{t.style.display=(b.dataset.f==='all'||t.dataset.kind===b.dataset.f)?'':'none'}});}}}});</script>"""
    write("atlas/index.html", page("الأطلس — ميزان", body, "../", "atlas/"))

    # entries
    for e in entries:
        r = "../../"
        exs = "".join(f'<div class="ex"><small>{e_(x["where"])}</small><div>{e_(x["text"])}</div></div>' for x in e["examples"])
        nc = e.get("notConfuse") or {}
        ev = f'<h2>قوة الدليل</h2><p>{e_(e["evidence"])}</p>' if e.get("evidence") else ""
        src = "".join(f"<li>{e_(s)}</li>" for s in e.get("sources", []))
        body = f"""<p><span class="tag">{KIND[e['kind']]}</span> {status(e)}</p>
<h1>{e_(e['name'])}</h1><span class="intl">{e_(e['intl'])}</span>
<p class="oneline">{e_(e['oneLine'])}</p>
<h2>من حياتنا</h2><div class="card">{exs}</div>
<h2>إزاي تكشفها</h2><p>{e_(e['detect'])}</p>
<h2>إزاي ترد من غير خناق</h2><p>{e_(e['respond'])}</p>
{f"<h2>متتلخبطش بينها وبين: " + (f'<a href="{r}atlas/{nc["slug"]}/">{e_(nc["name"])}</a>' if nc.get("slug") else e_(nc["name"])) + f"</h2><p>{e_(nc['diff'])}</p>" if nc else ""}
{ev}<h2>مصادر</h2><ul class="sources">{src}</ul>
<p><a href="{r}atlas/">→ ارجع للأطلس</a></p>"""
        write(f"atlas/{e['slug']}/index.html", page(f"{e['name']} — ميزان", body, r, "atlas/", e["oneLine"]))

    # daily
    body = """<p class="tag">مغالطة اليوم #<span id="dayno"></span></p>
<div class="card" style="margin-top:12px"><p class="scene" id="scene"></p><div class="opts" id="opts"></div>
<div class="reveal" id="reveal"><h2 id="verdict" style="margin-top:8px"></h2><p id="why"></p>
<a class="btn ghost" id="more" href="#">اقرأ عنها في الأطلس</a> <button class="btn" id="share">شارك نتيجتك</button></div></div>
<div class="stats"><div><b id="s-streak">0</b>أيام ورا بعض</div><div><b id="s-best">0</b>أحسن سلسلة</div><div><b id="s-played">0</b>لعبت</div></div>
<p class="note">لغز جديد كل يوم. الألغاز دي لسه مسودات بنراجعها.</p>
<h2 id="past-h">ألغاز فاتت</h2><p class="lead" style="font-size:15px">العبها تمرين، مش هتأثر على عدد الأيام.</p><div class="grid" id="past"></div>"""
    body += f"<script>window.MIZAN_PUZZLES={json.dumps(puzzles, ensure_ascii=False)};</script><script src=\"../assets/daily.js?v={VER}\"></script>"
    write("daily/index.html", page("مغالطة اليوم — ميزان", body, "../", "daily/"))

    # about
    body = """<h1>عن ميزان</h1>
<p>ميزان مشروع مفتوح هدفه يبقى أكبر مرجع عربي عن التفكير: المنطق، والانحيازات المعرفية، والأسئلة الفلسفية الكبيرة، مشروحة بالعامية المصرية وبأمثلة من حياتنا.</p>
<h2>إزاي بنشتغل</h2><p>المحتوى بيتكتب بشراكة بين إنسان متخصص وذكاء اصطناعي، وكل مدخل بيعدي على مراجعة بشرية قبل ما يتعلّم «اتراجع». أي مدخل مكتوب عليه «مسودة» لسه متراجعش.</p>
<h2>الأمانة العلمية</h2><p>بنكتب مصادر كل مدخل، وبنوضح قوة الدليل على كل انحياز. أي معلومة الدليل عليها ضعيف أو مختلف عليه، بنقول كده صراحة.</p>
<p class="note">ميزان تمرين على التفكير، مش تشخيص نفسي ولا استشارة متخصصة.</p>"""
    write("about/index.html", page("عن ميزان", body, "../", "about/"))

    write("manifest.webmanifest", json.dumps({"name": "ميزان", "short_name": "ميزان", "lang": "ar", "dir": "rtl",
        "start_url": "./", "display": "standalone", "background_color": "#f6f1e7", "theme_color": "#a3762c"}, ensure_ascii=False))
    print("built", len(entries), "entries,", len(puzzles), "puzzles")


if __name__ == "__main__":
    build()
