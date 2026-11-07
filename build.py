"""Build the Mizan static site into docs/ from content/*.json."""
import json, shutil, html, hashlib
from pathlib import Path

ROOT = Path(__file__).parent
OUT = ROOT / "docs"
entries = json.loads((ROOT / "content/entries.json").read_text(encoding="utf-8"))
puzzles = json.loads((ROOT / "content/puzzles.json").read_text(encoding="utf-8"))
by_slug = {e["slug"]: e for e in entries}
KIND = {"fallacy": "مغالطة", "bias": "انحياز", "philosopher": "فيلسوف", "school": "مدرسة وفكرة"}
e_ = html.escape
VER = hashlib.md5(b"".join((ROOT / "assets" / f).read_bytes() for f in ["daily.js", "style.css", "dilemma.js", "analyze.js", "config.js", "quiz.js", "paths.js", "search.js", "app.js", "send.js", "games.js", "account.js", "acct-page.js"])).hexdigest()[:8]
dilemmas = json.loads((ROOT / "content/dilemmas.json").read_text(encoding="utf-8"))
weekly = json.loads((ROOT / "content/weekly.json").read_text(encoding="utf-8"))
paths = json.loads((ROOT / "content/paths.json").read_text(encoding="utf-8"))
games = json.loads((ROOT / "content/games.json").read_text(encoding="utf-8"))
SITE = "https://tahawi0.github.io/mizan/"
philo = json.loads((ROOT / "content/philosophy.json").read_text(encoding="utf-8"))
trends = json.loads((ROOT / "content/trends.json").read_text(encoding="utf-8"))
p_slug = {x["slug"]: x for x in philo}
_tok = ROOT / "content/analytics.txt"
ANALYTICS = _tok.read_text().strip() if _tok.exists() else ""
URLS = []

LOGO = ('<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">'
        '<path d="M16 4v24M8 28h16M5 9h22"/><path d="M9 9l-4 9h8zM23 9l-4 9h8z"/></svg>')


SCALE = """<svg class="scale" viewBox="0 0 200 150" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
<path d="M100 30v100M70 132h60M84 132l16-12 16 12"/><circle cx="100" cy="24" r="6"/>
<g class="beam"><path d="M24 46h152"/><circle cx="100" cy="46" r="3" fill="currentColor"/>
<g class="pan-r"><path d="M34 46l-18 40M34 46l18 40M10 86h48a24 9 0 0 1-48 0z"/></g>
<g class="pan-l"><path d="M166 46l-18 40M166 46l18 40M142 86h48a24 9 0 0 1-48 0z"/></g></g></svg>"""
ORN = '<div class="orn" aria-hidden="true"><span></span></div>'


def page(title, body, root, active="", desc="", img="cards/og/site.png", path="", ld=None):
    groups = [("اتعلّم", [("atlas/", "الأطلس", "مغالطات وانحيازات"), ("philosophy/", "الفلسفة", "فلاسفة ومدارس"), ("paths/", "مسارات", "7 أيام، 5 دقايق في اليوم"), ("trends/", "وزن التريند", "كلام منتشر بنوزنه")]),
              ("العب", [("daily/", "مغالطة اليوم", "لغز جديد كل يوم"), ("games/", "الألعاب", "تجارب وتحديات"), ("quiz/", "اختبر نفسك", "10 أسئلة وتحدّى صاحبك")]),
              ("قول رأيك", [("weekly/", "سؤال الأسبوع", "سؤال فلسفي وتصويت"), ("dilemmas/", "معضلات", "مواقف مفيهاش إجابة سهلة"), ("send/", "ابعت مغالطة", "جملة سمعتها وفيها غلط")])]
    def grp(name, items):
        on = any(h == active for h, _, _ in items)
        li = "".join(f'<a href="{root}{h}"{" class=active" if h == active else ""}><b>{t}</b><span>{d}</span></a>' for h, t, d in items)
        return f'<details class="dd{" on" if on else ""}"><summary>{name}</summary><div class="menu">{li}</div></details>'
    links = "".join(grp(n, it) for n, it in groups) + f'<a class="cta{" active" if active == "analyze/" else ""}" href="{root}analyze/">حلّل الكلام</a>'
    foot = [("about/", "عن ميزان"), ("privacy/", "الخصوصية"), ("search/", "بحث"), ("send/", "ابعت مغالطة")]
    flinks = "".join(f'<a href="{root}{h}">{t}</a>' for h, t in foot)
    ldj = f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>' if ld else ""
    beacon = f'<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon=\'{{"token": "{ANALYTICS}"}}\'></script>' if ANALYTICS else ""
    d = e_(desc or "ميزان: مرجع مصري مفتوح عن التفكير الصح، المغالطات والانحيازات بأمثلة من حياتنا.")
    return f"""<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>{e_(title)}</title>
<meta name="description" content="{d}">
<meta property="og:type" content="website"><meta property="og:site_name" content="ميزان"><meta property="og:locale" content="ar_EG">
<meta property="og:title" content="{e_(title)}"><meta property="og:description" content="{d}">
<meta property="og:url" content="{SITE}{path}"><meta property="og:image" content="{SITE}{img}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{SITE}{img}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=El+Messiri:wght@500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{root}assets/style.css?v={VER}">
<link rel="manifest" href="{root}manifest.webmanifest"><meta name="theme-color" content="#A47E2E">
<link rel="icon" type="image/png" href="{root}assets/icons/icon-192.png"><link rel="apple-touch-icon" href="{root}assets/icons/apple-touch.png">
<link rel="canonical" href="{SITE}{path}">{ldj}
</head><body data-root="{root}">
<header class="top"><div class="wrap"><a class="logo" href="{root}">{LOGO}ميزان</a><div class="top-tools"><a class="icon-btn acct" id="acct-btn" href="{root}account/" aria-label="تسجيل الدخول"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg></a><a class="icon-btn" href="{root}search/" aria-label="بحث"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg></a><button class="icon-btn burger" aria-label="القايمة" aria-expanded="false" aria-controls="mainnav"><span></span><span></span><span></span></button></div><nav id="mainnav" aria-label="الأقسام">{links}</nav></div></header>
<main><div class="wrap">{body}</div></main>
<footer><div class="wrap"><a class="logo" href="{root}">{LOGO}ميزان</a><nav class="foot-links" aria-label="روابط تانية">{flinks}</nav><p>زِن كلامك. مرجع مفتوح، اتكتب بإيد إنسان مع الذكاء الاصطناعي، وكل مدخل اتراجع قبل النشر.</p>
<button class="btn ghost" id="install" hidden>نزّل ميزان على موبايلك</button><p class="note" id="install-hint" hidden>على الآيفون: دوس زرار المشاركة في سفاري، وبعدين «إضافة إلى الشاشة الرئيسية».</p></div></footer>
<script src="{root}assets/app.js?v={VER}"></script><script src="{root}assets/config.js?v={VER}"></script><script src="{root}assets/account.js?v={VER}"></script>{beacon}
</body></html>"""


def write(rel, content):
    if rel.endswith("index.html"):
        URLS.append(rel[: -len("index.html")])
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
    shutil.copytree(ROOT / "cards", OUT / "cards")
    for f in (ROOT / "static").glob("*"):
        shutil.copy(f, OUT / f.name)

    # home
    sample = [by_slug[x] for x in ["straw-man", "confirmation-bias", "sunk-cost", "survivorship", "ad-hominem", "anchoring"] if x in by_slug]
    doors = [("daily/", "مغالطة اليوم", "لغز صغير كل يوم من مواقف حياتنا. اكتشف الغلط في الكلام وشارك نتيجتك."),
             ("atlas/", "الأطلس", f"{len(entries)} مغالطة وانحياز، كل واحدة بأمثلة من البيت والشارع، وإزاي ترد عليها."),
             ("games/", "ألعاب", "7 ألعاب: اختبر نفسك وتحدّى صحابك، وجرب تجارب علم النفس على نفسك، واكشف حيل الإعلانات."),
             ("philosophy/", "الفلسفة", f"{len(philo)} فيلسوف ومدرسة، من سقراط لكامو، كل واحد بفكرته وإزاي تستخدمها النهارده."),
             ("trends/", "وزن التريند", "كلام منتشر على السوشيال، بنوزنه بهدوء: فيه إيه صح، وفيه إيه غلط."),
             ("paths/", "مسارات", f"{len(paths)} مسارات قصيرة، كل واحد 7 أيام، درس صغير ومهمة كل يوم."),
             ("dilemmas/", "معضلات", f"{len(dilemmas)} موقف مفيهوش إجابة سهلة. اختار، وشوف الناس اختارت إيه والفلاسفة قالوا إيه."),
             ("weekly/", "سؤال الأسبوع", "سؤال فلسفي كبير كل أسبوع. صوّت وشوف الناس قالت إيه."),
             ("analyze/", "حلّل الكلام", "حط أي جملة سمعتها، وميزان يوزنها ويقولك فيها غلط ولا لأ.")]
    doors_html = "".join(f'<li><a href="{h}"><b>{t}</b><span>{d}</span></a></li>' for h, t, d in doors)
    idx = "".join(f'<li><a href="atlas/{e["slug"]}/"><b>{e_(e["name"])}</b><em>{KIND[e["kind"]]}</em><span>{e_(e["oneLine"])}</span></a></li>' for e in sample)
    body = f"""<section class="hero">{SCALE}<h1>زِن كلامك</h1>
<p class="lead">ميزان مرجع مصري مفتوح عن إزاي نفكر صح، وليه بنغلط. بالبلدي، وبأمثلة من حياتنا.</p></section>
<div class="trio">
<section class="today"><p class="kicker">العب</p><h2>لغز النهارده</h2><blockquote id="today-scene">…</blockquote><a class="btn" href="daily/">حلّ اللغز</a></section>
<section class="today" id="dilemma" data-id=""><p class="kicker">قول رأيك</p><h2 id="hw-title">سؤال الأسبوع</h2><p id="hw-q"></p><div class="opts"><button></button><button></button></div>
<p class="lead small" id="vote-note"></p><div class="reveal" id="views"><a class="btn ghost" id="hw-more" href="weekly/">شوف الفلاسفة قالوا إيه</a></div></section>
<section class="today"><p class="kicker">جرّب</p><h2>حلّل جملة</h2><p>سمعت كلام حاسس فيه حاجة غلط؟ حطه هنا، وميزان يوزنه.</p>
<form action="analyze/" method="get" class="mini-an" onsubmit="try{{sessionStorage.setItem('mizan-an-go','1')}}catch(e){{}}"><textarea name="t" rows="3" maxlength="1000" required placeholder="«كل الناس بتعمل كده…»"></textarea><button class="btn cta-btn" type="submit">وزّن الكلام</button></form></section>
</div>
{ORN}<h2>إيه اللي في ميزان؟</h2><ul class="doors">{doors_html}</ul>
{ORN}<h2>من الأطلس</h2><ul class="index">{idx}</ul><p class="back"><a href="atlas/">كل المداخل</a></p>
<script>(function(){{var d={json.dumps([p["scene"] for p in puzzles], ensure_ascii=False)};var n=Math.floor((Date.now()-Date.UTC(2026,10,1))/864e5);document.getElementById("today-scene").textContent=d[((n%d.length)+d.length)%d.length];}})();</script>"""
    hw = [{"slug": w["slug"], "title": w["title"], "question": w["question"], "options": w["options"]} for w in weekly]
    body += f"""<script>(function(){{var W={json.dumps(hw, ensure_ascii=False)};var n=Math.floor((Date.now()-Date.UTC(2026,10,7))/6048e5);if(n<0)n=0;var w=W[n%W.length],b=document.getElementById("dilemma");
b.setAttribute("data-id","week-"+w.slug);document.getElementById("hw-title").textContent=w.title;document.getElementById("hw-q").textContent=w.question;document.getElementById("hw-more").href="weekly/"+w.slug+"/";
b.querySelectorAll(".opts button").forEach(function(x,i){{x.textContent=w.options[i];}});}})();</script>
<script src="assets/config.js?v={VER}"></script><script src="assets/dilemma.js?v={VER}"></script>"""
    write("index.html", page("ميزان — زِن كلامك", body, "./", "", ld={"@context": "https://schema.org", "@type": "WebSite", "name": "ميزان", "url": SITE, "inLanguage": "ar-EG",
        "potentialAction": {"@type": "SearchAction", "target": SITE + "search/?q={q}", "query-input": "required name=q"}}))

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
<h2>شاركها</h2><p><a class="btn ghost" href="{r}cards/post/{e['slug']}.png" download>نزّل الكارت للبوست</a> <a class="btn ghost" href="{r}cards/og/{e['slug']}.png" download>كارت عريض</a></p>
<p class="report"><a href="{r}send/?err=atlas/{e['slug']}/">فيه غلط في الصفحة دي؟ قولّنا</a></p>
<p class="back"><a href="{r}atlas/">ارجع للفهرس</a></p>"""
        write(f"atlas/{e['slug']}/index.html", page(f"{e['name']} — ميزان", body, r, "atlas/", e["oneLine"], f"cards/og/{e['slug']}.png", f"atlas/{e['slug']}/",
              {"@context": "https://schema.org", "@type": "DefinedTerm", "name": e["name"], "alternateName": e["intl"], "description": e["oneLine"], "inLanguage": "ar-EG",
               "url": f"{SITE}atlas/{e['slug']}/", "inDefinedTermSet": {"@type": "DefinedTermSet", "name": "أطلس ميزان", "url": f"{SITE}atlas/"}}))

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
<p class="report"><a href="{r}send/?err=dilemmas/{d['slug']}/">فيه غلط في الصفحة دي؟ قولّنا</a></p>
<p class="back"><a href="{r}dilemmas/">كل المعضلات</a></p>
<script src="{r}assets/config.js?v={VER}"></script><script src="{r}assets/dilemma.js?v={VER}"></script>"""
        write(f"dilemmas/{d['slug']}/index.html", page(f"{d['title']} — ميزان", body, r, "dilemmas/", d["scene"]))

    # analyze
    names = json.dumps({x["slug"]: x["name"] for x in entries}, ensure_ascii=False)
    body = f"""<h1>حلّل الكلام</h1><p class="lead">حط أي جملة أو بوست أو كلام سمعته، وميزان هيقولك فيه مغالطة ولا انحياز، وترد إزاي.</p>
<form id="an-form" class="sheet"><textarea id="an-text" rows="6" maxlength="1000" placeholder="مثلاً: «كل الناس بتشتري الموبايل ده، يبقى أكيد أحسن واحد.»"></textarea>
<p style="margin:10px 0 0"><button class="btn" type="submit">وزّن الكلام</button> <span id="an-status" class="lead" style="font-size:14px"></span></p></form>
<p class="note warn">ده تحليل آلي بالذكاء الاصطناعي، وممكن يغلط. خده كرأي يساعدك تفكر، مش حكم نهائي، وراجع المدخل في الأطلس قبل ما تعتمد عليه.</p>
<div id="an-out" style="margin-top:16px"></div>
<p class="note">متكتبش بيانات شخصية، زي أسماء أو أرقام تليفونات. الكلام بيتبعت لسيرفر عشان يتحلل.</p>
<script>window.MIZAN_NAMES={names};</script><script src="../assets/config.js?v={VER}"></script><script src="../assets/analyze.js?v={VER}"></script>"""
    write("analyze/index.html", page("حلّل الكلام — ميزان", body, "../", "analyze/"))

    # quiz
    body = f"""<p class="kicker">10 أسئلة</p><h1>اختبر نفسك</h1>
<p class="note" id="q-banner" hidden></p><div class="sheet"><div id="q-intro"><p class="scene">هنوريك 10 مواقف من حياتنا، وفي كل واحد مغالطة أو انحياز مستخبي. اختار الإجابة، وفي الآخر هتعرف بتكشف كام.</p>
<p><button class="btn" id="q-start">ابدأ</button></p></div>
<div id="q-play" style="display:none"><p class="kicker" id="q-no"></p><div class="bar"><i id="q-bar"></i></div>
<p class="scene" id="q-scene"></p><div class="opts" id="q-opts"></div><p id="q-why" style="margin-top:1rem"></p>
<p><button class="btn" id="q-next" style="display:none"></button></p></div>
<div id="q-end" style="display:none" class="center"><p class="kicker">نتيجتك</p><p class="big"><span id="q-score">0</span><small> من 10</small></p>
<h2 id="q-level" style="justify-content:center"></h2><p class="verdict" id="q-vs" hidden></p><p class="lead" style="margin:0 auto">أحسن نتيجة ليك: <b id="q-best">0</b></p>
<p style="margin-top:1rem"><button class="btn" id="q-challenge">تحدّى صاحبك</button> <button class="btn ghost" id="q-share">شارك نتيجتك</button> <button class="btn ghost" id="q-again">العب تاني</button></p>
<div id="q-review-h"><h2 style="justify-content:center">راجع دول</h2><ul class="index" id="q-review" style="text-align:start"></ul></div></div></div>
<p class="note">كل مرة هتطلعلك أسئلة مختلفة من {len(puzzles)} لغز.</p>
<script>window.MIZAN_PUZZLES={json.dumps(puzzles, ensure_ascii=False)};window.MIZAN_NAMES={json.dumps({x["slug"]: x["name"] for x in entries}, ensure_ascii=False)};</script><script src="../assets/quiz.js?v={VER}"></script>"""
    write("quiz/index.html", page("اختبر نفسك — ميزان", body, "../", "quiz/", "10 أسئلة سريعة: بتكشف كام مغالطة من 10؟", path="quiz/"))

    # games
    gx = "../../"
    GAMES = [
        ("quiz", "اختبر نفسك", "10 أسئلة، وتحدّى صاحبك في نفس الأسئلة."),
        ("lab", "معمل الانحيازات", "4 تجارب علم نفس حقيقية تتعمل عليك، وتشوف نتايج كل اللي جربوا."),
        ("spot", "اكشف الحيلة", "3 إعلانات لماركات وهمية، وجوه كل واحد حيل مستخبية. لاقيها."),
        ("philosopher", "أنهي فيلسوف إنت؟", "8 أسئلة خفيفة… وفي الآخر مفاجأة."),
        ("calibration", "ميزان الثقة", "معلوماتك قد ثقتك؟ 10 أسئلة وهتعرف."),
        ("fix", "صلّح الحجة", "مش بس تكشف الغلط. اختار إزاي الجملة تتقال صح."),
        ("../daily", "مغالطة اليوم", "لغز جديد كل يوم، وسلسلة أيام ورا بعض.")]
    tiles = "".join(f'<a class="tile" href="{"../quiz/" if k == "quiz" else (k + "/") if not k.startswith("..") else "../daily/"}"><span>لعبة</span><b>{t}</b><span>{d}</span></a>' for k, t, d in GAMES)
    write("games/index.html", page("ألعاب — ميزان", f'<h1>ألعاب</h1><p class="lead">اتعلم التفكير وإنت بتلعب. كل لعبة بتاخد دقايق، وبتعلمك حاجة.</p><div class="grid">{tiles}</div>', "../", "games/", "ألعاب تفاعلية عن المغالطات والانحيازات: تجارب علم نفس، وكشف حيل الإعلانات، وتحدي صحابك.", path="games/"))
    names_js = json.dumps({x["slug"]: x["name"] for x in entries}, ensure_ascii=False)
    pn = json.dumps({k: {"name": p_slug[k]["name"]} for k in games["phil"]["results"]}, ensure_ascii=False)
    spec = {
        "lab": ("معمل الانحيازات", "التجارب دي اتعملت قبل كده على آلاف الناس في دراسات مشهورة. جاوب بسرعة وبصراحة، وبعدين شوف مخك اتأثر إزاي. الإجابات مجهولة، ومش بنسجل أي حاجة عنك.", {"lab": games["lab"]}, True),
        "spot": ("اكشف الحيلة", "الإعلانات دي متألفة لماركات مش موجودة. دوس على أي جملة شايف فيها حيلة، وبعدين دوس «خلصت».", {"spot": games["spot"]}, False),
        "philosopher": ("أنهي فيلسوف إنت؟", "8 أسئلة، اختار الأقرب ليك من غير ما تفكر كتير.", {"phil": games["phil"]}, False),
        "calibration": ("ميزان الثقة", "10 جمل: قول صح ولا غلط، وبعدين قول إنت متأكد بنسبة قد إيه. المهم مش بس تجاوب صح، المهم ثقتك تبقى قد معلوماتك.", {"calib": games["calib"]}, False),
        "fix": ("صلّح الحجة", "كل جملة فيها غلط. اختار الصياغة اللي بتقول نفس الفكرة من غير الغلط.", {"fix": games["fix"]}, False)}
    gid = {"lab": "lab", "spot": "spot", "philosopher": "phil", "calibration": "calib", "fix": "fix"}
    for slug, (title, lead, data, api) in spec.items():
        data["philNames"] = json.loads(pn)
        body = f"""<p class="kicker"><a href="{gx}games/">ألعاب</a></p><h1>{title}</h1><p class="lead">{lead}</p>
<div id="game" data-game="{gid[slug]}"{' class="sheet"' if slug != "lab" else ''}></div>
<script>window.MIZAN_GAME={json.dumps(data, ensure_ascii=False)};window.MIZAN_NAMES={names_js};</script>{f'<script src="{gx}assets/config.js?v={VER}"></script>' if api else ''}<script src="{gx}assets/games.js?v={VER}"></script>"""
        write(f"games/{slug}/index.html", page(f"{title} — ميزان", body, gx, "games/", lead, path=f"games/{slug}/"))

    # weekly question
    wk = [{"slug": w["slug"], "title": w["title"], "question": w["question"]} for w in weekly]
    body = f"""<p class="kicker">سؤال فلسفي كل أسبوع</p><h1>سؤال الأسبوع</h1>
<section class="today"><h2 id="w-title">…</h2><blockquote id="w-q"></blockquote><a class="btn" id="w-go" href="#">صوّت</a></section>
<h2 id="w-past-h">أسئلة فاتت</h2><div class="grid" id="w-past"></div>
<script>(function(){{var W={json.dumps(wk, ensure_ascii=False)};var n=Math.floor((Date.now()-Date.UTC(2026,10,7))/6048e5);if(n<0)n=0;var c=n%W.length;
document.getElementById("w-title").textContent=W[c].title;document.getElementById("w-q").textContent=W[c].question;document.getElementById("w-go").href=W[c].slug+"/";
var past=document.getElementById("w-past");for(var k=Math.min(n,W.length)-1;k>=0;k--){{if(k===c)continue;var a=document.createElement("a");a.className="tile";a.href=W[k].slug+"/";a.innerHTML="<span>سؤال</span>";var b=document.createElement("b");b.textContent=W[k].title;a.appendChild(b);var s=document.createElement("span");s.textContent=W[k].question;a.appendChild(s);past.appendChild(a);}}
if(!past.children.length){{past.style.display="none";document.getElementById("w-past-h").style.display="none";}}}})();</script>"""
    write("weekly/index.html", page("سؤال الأسبوع — ميزان", body, "../", "weekly/", "سؤال فلسفي كبير كل أسبوع. صوّت وشوف الناس قالت إيه.", path="weekly/"))
    for w in weekly:
        r = "../../"
        opts = "".join(f"<button>{e_(o)}</button>" for o in w["options"])
        views = "".join(f'<div class="ex"><small>{e_(v["school"])}</small><div>{e_(v["text"])}</div></div>' for v in w["views"])
        body = f"""<p class="kicker">سؤال الأسبوع</p><h1>{e_(w['title'])}</h1>
<div class="sheet" id="dilemma" data-id="week-{w['slug']}"><p class="scene">{e_(w['scene'])}</p><h2 style="margin-top:4px">{e_(w['question'])}</h2>
<div class="opts">{opts}</div><p class="lead" id="vote-note" style="font-size:14px;margin-top:10px"></p>
<div class="reveal" id="views"><h2>الفلاسفة قالوا إيه؟</h2>{views}
<p class="note">مفيش إجابة صح واحدة. المهم تعرف إنت اخترت ليه.</p></div></div>
<p class="report"><a href="{r}send/?err=weekly/{w['slug']}/">فيه غلط في الصفحة دي؟ قولّنا</a></p>
<p class="back"><a href="{r}weekly/">سؤال الأسبوع</a></p>
<script src="{r}assets/config.js?v={VER}"></script><script src="{r}assets/dilemma.js?v={VER}"></script>"""
        write(f"weekly/{w['slug']}/index.html", page(f"{w['title']} — ميزان", body, r, "weekly/", w["scene"], path=f"weekly/{w['slug']}/"))

    # learning paths
    tiles = "".join(f'<a class="tile" href="{p["slug"]}/"><span>{len(p["days"])} أيام</span><b>{e_(p["title"])}</b><span>{e_(p["intro"])}</span></a>' for p in paths)
    write("paths/index.html", page("مسارات — ميزان", f'<h1>مسارات</h1><p class="lead">كورسات قصيرة: درس صغير ومهمة كل يوم، 5 دقايق بس. تقدمك بيتحفظ على جهازك.</p><div class="grid">{tiles}</div>', "../", "paths/", path="paths/"))
    for p in paths:
        r = "../../"
        days = "".join(f"""<div class="day"><h3><small>اليوم {k + 1}</small><a href="{r}atlas/{d['entry']}/">{e_(by_slug[d['entry']]['name'])}</a></h3>
<p>{e_(d['lesson'])}</p><p class="task"><b>مهمة النهارده:</b> {e_(d['task'])}</p><button class="btn ghost mark">خلصت اليوم ده</button></div>""" for k, d in enumerate(p["days"]))
        body = f"""<p class="kicker">مسار — {len(p['days'])} أيام</p><h1>{e_(p['title'])}</h1><p class="lead">{e_(p['intro'])}</p>
<div id="path" data-id="{p['slug']}" data-title="{e_(p['title'])}"><p class="kicker" id="p-count"></p><div class="bar"><i id="p-bar"></i></div>{days}</div>
<div class="today" id="p-done" style="display:none"><h2>خلصت المسار!</h2><p>اعمل شهادتك وشاركها. اسمك بيتكتب على جهازك بس، ومش بيتبعت لأي حد.</p>
<label for="cert-name">اسمك زي ما تحب يتكتب</label><input type="text" id="cert-name" maxlength="40" placeholder="اسمك">
<p style="margin-top:.8rem"><button class="btn" id="cert-make">اعمل الشهادة</button> <a class="btn ghost" href="{r}quiz/">اختبر نفسك</a></p><div id="cert-out"></div></div>
<p class="report"><a href="{r}send/?err=paths/{p['slug']}/">فيه غلط في الصفحة دي؟ قولّنا</a></p>
<p class="back"><a href="{r}paths/">كل المسارات</a></p><script src="{r}assets/paths.js?v={VER}"></script>"""
        write(f"paths/{p['slug']}/index.html", page(f"{p['title']} — ميزان", body, r, "paths/", p["intro"], path=f"paths/{p['slug']}/"))

    # philosophy
    def plink(slug, r):
        if slug in by_slug: return f'<a href="{r}atlas/{slug}/">{e_(by_slug[slug]["name"])}</a>'
        if slug in p_slug: return f'<a href="{r}philosophy/{slug}/">{e_(p_slug[slug]["name"])}</a>'
        return ""
    def plist(kind):
        return "".join(f'<li><a href="{x["slug"]}/"><b>{e_(x["name"])}</b><em>{e_(x["era"])}</em><span>{e_(x["oneLine"])}</span></a></li>' for x in philo if x["kind"] == kind)
    body = f"""<p class="kicker">قسم جديد</p><h1>الفلسفة</h1><p class="lead">أكبر الأسئلة اللي سألها البشر، مشروحة بالبلدي. كل فيلسوف وكل مدرسة: الفكرة، ومثال من حياتنا، وتستخدمها إزاي النهارده، واتنقدت في إيه.</p>
{ORN}<h2>فلاسفة</h2><ul class="index">{plist("philosopher")}</ul>
{ORN}<h2>مدارس وأفكار</h2><ul class="index">{plist("school")}</ul>"""
    write("philosophy/index.html", page("الفلسفة — ميزان", body, "../", "philosophy/", "أشهر الفلاسفة والمدارس الفلسفية مشروحة بالعامية المصرية وبأمثلة من حياتنا.", path="philosophy/"))
    for x in philo:
        r = "../../"
        rel = " · ".join(filter(None, (plink(s_, r) for s_ in x.get("related", []))))
        src = "".join(f"<li>{e_(s_)}</li>" for s_ in x.get("sources", []))
        body = f"""<p class="kicker">{KIND[x['kind']]}</p><h1>{e_(x['name'])}</h1><span class="intl">{e_(x['intl'])}</span><p class="era">{e_(x['era'])}</p>
<p class="oneline">{e_(x['oneLine'])}</p>
<h2>الفكرة</h2><p>{e_(x['idea'])}</p>
<h2>من حياتنا</h2><div class="ex"><div>{e_(x['life'])}</div></div>
<h2>استخدمها النهارده</h2><p>{e_(x['useIt'])}</p>
<h2>اتنقدت في إيه؟</h2><p>{e_(x['critique'])}</p>
{f'<h2>اقرا كمان</h2><p>{rel}</p>' if rel else ''}
<h2>مصادر</h2><ul class="sources">{src}</ul>
<h2>شاركها</h2><p><a class="btn ghost" href="{r}cards/post/{x['slug']}.png" download>نزّل الكارت للبوست</a> <a class="btn ghost" href="{r}cards/og/{x['slug']}.png" download>كارت عريض</a></p>
<p class="report"><a href="{r}send/?err=philosophy/{x['slug']}/">فيه غلط في الصفحة دي؟ قولّنا</a></p>
<p class="back"><a href="{r}philosophy/">كل الفلاسفة والمدارس</a></p>"""
        ld = {"@context": "https://schema.org", "@type": "Person" if x["kind"] == "philosopher" else "DefinedTerm", "name": x["name"], "alternateName": x["intl"],
              "description": x["oneLine"], "url": f"{SITE}philosophy/{x['slug']}/"}
        write(f"philosophy/{x['slug']}/index.html", page(f"{x['name']} — ميزان", body, r, "philosophy/", x["oneLine"], f"cards/og/{x['slug']}.png", f"philosophy/{x['slug']}/", ld))

    # trends
    tiles = "".join(f'<a class="tile" href="{t["slug"]}/"><span>وزن التريند</span><b>{e_(t["title"])}</b><span>{e_(t["verdict"])}</span></a>' for t in trends)
    write("trends/index.html", page("وزن التريند — ميزان", f'<h1>وزن التريند</h1><p class="lead">كلام بيتقال كتير على السوشيال وفي القعدات. بنوزن الحجة نفسها: فيها إيه صح، وفيها إيه غلط. ومن غير ما نهاجم حد.</p><div class="grid">{tiles}</div><p class="note">سمعت كلام منتشر عايز نوزنه؟ <a href="../send/">ابعتهولنا</a>.</p>', "../", "trends/", path="trends/"))
    for t in trends:
        r = "../../"
        an = "".join(f'<div class="ex"><small>{plink(a["entry"], r)}</small><div>{e_(a["text"])}</div></div>' for a in t["analysis"])
        body = f"""<p class="kicker">وزن التريند</p><h1>{e_(t['title'])}</h1>
<p class="claim">{e_(t['claim'])}</p>
<h2>اللي فيه صح</h2><p>{e_(t['fair'])}</p>
<h2>اللي فيه غلط</h2>{an}
<h2>الوزن النهائي</h2><p class="verdict">{e_(t['verdict'])}</p>
<p class="report"><a href="{r}send/?err=trends/{t['slug']}/">فيه غلط في الصفحة دي؟ قولّنا</a></p>
<p class="back"><a href="{r}trends/">كل التريندات</a></p>"""
        write(f"trends/{t['slug']}/index.html", page(f"{t['title']} — ميزان", body, r, "trends/", t["verdict"], path=f"trends/{t['slug']}/"))

    # search
    idx = [{"t": x["name"], "k": KIND[x["kind"]], "d": x["oneLine"], "u": f"atlas/{x['slug']}/", "x": " ".join([x["intl"], x["detect"], x["respond"]] + [ex["text"] for ex in x["examples"]])} for x in entries]
    idx += [{"t": x["name"], "k": KIND[x["kind"]], "d": x["oneLine"], "u": f"philosophy/{x['slug']}/", "x": " ".join([x["intl"], x["era"], x["idea"], x["life"]])} for x in philo]
    idx += [{"t": x["title"], "k": "مسار", "d": x["intro"], "u": f"paths/{x['slug']}/", "x": " ".join(d["lesson"] for d in x["days"])} for x in paths]
    idx += [{"t": x["title"], "k": "معضلة", "d": x["question"], "u": f"dilemmas/{x['slug']}/", "x": x["scene"]} for x in dilemmas]
    idx += [{"t": x["title"], "k": "سؤال الأسبوع", "d": x["question"], "u": f"weekly/{x['slug']}/", "x": x["scene"]} for x in weekly]
    idx += [{"t": x["title"], "k": "وزن التريند", "d": x["verdict"], "u": f"trends/{x['slug']}/", "x": x["claim"]} for x in trends]
    (OUT / "search.json").write_text(json.dumps(idx, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    body = f"""<h1>بحث</h1><p class="lead">دوّر في {len(idx)} صفحة: مغالطات وانحيازات وفلاسفة ومسارات ومعضلات.</p>
<form class="search" role="search" onsubmit="return false"><input id="s-q" type="search" placeholder="مثلاً: تعميم، كانط، إعلانات" aria-label="كلمة البحث" autocomplete="off"></form>
<div id="s-out" aria-live="polite"></div><script src="../assets/search.js?v={VER}"></script>"""
    write("search/index.html", page("بحث — ميزان", body, "../", "search/", path="search/"))

    # send a fallacy
    body = f"""<h1>ابعت مغالطة شفتها</h1><p class="lead">سمعت جملة في إعلان أو بوست أو قعدة، وحسيت إن فيها حاجة غلط؟ ابعتهالنا. أحسن الجمل هتبقى ألغاز في «مغالطة اليوم» أو تريند نوزنه.</p>
<form id="send-form" class="sheet"><label for="send-text">الجملة</label><textarea id="send-text" rows="4" maxlength="600" required placeholder="اكتب الجملة زي ما اتقالت"></textarea>
<label for="send-where">سمعتها فين؟ (اختياري)</label><input type="text" id="send-where" maxlength="60" placeholder="إعلان، فيسبوك، في الشغل…">
<label for="send-guess">تفتكر فيها أنهي مغالطة؟ (اختياري)</label><input type="text" id="send-guess" maxlength="80" placeholder="مش لازم تعرف">
<input type="text" id="send-hp" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
<p style="margin-top:1rem"><button class="btn" type="submit">ابعت</button> <span id="send-status" class="lead" style="font-size:15px" aria-live="polite"></span></p></form>
<p class="note">متكتبش أسماء ناس حقيقيين ولا أرقام تليفونات. كل جملة بتتراجع بإيد إنسان قبل ما تتنشر.</p>
<script src="../assets/config.js?v={VER}"></script><script src="../assets/send.js?v={VER}"></script>"""
    write("send/index.html", page("ابعت مغالطة — ميزان", body, "../", "", "ابعت جملة سمعتها وفيها مغالطة، وممكن تبقى لغز في ميزان.", path="send/"))

    # offline
    (OUT / "offline.html").write_text(page("مفيش نت — ميزان", '<section class="hero">' + SCALE + '<h1 style="font-size:2.4rem">مفيش نت دلوقتي</h1><p class="lead">الصفحات اللي فتحتها قبل كده لسه شغالة. ارجع لما النت يرجع.</p><p><a class="btn" href="./">الرئيسية</a></p></section>', "./"), encoding="utf-8")

    # account
    body = f"""<h1>حسابي</h1><p class="lead">الحساب اختياري. بيحفظ تقدمك على أي جهاز، ويديك تحليلات أكتر في «حلّل الكلام». مش محتاج كلمة سر.</p>
<p class="lead small" id="ac-status" aria-live="polite"></p>
<section class="sheet" id="ac-login" hidden><h2 style="margin-top:0">ادخل</h2>
<p><button class="btn gbtn" id="ac-google"><svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg> ادخل بحساب جوجل</button></p>
<div class="orn" aria-hidden="true"><span></span></div>
<form id="ac-mail-form"><label for="ac-mail">أو ادخل بالإيميل: هنبعتلك رابط تدوس عليه وتدخل على طول</label>
<div class="row"><input type="email" id="ac-mail" required autocomplete="email" placeholder="name@example.com" dir="ltr"><button class="btn ghost" type="submit">ابعت الرابط</button></div></form>
<p class="note">بتسجيلك بتوافق على <a href="../privacy/">سياسة الخصوصية</a>.</p></section>
<section class="sheet" id="ac-need-email" hidden><form id="ac-need-form"><label for="ac-need-mail">الإيميل</label><div class="row"><input type="email" id="ac-need-mail" required dir="ltr"><button class="btn" type="submit">ادخل</button></div></form></section>
<section id="ac-me" hidden>
<div class="sheet"><p class="kicker" id="ac-email" dir="ltr" style="text-align:start"></p>
<label for="ac-name">اسمك (بيظهر في الشهادات)</label><div class="row"><input type="text" id="ac-name" maxlength="60"><button class="btn ghost" id="ac-save">احفظ</button></div>
<div class="stats" style="justify-content:flex-start"><div><b id="ac-plan">مجاني</b>خطتك</div><div><b id="ac-quota">…</b>تحليلات فاضلة النهارده</div></div></div>
<h2>تقدمك</h2><div class="stats wrapstats" id="ac-stats"></div>
<div class="today"><h2>ميزان بلس (قريباً)</h2><p>تحليلات أكتر كل يوم، ونصوص أطول، وتحليلاتك محفوظة. لسه بنجهزه.</p></div>
<p style="margin-top:2rem"><button class="btn ghost" id="ac-out">خروج</button> <button class="btn ghost danger" id="ac-del">امسح حسابي</button></p>
<div class="note" id="ac-del-confirm" hidden><p>متأكد؟ حسابك وكل تقدمك المحفوظ هيتمسحوا نهائي، ومش هينفع يرجعوا.</p><p><button class="btn danger-fill" id="ac-del-yes">أيوه، امسح</button> <button class="btn ghost" id="ac-del-no">لأ</button></p></div>
</section>
<script defer src="../assets/acct-page.js?v={VER}"></script>"""
    write("account/index.html", page("حسابي — ميزان", body, "../", "", "احفظ تقدمك في ميزان على أي جهاز.", path="account/"))

    # privacy
    body = """<h1>الخصوصية</h1><p class="lead">ميزان مش بيطلب منك اسم ولا إيميل ولا حساب. ودي كل البيانات اللي بتتعامل في الموقع، بالظبط.</p>
<h2>اللي بيتحفظ على جهازك بس</h2><p>نتايج الألغاز، والسلسلة، وتقدمك في المسارات، وأحسن نتيجة في الاختبارات، واختياراتك في التصويت. دي بتتحفظ في متصفحك (localStorage) ومش بتتبعت لأي حد. لو مسحت بيانات المتصفح، هتتمسح.</p>
<h2>الشهادة</h2><p>اسمك في شهادة المسار بيترسم على جهازك، ومش بيتبعت لأي سيرفر.</p>
<h2>اللي بيتبعت لسيرفر ميزان</h2>
<ul><li><b>التصويت ونتايج المعمل:</b> بنسجل اختيارك من غير اسمك. عشان كل واحد يصوّت مرة واحدة، بنحوّل عنوان الـ IP لكود مشفّر (hash) ميتعرفش منه العنوان الأصلي، وبيتمسح بعد سنة.</li>
<li><b>حلّل الكلام:</b> النص اللي بتكتبه بيتبعت لخدمة Claude من شركة Anthropic عشان يتحلل. بنحتفظ بنتيجة التحليل 30 يوم عشان لو حد كتب نفس النص ميتحللش تاني. متكتبش أسماء ولا أرقام تليفونات ولا أي بيانات شخصية.</li>
<li><b>ابعت مغالطة وبلاغات الأخطاء:</b> الجملة اللي بتبعتها بتتحفظ لحد 120 يوم عشان نراجعها بإيدينا. مش بنسجل مين بعتها.</li></ul>
<h2>لو عملت حساب (اختياري)</h2><p>الحساب مش إجباري، والموقع كله شغال من غيره. لو سجّلت دخول بجوجل أو بالإيميل، بنحفظ: إيميلك، والاسم اللي تختاره، وتقدمك (نتايج الألغاز والمسارات والاختبارات)، عشان يفضل معاك على أي جهاز. تسجيل الدخول بيتم عن طريق Firebase من جوجل، والبيانات محفوظة على Cloudflare. مش بنحفظ كلمات سر خالص. تقدر تمسح حسابك وكل بياناته من صفحة <a href="../account/">حسابي</a> في أي وقت، وبيتمسح على طول.</p>
<h2>عدّاد الزيارات</h2><p>بنستخدم Cloudflare Web Analytics عشان نعرف عدد الزيارات والصفحات اللي الناس بتحبها. مش بيستخدم كوكيز، ومش بيتتبعك من موقع لموقع.</p>
<h2>اللي مش بنعمله</h2><p>مش بنبيع بيانات، ومش بنعرض إعلانات، ومش بنستخدم كوكيز تتبع.</p>
<h2>عايز تمسح حاجة؟</h2><p>بياناتك على جهازك تقدر تمسحها من إعدادات المتصفح. ولو بعتلنا جملة وعايزها تتمسح، <a href="../send/">ابعتلنا</a> نصها، وإحنا نمسحها.</p>
<p class="note">ميزان ماشي حسب قانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020. الصفحة دي اتحدّثت نوفمبر 2026.</p>"""
    write("privacy/index.html", page("الخصوصية — ميزان", body, "../", "", "ميزان بيتعامل مع بياناتك إزاي.", path="privacy/"))

    # about
    body = """<h1>عن ميزان</h1>
<p>ميزان مشروع مفتوح هدفه يبقى أكبر مرجع عربي عن التفكير: المنطق، والانحيازات المعرفية، والأسئلة الفلسفية الكبيرة، مشروحة بالعامية المصرية وبأمثلة من حياتنا.</p>
<h2>إزاي بنشتغل</h2><p>المحتوى بيتكتب بشراكة بين إنسان متخصص وذكاء اصطناعي، وكل مدخل بيعدي على مراجعة بشرية قبل ما يتعلّم «اتراجع». أي مدخل مكتوب عليه «مسودة» لسه متراجعش.</p>
<h2>الأمانة العلمية</h2><p>بنكتب مصادر كل مدخل، وبنوضح قوة الدليل على كل انحياز. أي معلومة الدليل عليها ضعيف أو مختلف عليه، بنقول كده صراحة.</p>
<p class="note">ميزان تمرين على التفكير، مش تشخيص نفسي ولا استشارة متخصصة.</p>"""
    write("about/index.html", page("عن ميزان", body, "../", "about/"))

    write("manifest.webmanifest", json.dumps({"name": "ميزان", "short_name": "ميزان", "lang": "ar", "dir": "rtl",
        "start_url": "./", "scope": "./", "display": "standalone", "background_color": "#E9E1CC", "theme_color": "#A47E2E",
        "description": "مرجع مصري مفتوح عن المغالطات والانحيازات والفلسفة.",
        "icons": [{"src": "assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png"}, {"src": "assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
                  {"src": "assets/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}, ensure_ascii=False))
    # sitemap + robots
    sm = "".join(f"<url><loc>{SITE}{u}</loc></url>" for u in URLS)
    (OUT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{sm}</urlset>', encoding="utf-8")
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE}sitemap.xml\n", encoding="utf-8")
    # service worker
    pre = ["./", "offline.html", "daily/", "atlas/", "philosophy/", "quiz/", "search/", "search.json", "manifest.webmanifest"] + [f"assets/{f}?v={VER}" for f in ["style.css", "app.js", "daily.js", "quiz.js", "search.js"]]
    sw = (ROOT / "tools/sw.template.js").read_text(encoding="utf-8").replace("__VER__", VER).replace("__PRE__", json.dumps(pre))
    (OUT / "sw.js").write_text(sw, encoding="utf-8")
    print("built", len(entries), "entries,", len(philo), "philosophy,", len(URLS), "pages")


if __name__ == "__main__":
    build()
