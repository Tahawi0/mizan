"""Build the Mizan static site into docs/ from content/*.json."""
import json, shutil, html, hashlib
from pathlib import Path

ROOT = Path(__file__).parent
OUT = ROOT / "docs"
# المحتوى بيتراجع الأول: لو فيه غلطة، البناء بيقف ويقول الملف والحقل
import sys
sys.path.insert(0, str(ROOT / "tools"))
import validate as _validate
_errors = _validate.check(ROOT)
if _errors:
    print(f"content check failed ({len(_errors)}):", file=sys.stderr)
    for _e in _errors: print("  - " + _e, file=sys.stderr)
    sys.exit(1)
entries = json.loads((ROOT / "content/entries.json").read_text(encoding="utf-8"))
puzzles = json.loads((ROOT / "content/puzzles.json").read_text(encoding="utf-8"))
by_slug = {e["slug"]: e for e in entries}
KIND = {"fallacy": "مغالطة", "bias": "انحياز", "tool": "أداة تفكير", "philosopher": "فيلسوف", "school": "مدرسة وفكرة"}
e_ = html.escape
VER = hashlib.md5(b"".join(f.read_bytes() for f in sorted((ROOT / "assets").glob("*.js")) + [ROOT / "assets" / "style.css"])).hexdigest()[:8]
dilemmas = json.loads((ROOT / "content/dilemmas.json").read_text(encoding="utf-8"))
weekly = json.loads((ROOT / "content/weekly.json").read_text(encoding="utf-8"))
paths = json.loads((ROOT / "content/paths.json").read_text(encoding="utf-8"))
thought = json.loads((ROOT / "content/thought.json").read_text(encoding="utf-8"))
problems = json.loads((ROOT / "content/problems.json").read_text(encoding="utf-8"))
# أماكن الأمثلة بتتجمع في مواقف، عشان فهرس «إنت فين دلوقتي؟»
SITU = [("في البيت والعيلة", ["في البيت"]), ("في الشغل والدراسة", ["في الشغل", "في المدرسة", "في البيزنس"]),
        ("على السوشيال وفي الأخبار", ["على السوشيال", "في الإعلام", "في المناقشات"]),
        ("وإنت بتشتري أو بتصرف", ["في الإعلانات", "في الشراء", "في السوق", "في التقسيط", "في الفلوس", "في الاستثمار", "في العربيات", "في معرض العربيات", "في باقات النت", "في السحب"]),
        ("في الكورة والشارع", ["في الكورة", "في الشارع", "في الطريق", "في السينما", "في المجتمع"]),
        ("في الصحة والأكل", ["في الطب", "في الصحة", "في الأكل"])]
games = json.loads((ROOT / "content/games.json").read_text(encoding="utf-8"))
SITE = "https://tahawi0.github.io/mizan/"
philo = json.loads((ROOT / "content/philosophy.json").read_text(encoding="utf-8"))
trends = json.loads((ROOT / "content/trends.json").read_text(encoding="utf-8"))
p_slug = {x["slug"]: x for x in philo}
_tok = ROOT / "content/analytics.txt"
ANALYTICS = _tok.read_text().strip() if _tok.exists() else ""
URLS = []

LOGO = ('<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">'
        '<path d="M16 4v24M8 28h16"/><g class="lbeam"><path d="M5 9h22"/><path class="lpan-r" d="M9 9l-4 9h8z"/><path class="lpan-l" d="M23 9l-4 9h8z"/></g></svg>')


SCALE = """<svg class="scale" viewBox="0 0 200 150" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
<path d="M100 30v100M70 132h60M84 132l16-12 16 12"/><circle cx="100" cy="24" r="6"/>
<g class="beam"><path d="M24 46h152"/><circle cx="100" cy="46" r="3" fill="currentColor"/>
<g class="pan-r"><path d="M34 46l-18 40M34 46l18 40M10 86h48a24 9 0 0 1-48 0z"/></g>
<g class="pan-l"><path d="M166 46l-18 40M166 46l18 40M142 86h48a24 9 0 0 1-48 0z"/></g></g></svg>"""
ORN = '<div class="orn" aria-hidden="true"><span></span></div>'


# وصف خاص لكل صفحة رئيسية، بدل ما كلها تاخد نفس الوصف (جوجل بيعتبرها مكررة)
PAGE_DESC = {
    "ميزان — زِن كلامك": "ميزان: موقع مصري مجاني بيعلّمك تفكر صح. أطلس للمغالطات والانحيازات، وألعاب تفاعلية، ولغز كل يوم، وأداة بتحلل أي كلام.",
    "الأطلس — ميزان": "أطلس المغالطات والانحيازات المعرفية بالمصري: أكتر من 70 مغالطة وانحياز وأداة تفكير، لكل واحدة أمثلة من حياتنا وإزاي ترد عليها.",
    "مغالطة اليوم — ميزان": "لغز جديد كل يوم: جملة فيها مغالطة، اكشفها في دقيقة. حافظ على سلسلة أيامك، وشارك نتيجتك مع صحابك.",
    "معضلات — ميزان": "مواقف أخلاقية مفيهاش إجابة سهلة. اختار رأيك، وشوف الناس اختارت إيه، وإزاي الفلاسفة شايفين كل موقف.",
    "حلّل الكلام — ميزان": "الصق أي كلام، بوست أو خبر أو رسالة، وميزان يطلعلك المغالطات اللي فيه ويشرحها بالبلدي. مجاني.",
    "مسارات — ميزان": "كورسات قصيرة في التفكير النقدي: درس صغير ومهمة وسؤال كل يوم، 5 دقايق بس، من مبتدئ لمتقدم.",
    "وزن التريند — ميزان": "كلام منتشر على السوشيال وفي القعدات، بنوزن الحجة اللي فيه: إيه الصح، وإيه المغالطة، وإيه اللي محتاج دليل.",
    "بحث — ميزان": "دوّر في كل محتوى ميزان: المغالطات والانحيازات، والفلاسفة، والمسارات، والألعاب.",
    "عن ميزان": "ميزان مشروع مصري مفتوح ومجاني عن التفكير النقدي: ليه بدأ، وبيقدّم إيه، وإزاي تساعد فيه.",
}

def atlas_desc(e):
    """وصف صفحة الأطلس في جوجل: التعريف، ولو قصير نزوّد مثال من حياتنا."""
    d = e["oneLine"].strip()
    if len(d) < 100 and e.get("examples"):
        ex = e["examples"][0]["text"].split("—")[0].strip()
        tail = {"tool": "اعرف إمتى تستخدمها وإيه حدودها.", "bias": "اعرف ليه مخنا بيعمل كده وإزاي تاخد بالك."}.get(e.get("kind"), "اعرف إزاي تكشفها وترد عليها.")
        d = f"{d} مثال: {ex} {tail}"
    return d

def page(title, body, root, active="", desc="", img="cards/og/site.png", path="", ld=None):
    # كارت مشاركة خاص بالصفحة لو اتعمل (tools/game_cards.py)
    if img == "cards/og/site.png" and path:
        gk = "g-" + path.strip("/").replace("/", "-")
        if (ROOT / "cards" / "og" / f"{gk}.png").exists():
            img = f"cards/og/{gk}.png"
    groups = [("اتعلّم", [("atlas/", "الأطلس", "مغالطات وانحيازات"), ("tools/", "أدوات التفكير", "إزاي تفكر صح"), ("philosophy/", "الفلسفة", "فلاسفة ومدارس"), ("paths/", "مسارات", "7 أيام، 5 دقايق في اليوم"), ("trends/", "وزن التريند", "كلام منتشر بنوزنه")]),
              ("العب", [("daily/", "مغالطة اليوم", "لغز جديد كل يوم"), ("review/", "مراجعة اليوم", "دقيقتين على نقط ضعفك"), ("games/", "الساحة", "كل الألعاب في مكان واحد"), ("quiz/", "اختبر نفسك", "10 أسئلة وتحدّى صاحبك"), ("teachers/", "للمدرسين", "6 حصص جاهزة للفصل")]),
              ("قول رأيك", [("weekly/", "سؤال الأسبوع", "سؤال فلسفي وتصويت"), ("dilemmas/", "معضلات", "مواقف مفيهاش إجابة سهلة"), ("send/", "ابعت مغالطة", "جملة سمعتها وفيها غلط")])]
    def grp(name, items):
        on = any(h == active for h, _, _ in items)
        li = "".join(f'<a href="{root}{h}"{" class=active" if h == active else ""}><b>{t}</b><span>{d}</span></a>' for h, t, d in items)
        return f'<details class="dd{" on" if on else ""}"><summary>{name}</summary><div class="menu">{li}</div></details>'
    links = "".join(grp(n, it) for n, it in groups) + f'<a class="cta{" active" if active == "analyze/" else ""}" href="{root}analyze/">حلّل الكلام</a>'
    foot = [("about/", "عن ميزان"), ("teachers/", "للمدرسين"), ("privacy/", "الخصوصية"), ("search/", "بحث"), ("send/", "ابعت مغالطة")]
    flinks = "".join(f'<a href="{root}{h}">{t}</a>' for h, t in foot)
    ldj = f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>' if ld else ""
    beacon = f'<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon=\'{{"token": "{ANALYTICS}"}}\'></script>' if ANALYTICS else ""
    desc = desc or PAGE_DESC.get(title, "ميزان: مرجع مصري مفتوح عن التفكير الصح، المغالطات والانحيازات بأمثلة من حياتنا.")
    desc = " ".join(str(desc).split())
    if len(desc) > 160:  # جوجل بيقص بعد ~160 حرف، فنقص إحنا عند آخر كلمة
        desc = desc[:157].rsplit(" ", 1)[0] + "…"
    d = e_(desc)
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
<header class="top"><div class="wrap"><a class="logo" href="{root}">{LOGO}ميزان</a><div class="top-tools"><a class="icon-btn acct" id="acct-btn" href="{root}account/" aria-label="تسجيل الدخول"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg></a><button class="icon-btn snd" id="snd-btn" type="button" aria-pressed="false" aria-label="شغّل الأصوات" hidden><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path class="w" d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/><path class="x" d="M16 9l5 6M21 9l-5 6"/></svg></button><a class="icon-btn" href="{root}search/" aria-label="بحث"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg></a><button class="icon-btn burger" aria-label="القايمة" aria-expanded="false" aria-controls="mainnav"><span></span><span></span><span></span></button></div><nav id="mainnav" aria-label="الأقسام">{links}</nav></div></header>
<main><div class="wrap">{body}</div></main>
<footer><div class="wrap"><a class="logo" href="{root}">{LOGO}ميزان</a><nav class="foot-links" aria-label="روابط تانية">{flinks}</nav><p>زِن كلامك. مرجع مفتوح، اتكتب بإيد إنسان مع الذكاء الاصطناعي، وكل مدخل اتراجع قبل النشر.</p>
<button class="btn ghost" id="install" hidden>نزّل ميزان على موبايلك</button><p class="note" id="install-hint" hidden>على الآيفون: دوس زرار المشاركة في سفاري، وبعدين «إضافة إلى الشاشة الرئيسية».</p></div></footer>
<script src="{root}assets/app.js?v={VER}"></script><script src="{root}assets/motion.js?v={VER}"></script><script src="{root}assets/config.js?v={VER}"></script><script src="{root}assets/srs-core.js?v={VER}"></script><script src="{root}assets/account.js?v={VER}"></script>{beacon}
</body></html>"""


def write(rel, content):
    if rel.endswith("index.html"):
        URLS.append(rel[: -len("index.html")])
        # صفحة اتعملت من غير path كانت بتقول لجوجل إن نسختها الأصلية هي الرئيسية، فمكانتش بتتأرشف
        here = rel[: -len("index.html")]
        if here:
            content = content.replace(f'<link rel="canonical" href="{SITE}">', f'<link rel="canonical" href="{SITE}{here}">', 1)
            content = content.replace(f'<meta property="og:url" content="{SITE}">', f'<meta property="og:url" content="{SITE}{here}">', 1)
    p = OUT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8", newline="\n")


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
             ("games/", "الساحة", "كل ألعاب ميزان في مكان واحد: اكشف الحيل، واعرف انحيازاتك، وتحدّى صحابك."),
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
<p><a class="btn ghost" href="sky/">✨ شوف الأطلس كسما نجوم</a> <a class="btn ghost" href="situations/">🧭 دوّر حسب الموقف</a> <a class="btn ghost" href="../tools/">🛠 أدوات التفكير</a></p>
<div class="filters"><button class="on" data-f="all">الكل ({len(entries)})</button><button data-f="fallacy">مغالطات</button><button data-f="bias">انحيازات</button><button data-f="tool">أدوات تفكير</button></div>
<div id="g">{ix}</div>
<script>document.querySelectorAll('.filters button').forEach(function(b){{b.onclick=function(){{
document.querySelectorAll('.filters button').forEach(function(x){{x.classList.remove('on')}});b.classList.add('on');
document.querySelectorAll('#g li').forEach(function(t){{t.style.display=(b.dataset.f==='all'||t.dataset.kind===b.dataset.f)?'':'none'}});
document.querySelectorAll('#g .grp').forEach(function(g){{g.style.display=[].some.call(g.querySelectorAll('li'),function(l){{return l.style.display!=='none'}})?'':'none'}});}}}});</script>"""
    write("atlas/index.html", page("الأطلس — ميزان", body, "../", "atlas/"))
    # سماء المغالطات
    skyd = [{"s": e["slug"], "n": e["name"], "k": e["kind"], "o": e["oneLine"], "c": (e.get("notConfuse") or {}).get("slug")} for e in entries if e["kind"] != "tool"]
    lead = "الأطلس كله في سما واحدة: كل نجمة مغالطة أو انحياز، والخطوط بتوصل بين الحاجات اللي الناس بتتلخبط بينها. دوس على نجمة تنوّر قرايبها."
    body = f"""<p class="kicker"><a href="../">الأطلس</a></p><h1>سماء المغالطات</h1><p class="lead">{lead}</p>
<div id="game"></div>
<script>window.MIZAN_GAME={json.dumps({"entries": skyd}, ensure_ascii=False)};</script><script src="../../assets/sky.js?v={VER}"></script>"""
    write("atlas/sky/index.html", page("سماء المغالطات — ميزان", body, "../../", "atlas/", lead, path="atlas/sky/"))
    # دوّر حسب الموقف
    secs = ""
    for i, (n, ws) in enumerate(SITU):
        es = [e for e in entries if e["kind"] != "tool" and any(x["where"] in ws for x in e["examples"])]
        items = "".join(f'<li data-kind="{e["kind"]}"><a href="../{e["slug"]}/"><b>{e_(e["name"])}</b><em>{KIND[e["kind"]]}</em><span>{e_(next(x["text"] for x in e["examples"] if x["where"] in ws))}</span></a></li>' for e in es)
        secs += f'<section class="grp" id="s{i}"><h2>{n} <small>({len(es)})</small></h2><ul class="index">{items}</ul></section>'
    chips = "".join(f'<a class="chip" href="#s{i}">{n}</a>' for i, (n, _) in enumerate(SITU))
    lead = "إنت فين دلوقتي؟ اختار الموقف، وشوف أكتر الحيل والانحيازات اللي ممكن تقابلك فيه، مع مثال منه."
    write("atlas/situations/index.html", page("دوّر حسب الموقف — ميزان", f'<p class="kicker"><a href="../">الأطلس</a></p><h1>دوّر حسب الموقف</h1><p class="lead">{lead}</p><div class="chips">{chips}</div>{secs}', "../../", "atlas/", lead, path="atlas/situations/"))
    # أدوات التفكير
    tl = "".join(f'<li><a href="../atlas/{e["slug"]}/"><b>{e_(e["name"])}</b><em>{e_(e["intl"])}</em><span>{e_(e["oneLine"])}</span></a></li>' for e in entries if e["kind"] == "tool")
    lead = "الأطلس بيعلّمك تكشف الغلط. الأدوات دي بتعلّمك تفكر صح: أسئلة وقواعد صغيرة تستخدمها قبل ما تقرر أو تصدّق أو ترد."
    write("tools/index.html", page("أدوات التفكير — ميزان", f'<p class="kicker">اتعلّم</p><h1>أدوات التفكير</h1><p class="lead">{lead}</p><ul class="index">{tl}</ul><p class="note">كل أداة ليها حدود، ومكتوبة في صفحتها. الأداة بتساعدك تفكر، مش بتفكر بدالك.</p>', "../", "tools/", lead, path="tools/"))

    # entries
    for e in entries:
        r = "../../"
        exs = "".join(f'<div class="ex"><small>{e_(x["where"])}</small><div>{e_(x["text"])}</div></div>' for x in e["examples"])
        nc = e.get("notConfuse") or {}
        ev = f'<h2>قوة الدليل</h2><p>{e_(e["evidence"])}</p>' if e.get("evidence") else ""
        src = "".join(f"<li>{e_(s)}</li>" for s in e.get("sources", []))
        tool = e["kind"] == "tool"
        h_det, h_res = ("امتى تستخدمها", "إزاي تستخدمها") if tool else ("إزاي تكشفها", "إزاي ترد من غير خناق")
        lim = f'<h2>حدودها</h2><p>{e_(e["limits"])}</p>' if e.get("limits") else ""
        tags = sorted({n for n, ws in SITU for x in e["examples"] if x["where"] in ws})
        tagh = ('<p class="where-tags">' + ('بتنفعك: ' if tool else 'بتقابلها: ') + " ".join(f'<a class="chip" href="{r}atlas/situations/#s{[n for n, _ in SITU].index(t)}">{t}</a>' for t in tags) + "</p>") if tags else ""
        pz = next((q for q in puzzles if q.get("entry") == e["slug"]), None)
        quiz = ""
        if pz:
            qo = "".join(f'<button type="button" data-ok="{1 if i == pz["answer"] else 0}">{e_(o)}</button>' for i, o in enumerate(pz["options"]))
            quiz = f'''<section class="today eq"><p class="kicker">جرّب نفسك</p><p class="scene">{e_(pz["scene"])}</p><p>إيه المغالطة هنا؟</p><div class="opts">{qo}</div><p class="eq-why" hidden>{e_(pz.get("why", ""))}</p></section>'''
        body = f"""<p class="kicker">{KIND[e['kind']]}{"" if e.get("reviewed") else " " + status(e)}</p>
<h1>{e_(e['name'])}</h1><span class="intl">{e_(e['intl'])}</span>
<p class="oneline">{e_(e['oneLine'])}</p>
{tagh}<h2>من حياتنا</h2>{exs}
<h2>{h_det}</h2><p>{e_(e['detect'])}</p>
<h2>{h_res}</h2><p>{e_(e['respond'])}</p>{lim}
{f"<h2>متتلخبطش بينها وبين: " + (f'<a href="{r}atlas/{nc["slug"]}/">{e_(nc["name"])}</a>' if nc.get("slug") else e_(nc["name"])) + f"</h2><p>{e_(nc['diff'])}</p>" if nc else ""}
{ev}{quiz}<h2>مصادر</h2><ul class="sources">{src}</ul>
<h2>شاركها</h2><p><a class="btn ghost" href="{r}cards/post/{e['slug']}.png" download>نزّل الكارت للبوست</a> <a class="btn ghost" href="{r}cards/og/{e['slug']}.png" download>كارت عريض</a></p>
<p class="report"><a href="{r}send/?err=atlas/{e['slug']}/">فيه غلط في الصفحة دي؟ قولّنا</a></p>
<p class="back"><a href="{r}{"tools" if tool else "atlas"}/">ارجع للفهرس</a></p>
<script>document.querySelectorAll(".eq .opts button").forEach(function(b){{b.onclick=function(){{var bs=b.parentNode.querySelectorAll("button");bs.forEach(function(x){{x.disabled=true;if(x.dataset.ok==="1")x.classList.add("right");}});if(b.dataset.ok!=="1")b.classList.add("wrong");var w=document.querySelector(".eq-why");if(w&&w.textContent)w.hidden=false;}};}});</script>"""
        write(f"atlas/{e['slug']}/index.html", page(f"{e['name']} — ميزان", body, r, "atlas/", atlas_desc(e), f"cards/og/{e['slug']}.png", f"atlas/{e['slug']}/",
              {"@context": "https://schema.org", "@type": "DefinedTerm", "name": e["name"], "alternateName": e["intl"], "description": e["oneLine"], "inLanguage": "ar-EG",
               "url": f"{SITE}atlas/{e['slug']}/", "inDefinedTermSet": {"@type": "DefinedTermSet", "name": "أطلس ميزان", "url": f"{SITE}atlas/"}}))

    # daily
    body = """<p class="kicker">لغز رقم <span id="dayno"></span></p>
<h1 style="font-size:2rem">مغالطة اليوم</h1><div class="sheet"><p class="scene" id="scene"></p><div class="opts" id="opts"></div>
<div class="reveal" id="reveal"><h2 id="verdict" style="margin-top:8px"></h2><p id="why"></p>
<a class="btn ghost" id="more" href="#">اقرأ عنها في الأطلس</a> <button class="btn" id="share">شارك نتيجتك</button>
<p id="rv-link" hidden><a href="../review/">مراجعة اليوم</a> <span></span></p></div></div>
<div class="stats"><div><b id="s-streak">0</b>أيام ورا بعض</div><div><b id="s-best">0</b>أحسن سلسلة</div><div><b id="s-played">0</b>لعبت</div></div>
<p class="note">لغز جديد كل يوم.</p>
<h2 id="past-h">ألغاز فاتت</h2><p class="lead" style="font-size:15px">العبها تمرين، مش هتأثر على عدد الأيام.</p><div class="grid" id="past"></div>"""
    slugs_js = json.dumps({x["name"]: x["slug"] for x in entries}, ensure_ascii=False)
    body += f"<script>window.MIZAN_SLUGS={slugs_js};window.MIZAN_PUZZLES={json.dumps(puzzles, ensure_ascii=False)};</script><script src=\"../assets/daily.js?v={VER}\"></script>"
    write("daily/index.html", page("مغالطة اليوم — ميزان", body, "../", "daily/"))

    # مراجعة اليوم: كروت من أمثلة الأطلس وألغاز اليوم، بصناديق Leitner (assets/srs-core.js)
    write("review/index.html", page("مراجعة اليوم — ميزان", review_body(entries, puzzles), "../", "review/",
          "دقيقتين في اليوم على المغالطات اللي بتغلط فيها، بترجعلك في الوقت الصح عشان تثبت.", path="review/"))


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
    write("quiz/index.html", page("اختبر نفسك — ميزان", body, "../", "quiz/", "10 أسئلة سريعة في المغالطات المنتشرة حوالينا. بتكشف كام مغالطة من 10؟ اعرف نتيجتك في دقيقتين، وابعت الاختبار لصاحبك وشوف مين يكسب.", path="quiz/"))

    # games
    gx = "../../"
    # الساحة: كل الألعاب واللوحات في مكان واحد
    ARENA = [
        ("كل يوم", "ارجع كل يوم، فيه حاجة جديدة مستنياك.", [
            ("daily/", "مغالطة اليوم", "لغز جديد كل يوم، وسلسلة أيام ورا بعض.", "دقيقة", False),
            ("weekly/", "سؤال الأسبوع", "سؤال فلسفي كبير، صوّت وشوف الناس قالت إيه.", "دقيقتين", False)]),
        ("اكشف الغلط", "دوّر على الحيلة قبل ما تعدّي عليك.", [
            ("games/duel/", "تحدّي صاحبك", "5 أسئلة ولينك فيه نتيجتك. صاحبك يلعب نفسهم، وتتقارنوا سؤال سؤال.", "3 دقايق", True),
            ("quiz/", "اختبر نفسك", "10 أسئلة، وتحدّى صاحبك في نفس الأسئلة.", "5 دقايق", False),
            ("games/court/", "محكمة ميزان", "10 قضايا ومراحل بتتفتح ورا بعض. اعترض أول ما تسمع مغالطة.", "5 دقايق", True),
            ("games/family/", "جروب العيلة", "10 مواقف في جروب العيلة بمراحل. هترد إزاي من غير ما حد يزعل؟", "4 دقايق", True),
            ("games/spot/", "اكشف الحيلة", "10 إعلانات بمراحل، كل واحد حيله مستخبية أكتر من اللي قبله.", "5 دقايق", True),
            ("games/live/", "على الهوا", "إنت مشرف كومنتات في بث مباشر. خبّي المغالطات قبل ما تعدّي.", "3 دقايق", True)]),
        ("الأخبار والأرقام", "الأرقام والأخبار ممكن تكدب من غير ما تقول كلمة كدب.", [
            ("games/charts/", "الرسم الكداب", "10 رسوم بيانية مضللة. اكشف الحيلة، وصلّح الرسم بإيدك.", "5 دقايق", True),
            ("games/verify/", "محقق الخبر", "8 أخبار و5 أدوات تحقق. حقيقي ولا مفبرك ولا ناقص سياق؟", "6 دقايق", True),
            ("games/rumor/", "مصنع الإشاعة", "العب دور صاحب صفحة إشاعات، واتعلم الحيل من جوه عشان تكشفها.", "6 دقايق", True),
            ("games/bayes/", "شجرة الاحتمالات", "تحليل دقيق طلع إيجابي: إنت فعلاً عيان؟ خمّن، وشوف الحقيقة.", "4 دقايق", True)]),
        ("اعرف نفسك", "مخك بيتأثر بإيه من غير ما تاخد بالك؟", [
            ("games/lab/", "معمل الانحيازات", "4 تجارب علم نفس حقيقية تتعمل عليك.", "4 دقايق", False),
            ("games/philosopher/", "أنهي فيلسوف إنت؟", "8 أسئلة خفيفة… وفي الآخر مفاجأة.", "3 دقايق", False),
            ("games/profile/", "بصمتك المعرفية", "15 موقف، وفي الآخر رسم لأكتر انحيازات بتأثر عليك.", "4 دقايق", True),
            ("games/calibration/", "ميزان الثقة", "10 مراحل: معلوماتك قد ثقتك؟", "4 دقايق", True)]),
        ("ابني صح", "مش بس تكشف الغلط، اتعلم تقول الكلام صح.", [
            ("games/escape/", "غرفة الهروب", "10 أوض بمراحل، وكل باب قفله بيتفتح بالتفكير بس.", "8 دقايق", True),
            ("games/argue/", "ابني الحجة", "10 مستويات بتعلّمك المنطق نفسه: اختار المقدمات اللي تثبت النتيجة.", "5 دقايق", True),
            ("games/fix/", "صلّح الحجة", "10 مراحل: اختار إزاي الجملة تتقال من غير الغلط.", "4 دقايق", True),
            ("games/debate/", "ناظر زِنة", "6 مناظرات جاهزة بمراحل، ومناظرة حرة بالذكاء الاصطناعي.", "5 دقايق", True)]),
        ("قول رأيك", "مواقف مفيهاش إجابة سهلة.", [
            ("dilemmas/", "معضلات", "24 موقف صعب، صوّت وشوف الفلاسفة قالوا إيه.", "دقيقتين", False)]),
        ("لوحات", "شوف الناس بتفكر إزاي، وإنت فين منهم.", [
            ("games/league/", "دوري ميزان", "ترتيب أسبوعي بلقب تختاره. العب كل يوم، واجمع نقط، واطلع الأول.", "كل يوم", True),
            ("games/mirror/", "مرآة الناس", "لوحة حية بنتايج كل التصويت والتجارب: الناس اختارت إيه، ووقعت في إيه.", "دقيقتين", True),
            ("games/skills/", "شجرة مهاراتك", "خريطة بتنوّر كل ما تتعلم: شوف إنت قوي في إيه ومحتاج تكبّر إيه.", "دقيقة", True),
            ("atlas/sky/", "سماء المغالطات", "الأطلس كله نجوم، والخطوط بتوصل بين الحاجات اللي بتتلخبط مع بعض.", "دقيقتين", True)]),
    ]
    def atile(h, t, d, m, new):
        badge = '<em class="new">جديد</em>' if new else ''
        return f'<a class="tile atile" href="../{h}"><span class="meta">{m}{badge}</span><b>{t}</b><span>{d}</span></a>'
    secs = "".join(f'<section class="arena-sec"><h2>{n}</h2><p class="lead">{l}</p><div class="grid">{"".join(atile(*g) for g in gs)}</div></section>' for n, l, gs in ARENA)
    count = sum(len(gs) for _, _, gs in ARENA)
    START = [("أكشف الكلام الغلط", [("daily/", "مغالطة اليوم", "لغز واحد، دقيقة واحدة."), ("games/court/", "محكمة ميزان", "اعترض أول ما تسمع مغالطة.")]),
             ("أفهم مخي بيفكر إزاي", [("games/profile/", "بصمتك المعرفية", "15 موقف، وكارت بأكتر انحيازاتك."), ("games/lab/", "معمل الانحيازات", "تجارب علم نفس حقيقية عليك.")]),
             ("مصدّقش أي خبر أو رقم", [("games/verify/", "محقق الخبر", "حقق قبل ما تصدّق."), ("games/charts/", "الرسم الكداب", "الأرقام كمان بتكدب.")]),
             ("أناقش وأرد أحسن", [("games/family/", "جروب العيلة", "رد ذكي من غير ما حد يزعل."), ("games/debate/", "ناظر زِنة", "ناظر بومة بتحب الجدال.")])]
    chips = "".join(f'<button type="button" class="chip{" on" if i == 0 else ""}" data-i="{i}">{t}</button>' for i, (t, _) in enumerate(START))
    picks = "".join(f'<div class="grid start-picks" data-i="{i}"{"" if i == 0 else " hidden"}>' + "".join(f'<a class="tile atile" href="../{h}"><b>{t}</b><span>{d}</span></a>' for h, t, d in gs) + '</div>' for i, (_, gs) in enumerate(START))
    starter = f'''<section class="start-here"><h2>أول مرة هنا؟ ابدأ من هنا</h2><p class="lead">عايز تتعلم إيه؟</p><div class="chips">{chips}</div>{picks}</section>
<script>document.querySelectorAll(".start-here .chip").forEach(function(b){{b.onclick=function(){{document.querySelectorAll(".start-here .chip").forEach(function(x){{x.classList.toggle("on",x===b)}});document.querySelectorAll(".start-picks").forEach(function(g){{g.hidden=g.dataset.i!==b.dataset.i}})}}}});</script>'''
    body = f'''<div class="arena-hero"><p class="kicker">العب واتعلم</p><h1>الساحة</h1><p class="lead">{count} لعبة ولوحة في مكان واحد. كل واحدة بتاخد دقايق، وبتعلمك حاجة عن طريقة تفكيرك.</p></div>{starter}{secs}'''
    write("games/index.html", page("الساحة — ميزان", body, "../", "games/", "الساحة: كل ألعاب ميزان في مكان واحد. تجارب علم نفس، وكشف حيل، ومعضلات، وتحدي صحابك.", path="games/"))
    names_js = json.dumps({x["slug"]: x["name"] for x in entries}, ensure_ascii=False)
    pn = json.dumps({k: {"name": p_slug[k]["name"]} for k in games["phil"]["results"]}, ensure_ascii=False)
    spec = {
        "lab": ("معمل الانحيازات", "التجارب دي اتعملت قبل كده على آلاف الناس في دراسات مشهورة. جاوب بسرعة وبصراحة، وبعدين شوف مخك اتأثر إزاي. الإجابات مجهولة، ومش بنسجل أي حاجة عنك.", {"lab": games["lab"]}, True),
        "spot": ("اكشف الحيلة", "الإعلانات دي متألفة لماركات مش موجودة. دوس على أي جملة شايف فيها حيلة، وبعدين دوس «خلصت».", {"spot": games["spot"]}, False),
        "philosopher": ("أنهي فيلسوف إنت؟", "8 أسئلة خفيفة عن مواقف من حياتك، اختار الأقرب ليك من غير ما تفكر كتير. وفي الآخر هتعرف أنهي فيلسوف بيفكر زيك، وليه.", {"phil": games["phil"]}, False),
        "calibration": ("ميزان الثقة", "10 مراحل، كل مرحلة 5 جمل: قول صح ولا غلط، وبعدين قول إنت متأكد بنسبة قد إيه. النجوم بتتحسب على قد ما ثقتك قريبة من معلوماتك.", {"calib": games["calibStages"]}, False),
        "fix": ("صلّح الحجة", "10 مراحل، كل جملة فيها غلط. اختار الصياغة اللي بتقول نفس الفكرة من غير الغلط، وخلي بالك: الصياغات الغلط فيها مغالطات تانية مستخبية.", {"fix": games["fixStages"]}, False)}
    gid = {"lab": "lab", "spot": "spot", "philosopher": "phil", "calibration": "calib", "fix": "fix"}
    for slug, (title, lead, data, api) in spec.items():
        data["philNames"] = json.loads(pn)
        body = f"""<p class="kicker"><a href="{gx}games/">الساحة</a></p><h1>{title}</h1><p class="lead">{lead}</p>
<div id="game" data-game="{gid[slug]}"{' class="sheet"' if slug != "lab" else ''}></div>
<script>window.MIZAN_GAME={json.dumps(data, ensure_ascii=False)};window.MIZAN_NAMES={names_js};</script>{f'<script src="{gx}assets/config.js?v={VER}"></script>' if api else ''}<script src="{gx}assets/stages.js?v={VER}"></script><script src="{gx}assets/games.js?v={VER}"></script>"""
        write(f"games/{slug}/index.html", page(f"{title} — ميزان", body, gx, "games/", lead, path=f"games/{slug}/"))

    # ألعاب الساحة الجديدة: كل لعبة ملف JS لوحدها
    NEW_GAMES = {
        "court": ("محكمة ميزان", "إنت القاضي في 10 قضايا، كل واحدة أصعب من اللي قبلها، وآخرهم قضية الزعيم. اعترض أول ما تسمع مغالطة، واحكم على الأدلة السليمة بس.", "court"),
        "family": ("جروب العيلة", "الرسايل بدأت تنزل في جروب العيلة، وفيها كلام غلط. اختار ردك: هتهاجم، ولا تسكت، ولا ترد بهدوء وذكاء؟", "family"),
        "escape": ("غرفة الهروب", "10 أوض ورا بعض، وكل باب عليه قفل بيتفتح بالمنطق. اخرج في أقل وقت، وتحدّى صحابك.", "escape"),
        "argue": ("ابني الحجة", "قدامك نتيجة، وكروت مقدمات. اختار المقدمتين اللي لو صح، النتيجة لازم تبقى صح. وخلي بالك من الكروت اللي شكلها مقنع.", "argue"),
        "charts": ("الرسم الكداب", "الرسوم البيانية ممكن تكدب من غير ما رقم واحد يبقى غلط. اكشف الحيلة، وصلّح الرسم بإيدك، وبعدين احكم على العنوان.", "charts"),
        "rumor": ("مصنع الإشاعة", "العب دور صاحب صفحة بتنشر إشاعات، واتعلم 6 حيل تضليل من جوه. وفي الآخر، هتبقى إنت المحقق.", "rumor"),
        "verify": ("محقق الخبر", "خبر وصلك على الموبايل. استخدم أدوات التحقق اللي محتاجها بس، واحكم: حقيقي، ولا مفبرك، ولا ناقص سياق، ولا قديم واتعاد نشره؟", "verify"),
        "live": ("على الهوا", "إنت مشرف الكومنتات في بث مباشر. خبّي الكومنت اللي فيه مغالطة قبل ما يعدّي، وسيب الرأي المختلف في حاله.", "live"),
        "debate": ("ناظر زِنة", "زِنة هتاخد الرأي العكسي وتناظرك. في المراحل الجاهزة بتختار ردك، وفي المناظرة الحرة بتكتب بإيدك والذكاء الاصطناعي بيرد ويقولك لو وقعت في مغالطة.", "debate"),
        "bayes": ("شجرة الاحتمالات", "من أشهر الأسئلة اللي بيغلط فيها الناس وحتى الأطبا: لو التحليل طلع إيجابي، احتمال إنك عيان قد إيه؟", "bayes"),
        "profile": ("بصمتك المعرفية", "15 موقف من حياتنا. جاوب بصراحة، وفي الآخر هتشوف أكتر الانحيازات اللي بتأثر على قراراتك، في كارت تقدر تشاركه.", "profile"),
    }
    for slug, (title, lead, src) in NEW_GAMES.items():
        data = json.loads((ROOT / "content" / f"{src}.json").read_text(encoding="utf-8"))
        body = f"""<p class="kicker"><a href="{gx}games/">الساحة</a></p><h1>{title}</h1><p class="lead">{lead}</p>
<div id="game" class="sheet"></div>
<p class="report"><a href="{gx}send/?err=games/{slug}/">فيه غلط في الصفحة دي؟ قولّنا</a></p>
<script>window.MIZAN_GAME={json.dumps(data, ensure_ascii=False)};window.MIZAN_NAMES={names_js};</script><script src="{gx}assets/stages.js?v={VER}"></script><script src="{gx}assets/{slug}.js?v={VER}"></script>"""
        write(f"games/{slug}/index.html", page(f"{title} — ميزان", body, gx, "games/", lead, path=f"games/{slug}/"))

    # تحدّي صاحبك
    lead = "تحدّي صاحبك في 5 أسئلة مغالطات. كل البيانات جوه اللينك نفسه، ومش بنحفظ أي حاجة على السيرفر."
    body = f"""<p class="kicker"><a href="{gx}games/">الساحة</a></p><h1>تحدّي صاحبك</h1><p class="lead">{lead}</p>
<div id="game" class="sheet"></div>
<script>window.MIZAN_PUZZLES={json.dumps([{k: p[k] for k in ("id", "scene", "options", "answer", "why", "entry")} for p in puzzles], ensure_ascii=False)};window.MIZAN_NAMES={names_js};</script><script src="{gx}assets/duel.js?v={VER}"></script>"""
    write("games/duel/index.html", page("تحدّي صاحبك — ميزان", body, gx, "games/", lead, path="games/duel/"))

    # شجرة مهاراتك
    def cnt(src, k):
        return len(json.loads((ROOT / "content" / f"{src}.json").read_text(encoding="utf-8"))[k])
    skg = {"court": {"key": "mizan-court", "n": 10}, "family": {"key": "mizan-family-stages", "n": 10}, "spot": {"key": "mizan-spot-stages", "n": len(games["spot"])},
           "calib": {"key": "mizan-calib-stages", "n": len(games["calibStages"])}, "fix": {"key": "mizan-fix-stages", "n": len(games["fixStages"])},
           "escape": {"key": "mizan-escape-stages", "n": cnt("escape", "rooms")}, "argue": {"key": "mizan-argue-stages", "n": cnt("argue", "levels")},
           "charts": {"key": "mizan-charts-stages", "n": cnt("charts", "stages")}, "verify": {"key": "mizan-verify-stages", "n": cnt("verify", "cases")},
           "rumor": {"key": "mizan-rumor-stages", "n": cnt("rumor", "levels") + 1}, "live": {"key": "mizan-live-stages", "n": cnt("live", "episodes")},
           "debate": {"key": "mizan-debate-stages", "n": cnt("debate", "topics")}}
    skills = [
        {"name": "كشف المغالطات", "icon": "🔍", "desc": "إنك تمسك الغلط في الكلام أول ما تسمعه.", "src": ["daily", "quiz", "court", "live"], "go": [["daily/", "مغالطة اليوم"], ["games/court/", "محكمة ميزان"], ["games/live/", "على الهوا"]]},
        {"name": "معرفة النفس", "icon": "🧠", "desc": "إنك تعرف مخك بيتأثر بإيه من غير ما تاخد بالك.", "src": ["lab", "profile", "calib"], "go": [["games/lab/", "معمل الانحيازات"], ["games/profile/", "بصمتك المعرفية"], ["games/calibration/", "ميزان الثقة"]]},
        {"name": "المنطق", "icon": "🧩", "desc": "إنك تبني حجة سليمة وتحل الألغاز بالتفكير.", "src": ["argue", "escape", "fix"], "go": [["games/argue/", "ابني الحجة"], ["games/escape/", "غرفة الهروب"], ["games/fix/", "صلّح الحجة"]]},
        {"name": "الإعلام", "icon": "📰", "desc": "إنك تكشف الخبر المضلل والإعلان الملعوب فيه.", "src": ["verify", "rumor", "spot"], "go": [["games/verify/", "محقق الخبر"], ["games/rumor/", "مصنع الإشاعة"], ["games/spot/", "اكشف الحيلة"]]},
        {"name": "الأرقام", "icon": "📊", "desc": "إنك تقرا الرسوم والاحتمالات من غير ما تتضحك عليك.", "src": ["charts", "bayes"], "go": [["games/charts/", "الرسم الكداب"], ["games/bayes/", "شجرة الاحتمالات"]]},
        {"name": "الحوار", "icon": "💬", "desc": "إنك ترد بهدوء وذكاء، وتناظر من غير ما تهاجم.", "src": ["family", "debate", "debateAi", "duel"], "go": [["games/family/", "جروب العيلة"], ["games/debate/", "ناظر زِنة"], ["games/duel/", "تحدّي صاحبك"]]},
        {"name": "الفلسفة", "icon": "🏛", "desc": "إنك تفكر في الأسئلة الكبيرة اللي مفيهاش إجابة سهلة.", "src": ["dilemmas", "paths"], "go": [["dilemmas/", "معضلات"], ["paths/", "المسارات"], ["weekly/", "سؤال الأسبوع"]]}]
    lead = "خريطة لمهاراتك في التفكير، بتنوّر كل ما تلعب وتتعلم. دوس على أي مهارة تعرف تكبّرها إزاي."
    body = f"""<p class="kicker"><a href="{gx}games/">الساحة</a></p><h1>شجرة مهاراتك</h1><p class="lead">{lead}</p>
<div id="game"></div>
<script>window.MIZAN_GAME={json.dumps({"games": skg, "skills": skills}, ensure_ascii=False)};</script><script src="{gx}assets/skills.js?v={VER}"></script>"""
    write("games/skills/index.html", page("شجرة مهاراتك — ميزان", body, gx, "games/", lead, path="games/skills/"))

    # مرآة الناس
    ins = {"anchor": "لو متوسط اللي شافوا رقم 75 أعلى من اللي شافوا 15، يبقى رقم ملوش علاقة غيّر تقديرهم. الإجابة الصح 54.",
           "framing": "الخطتين واحد بالظبط بالأرقام. لو النسبتين مختلفين، يبقى الصياغة لوحدها هي اللي غيّرت القرار.",
           "linda": "الاختيار التاني مستحيل يكون أكتر احتمالاً من الأول. كل اللي اختاروه وقعوا في «مغالطة الاقتران».",
           "decoy": "لو النسبة أعلى عند اللي شافوا 3 اختيارات، يبقى الاختيار الطُعم اشتغل عليهم."}
    mlab = [{"id": x["id"], "title": x["title"], "groupNames": x["groupNames"], "num": bool(x["groups"][0].get("num")), "metric": x.get("metric", 0), "metricLabel": x.get("metricLabel", ""), "insight": ins.get(x["id"], "")} for x in games["lab"]]
    mitems = [{"id": d["slug"], "title": d["title"], "opts": d["options"], "url": f"dilemmas/{d['slug']}/"} for d in dilemmas] + [{"id": "week-" + w["slug"], "title": w["title"], "opts": w["options"], "url": f"weekly/{w['slug']}/"} for w in weekly] + [{"id": "thought-" + t["slug"], "title": t["title"], "opts": t["options"], "url": f"philosophy/thought/{t['slug']}/"} for t in thought]
    lead = "لوحة حية بتجمع كل تصويت المعضلات وسؤال الأسبوع، ونتايج تجارب المعمل. شوف الناس بتفكر إزاي، ووقعت في أنهي فخ."
    body = f"""<p class="kicker"><a href="{gx}games/">الساحة</a></p><h1>مرآة الناس</h1><p class="lead">{lead}</p>
<div id="game"></div>
<script>window.MIZAN_GAME={json.dumps({"lab": mlab, "items": mitems, "gameNames": {"court": "محكمة ميزان", "family": "جروب العيلة", "escape": "غرفة الهروب", "argue": "ابني الحجة", "spot": "اكشف الحيلة", "calib": "ميزان الثقة", "fix": "صلّح الحجة", "charts": "الرسم الكداب", "verify": "محقق الخبر", "rumor": "مصنع الإشاعة", "live": "على الهوا", "debate": "ناظر زِنة", "quiz": "اختبر نفسك", "bayes": "شجرة الاحتمالات", "duel": "تحدّي صاحبك", "review": "مراجعة اليوم"}}, ensure_ascii=False)};</script><script src="{gx}assets/config.js?v={VER}"></script><script src="{gx}assets/mirror.js?v={VER}"></script>"""
    write("games/mirror/index.html", page("مرآة الناس — ميزان", body, gx, "games/", lead, path="games/mirror/"))

    # دوري ميزان
    lg = [{"id": "daily", "name": "مغالطة اليوم", "url": "daily/", "rule": "10 نقط لو حليتها صح، و2 لو حاولت."},
          {"id": "quiz", "name": "اختبر نفسك", "url": "quiz/", "rule": "نقطة لكل إجابة صح."},
          {"id": "court", "name": "محكمة ميزان", "url": "games/court/", "rule": "درجتك في القضية من 10."},
          {"id": "escape", "name": "غرفة الهروب", "url": "games/escape/", "rule": "10 لو خرجت في 3 دقايق، والنقط بتقل كل ما الوقت يزيد."},
          {"id": "argue", "name": "ابني الحجة", "url": "games/argue/", "rule": "على حسب الحجج اللي بنيتها صح من أول محاولة."},
          {"id": "family", "name": "جروب العيلة", "url": "games/family/", "rule": "درجة ردك في المرحلة من 10."},
          {"id": "charts", "name": "الرسم الكداب", "url": "games/charts/", "rule": "درجتك في الرسم من 10."},
          {"id": "verify", "name": "محقق الخبر", "url": "games/verify/", "rule": "10 لو حكمت صح بأدوات قليلة."},
          {"id": "live", "name": "على الهوا", "url": "games/live/", "rule": "على حسب المغالطات اللي خبيتها."},
          {"id": "rumor", "name": "مصنع الإشاعة", "url": "games/rumor/", "rule": "درجتك في المرحلة من 10."},
          {"id": "debate", "name": "ناظر زِنة", "url": "games/debate/", "rule": "متوسط قوة ردودك في المناظرة."},
          {"id": "duel", "name": "تحدّي صاحبك", "url": "games/duel/", "rule": "نقطتين لكل إجابة صح لما تقبل تحدّي."}]
    lead = "ترتيب أسبوعي لأصحاب الحسابات. اختار لقب، والعب كل يوم، واجمع نقط. الترتيب بيتصفّر كل سبت."
    body = f"""<p class="kicker"><a href="{gx}games/">الساحة</a></p><h1>دوري ميزان</h1><p class="lead">{lead}</p>
<div id="game"></div>
<script>window.MIZAN_GAME={json.dumps({"games": lg}, ensure_ascii=False)};</script><script src="{gx}assets/config.js?v={VER}"></script><script src="{gx}assets/league.js?v={VER}"></script>"""
    write("games/league/index.html", page("دوري ميزان — ميزان", body, gx, "games/", lead, path="games/league/"))

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
    LV = [("مبتدئ", "ابدأ هنا"), ("متوسط", "الخطوة التانية"), ("متقدم", "لما تتمكّن")]
    road = ""
    for n, (lv, sub) in enumerate(LV, 1):
        tiles = "".join(f'<a class="tile" href="{p["slug"]}/"><span>{len(p["days"])} أيام · {lv}</span><b>{e_(p["title"])}</b><span>{e_(p["intro"])}</span></a>' for p in paths if p.get("level", "مبتدئ") == lv)
        road += f'<section class="road"><h2><span class="road-no">{n}</span> {lv} <small>· {sub}</small></h2><div class="grid">{tiles}</div></section>'
    write("paths/index.html", page("مسارات — ميزان", f'<h1>مسارات</h1><p class="lead">{len(paths)} كورسات قصيرة: درس صغير ومهمة وسؤال كل يوم، 5 دقايق بس. ماشية بالترتيب من مبتدئ لمتقدم، وتقدمك بيتحفظ على جهازك.</p>{road}', "../", "paths/", path="paths/"))
    def dlink(slug, r):
        if slug in by_slug: return f'<a href="{r}atlas/{slug}/">{e_(by_slug[slug]["name"])}</a>'
        return f'<a href="{r}philosophy/{slug}/">{e_(p_slug[slug]["name"])}</a>'
    def dq(d):
        q = d.get("q")
        if not q: return ""
        bs = "".join(f'<button type="button" data-ok="{1 if i == q["a"] else 0}">{e_(o)}</button>' for i, o in enumerate(q["opts"]))
        return f'<div class="dq"><p><b>سؤال سريع:</b> {e_(q["q"])}</p><div class="opts">{bs}</div></div>'
    for p in paths:
        r = "../../"
        days = "".join(f"""<div class="day"><h3><small>اليوم {k + 1}</small>{dlink(d['entry'], r)}</h3>
<p>{e_(d['lesson'])}</p><p class="task"><b>مهمة النهارده:</b> {e_(d['task'])}</p>{dq(d)}<button class="btn ghost mark">خلصت اليوم ده</button></div>""" for k, d in enumerate(p["days"]))
        body = f"""<p class="kicker">مسار — {len(p['days'])} أيام · {p.get("level", "مبتدئ")}</p><h1>{e_(p['title'])}</h1><p class="lead">{e_(p['intro'])}</p>
<div id="path" data-id="{p['slug']}" data-title="{e_(p['title'])}"><p class="kicker" id="p-count"></p><div class="bar"><i id="p-bar"></i></div>{days}</div>
<div class="today" id="p-done" style="display:none"><h2>خلصت المسار!</h2><p>اعمل شهادتك وشاركها. اسمك بيتكتب على جهازك بس، ومش بيتبعت لأي حد.</p>
<label for="cert-name">اسمك زي ما تحب يتكتب</label><input type="text" id="cert-name" maxlength="40" placeholder="اسمك">
<p style="margin-top:.8rem"><button class="btn" id="cert-make">اعمل الشهادة</button> <a class="btn ghost" href="{r}quiz/">اختبر نفسك</a></p><div id="cert-out"></div></div>
<p class="report"><a href="{r}send/?err=paths/{p['slug']}/">فيه غلط في الصفحة دي؟ قولّنا</a></p>
<p class="back"><a href="{r}paths/">كل المسارات</a></p><script src="{r}assets/paths.js?v={VER}"></script>
<script>document.querySelectorAll(".dq .opts button").forEach(function(b){{b.onclick=function(){{b.parentNode.querySelectorAll("button").forEach(function(x){{x.disabled=true;if(x.dataset.ok==="1")x.classList.add("right");}});if(b.dataset.ok!=="1")b.classList.add("wrong");}};}});</script>"""
        write(f"paths/{p['slug']}/index.html", page(f"مسار {p['title']} — ميزان", body, r, "paths/", p["intro"], path=f"paths/{p['slug']}/"))

    # philosophy
    def plink(slug, r):
        if slug in by_slug: return f'<a href="{r}atlas/{slug}/">{e_(by_slug[slug]["name"])}</a>'
        if slug in p_slug: return f'<a href="{r}philosophy/{slug}/">{e_(p_slug[slug]["name"])}</a>'
        return ""
    def plist(kind):
        return "".join(f'<li><a href="{x["slug"]}/"><b>{e_(x["name"])}</b><em>{e_(x["era"])}</em><span>{e_(x["oneLine"])}</span></a></li>' for x in philo if x["kind"] == kind)
    body = f"""<p class="kicker">قسم جديد</p><h1>الفلسفة</h1><p class="lead">أكبر الأسئلة اللي سألها البشر، مشروحة بالبلدي. كل فيلسوف وكل مدرسة: الفكرة، ومثال من حياتنا، وتستخدمها إزاي النهارده، واتنقدت في إيه.</p>
<div class="grid"><a class="tile" href="problems/"><span>جديد</span><b>الفلاسفة بيردوا على مشكلتك</b><span>قلقان، أو محتار، أو حاسس بظلم؟ شوف 3 مدارس هتقولك إيه.</span></a><a class="tile" href="thought/"><span>جديد</span><b>تجارب ذهنية</b><span>{len(thought)} تجربة غيّرت طريقة تفكيرنا. فكّر وصوّت.</span></a><a class="tile" href="../tools/"><span>جديد</span><b>أدوات التفكير</b><span>قواعد صغيرة تفكر بيها صح.</span></a></div>
{ORN}<h2>فلاسفة</h2><ul class="index">{plist("philosopher")}</ul>
{ORN}<h2>مدارس وأفكار</h2><ul class="index">{plist("school")}</ul>"""
    write("philosophy/index.html", page("الفلسفة — ميزان", body, "../", "philosophy/", "أشهر الفلاسفة والمدارس الفلسفية مشروحة بالعامية المصرية وبأمثلة من حياتنا.", path="philosophy/"))
    # تجارب ذهنية
    tiles = "".join(f'<a class="tile" href="{t["slug"]}/"><span>{e_(t["by"])}</span><b>{e_(t["title"])}</b><span>{e_(t["question"])}</span></a>' for t in thought)
    lead = "تجارب بتتعمل في الدماغ بس، ومن غير معمل. كل واحدة فيها سؤال صعب: فكّر، وصوّت، وشوف الفلاسفة قالوا إيه."
    write("philosophy/thought/index.html", page("تجارب ذهنية — ميزان", f'<p class="kicker"><a href="../">الفلسفة</a></p><h1>تجارب ذهنية</h1><p class="lead">{lead}</p><div class="grid">{tiles}</div>', "../../", "philosophy/", lead, path="philosophy/thought/"))
    for t in thought:
        r = "../../../"
        opts = "".join(f"<button>{e_(o)}</button>" for o in t["options"])
        views = "".join(f'<div class="ex"><small>{e_(v["who"])}</small><div>{e_(v["says"])}</div></div>' for v in t["views"])
        rel = " · ".join(filter(None, (plink(s_, r) for s_ in t.get("related", []))))
        src = "".join(f"<li>{e_(s_)}</li>" for s_ in t.get("sources", []))
        body = f"""<p class="kicker"><a href="../">تجارب ذهنية</a></p><h1>{e_(t['title'])}</h1><p class="era">{e_(t['by'])}</p>
<div class="sheet" id="dilemma" data-id="thought-{t['slug']}"><p class="scene">{e_(t['story'])}</p><h2 style="margin-top:4px">{e_(t['question'])}</h2>
<div class="opts">{opts}</div><p class="lead" id="vote-note" style="font-size:14px;margin-top:10px"></p>
<div class="reveal" id="views"><h2>الفلاسفة قالوا إيه؟</h2>{views}<h2>ليه ده مهم النهارده؟</h2><p>{e_(t['why'])}</p></div></div>
{f'<p class="related">اقرا كمان: {rel}</p>' if rel else ''}<h2>مصادر</h2><ul class="sources">{src}</ul>
<p class="report"><a href="{r}send/?err=philosophy/thought/{t['slug']}/">فيه غلط في الصفحة دي؟ قولّنا</a></p>
<p class="back"><a href="../">كل التجارب</a></p>
<script src="{r}assets/config.js?v={VER}"></script><script src="{r}assets/dilemma.js?v={VER}"></script>"""
        write(f"philosophy/thought/{t['slug']}/index.html", page(f"{t['title']} — ميزان", body, r, "philosophy/", t["question"] + " " + t["story"], path=f"philosophy/thought/{t['slug']}/"))
    # الفلاسفة بيردوا على مشكلتك
    chips = "".join(f'<button type="button" class="chip{" on" if i == 0 else ""}" data-i="{i}">{e_(q["title"])}</button>' for i, q in enumerate(problems))
    cards = ""
    for i, q in enumerate(problems):
        ans = "".join(f'<div class="ex"><small>{plink(a["school"], "../../")}</small><div>{e_(a["says"])}</div><p class="task"><b>جرّب النهارده:</b> {e_(a["try"])}</p></div>' for a in q["answers"])
        note = f'<p class="note">{e_(q["note"])}</p>' if q.get("note") else ""
        cards += f'<section class="prob" data-i="{i}"{"" if i == 0 else " hidden"}><h2>{e_(q["title"])}</h2><p class="lead">{e_(q["feel"])}</p>{ans}{note}</section>'
    lead = "اختار اللي حاسس بيه، وشوف 3 مدارس فلسفية هتقولك إيه، ومعاها حاجة صغيرة تجربها النهارده."
    body = f'''<p class="kicker"><a href="../">الفلسفة</a></p><h1>الفلاسفة بيردوا على مشكلتك</h1><p class="lead">{lead}</p><div class="chips">{chips}</div>{cards}
<p class="note">ده تفكير فلسفي يساعدك تشوف الموضوع من زوايا تانية، مش علاج ولا استشارة نفسية.</p>
<script>document.querySelectorAll(".chips .chip").forEach(function(b){{b.onclick=function(){{document.querySelectorAll(".chips .chip").forEach(function(x){{x.classList.toggle("on",x===b)}});document.querySelectorAll(".prob").forEach(function(g){{g.hidden=g.dataset.i!==b.dataset.i}})}}}});</script>'''
    write("philosophy/problems/index.html", page("الفلاسفة بيردوا على مشكلتك — ميزان", body, "../../", "philosophy/", lead, path="philosophy/problems/"))

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
    idx += [{"t": t, "k": "لعبة", "d": d, "u": h, "x": n} for n, _, gs in ARENA for h, t, d, _, _ in gs if h.startswith(("games/", "quiz/", "daily/"))]
    idx.append({"t": "مراجعة اليوم", "k": "لعبة", "d": "دقيقتين في اليوم على المغالطات اللي بتغلط فيها.", "u": "review/", "x": "تكرار متباعد نقط ضعفك"})
    (OUT / "search.json").write_text(json.dumps(idx, ensure_ascii=False, separators=(",", ":")), encoding="utf-8", newline="\n")
    body = f"""<h1>بحث</h1><p class="lead">دوّر في {len(idx)} صفحة: مغالطات وانحيازات وفلاسفة ومسارات ومعضلات.</p>
<form class="search" role="search" onsubmit="return false"><input id="s-q" type="search" placeholder="مثلاً: تعميم، كانط، إعلانات" aria-label="كلمة البحث" autocomplete="off"></form>
<div id="s-out" aria-live="polite"></div><script src="../assets/search-core.js?v={VER}"></script><script src="../assets/search.js?v={VER}"></script>"""
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
    (OUT / "offline.html").write_text(page("مفيش نت — ميزان", '<section class="hero">' + SCALE + '<h1 style="font-size:2.4rem">مفيش نت دلوقتي</h1><p class="lead">الصفحات اللي فتحتها قبل كده لسه شغالة. ارجع لما النت يرجع.</p><p><a class="btn" href="./">الرئيسية</a></p></section>', "./"), encoding="utf-8", newline="\n")

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
<div class="note" id="ac-del-confirm" hidden><p>متأكد؟ حسابك وكل تقدمك المحفوظ ونقطك في الدوري هيتمسحوا نهائي، ومش هينفع يرجعوا.</p><p><button class="btn danger-fill" id="ac-del-yes">أيوه، امسح</button> <button class="btn ghost" id="ac-del-no">لأ</button></p></div>
</section>
<script defer src="../assets/acct-page.js?v={VER}"></script>"""
    write("account/index.html", page("حسابي — ميزان", body, "../", "", "سجّل دخول مجاناً بجوجل أو بالإيميل، واحفظ تقدمك في ميزان على أي جهاز: سلسلة أيامك، ونتايج الألعاب، والمسارات، وشهاداتك.", path="account/"))

    # للمدرسين: حصص جاهزة وأوراق نشاط للطباعة
    T = json.loads((ROOT / "content" / "teachers.json").read_text(encoding="utf-8"))
    nm = {x["slug"]: x["name"] for x in entries}
    les = ""
    for i, L in enumerate(T["lessons"], 1):
        play = " ".join(f'<a class="btn ghost" href="../{h}">{t}</a>' for h, t in L["play"])
        ents = "، ".join(f'<a href="../atlas/{e}/">{nm.get(e, e)}</a>' for e in L["entries"])
        disc = "".join(f"<li>{q}</li>" for q in L["discuss"])
        sheet = "".join(f'<li><p>{q}</p><div class="lines"></div></li>' for q in L["sheet"])
        les += f'''<article class="lesson" id="l{i}"><p class="kicker">الحصة {i} · 45 دقيقة</p><h2>{L["title"]}</h2>
<p><b>الهدف:</b> {L["goal"]}</p>
<h3>1. تسخين (5 دقايق)</h3><p>{L["warm"]}</p>
<h3>2. العب (20 دقيقة)</h3><p>{play}</p>
<h3>3. نقاش (10 دقايق)</h3><ul>{disc}</ul>
<h3>4. ورقة النشاط (10 دقايق)</h3><p class="sub">للمدرس: اقرا قبل الحصة مداخل {ents} في الأطلس.</p>
<div class="worksheet"><p class="ws-head">ميزان · ورقة نشاط · {L["title"]} <span>الاسم: ................................</span></p><ol>{sheet}</ol></div>
<p><button class="btn ghost print-l" type="button" data-l="l{i}">🖨 اطبع الحصة دي</button></p></article>'''
    how = "".join(f"<li>{x}</li>" for x in T["how"])
    toc = "".join(f'<li><a href="#l{i}">{L["title"]}</a></li>' for i, L in enumerate(T["lessons"], 1))
    lead = T["intro"]
    body = f'''<p class="kicker">للمدرسين وأولياء الأمور</p><h1>ميزان في الفصل</h1><p class="lead">{lead}</p>
<section class="today"><h2>إزاي تستخدمها</h2><ul>{how}</ul><p class="note">الحصص مجانية. لو مدرستك عايزة ورشة، أو نسخة مخصوصة لمنهجها، <a href="../send/?err=teachers/">ابعتلنا</a>.</p></section>
<h2>الحصص</h2><ol class="index">{toc}</ol>{les}
<script>document.querySelectorAll(".print-l").forEach(function(b){{b.onclick=function(){{document.body.setAttribute("data-print",b.dataset.l);window.print();}};}});window.addEventListener("afterprint",function(){{document.body.removeAttribute("data-print");}});</script>'''
    write("teachers/index.html", page("ميزان في الفصل — حصص تفكير نقدي جاهزة", body, "../", "", "6 حصص تفكير نقدي جاهزة للمدرسين، كل حصة 45 دقيقة، بألعاب تفاعلية وأوراق نشاط للطباعة.", path="teachers/"))

    # لوحة الأرقام: مش في القايمة ولا في خريطة الموقع، ومقفولة على محركات البحث
    gn = {"court": "محكمة ميزان", "family": "جروب العيلة", "escape": "غرفة الهروب", "argue": "ابني الحجة", "spot": "اكشف الحيلة", "calib": "ميزان الثقة", "fix": "صلّح الحجة", "charts": "الرسم الكداب", "verify": "محقق الخبر", "rumor": "مصنع الإشاعة", "live": "على الهوا", "debate": "ناظر زِنة", "quiz": "اختبر نفسك", "bayes": "شجرة الاحتمالات", "duel": "تحدّي صاحبك", "review": "مراجعة اليوم"}
    body = f"""<h1>لوحة الأرقام</h1><p class="lead">أرقام مجمّعة ومجهولة: مين بيلعب إيه، وبيكمّل ولا لأ، وبيقف فين. الصفحة دي مش ظاهرة في الموقع.</p><div id="game"></div>
<script>window.MIZAN_GAME={json.dumps({"names": gn}, ensure_ascii=False)};</script><script src="../assets/config.js?v={VER}"></script><script src="../assets/ops.js?v={VER}"></script>"""
    html = page("لوحة الأرقام — ميزان", body, "../", "", "لوحة داخلية.").replace("<head>", '<head><meta name="robots" content="noindex,nofollow">', 1)
    (OUT / "ops").mkdir(parents=True, exist_ok=True); (OUT / "ops" / "index.html").write_text(html, encoding="utf-8", newline="\n")

    # privacy
    body = """<h1>الخصوصية</h1><p class="lead">ميزان مش بيطلب منك اسم ولا إيميل ولا حساب. ودي كل البيانات اللي بتتعامل في الموقع، بالظبط.</p>
<h2>اللي بيتحفظ على جهازك بس</h2><p>نتايج الألغاز، والسلسلة، وتقدمك في المسارات، وأحسن نتيجة في الاختبارات، واختياراتك في التصويت. دي بتتحفظ في متصفحك (localStorage) ومش بتتبعت لأي حد. لو مسحت بيانات المتصفح، هتتمسح.</p>
<h2>الشهادة</h2><p>اسمك في شهادة المسار بيترسم على جهازك، ومش بيتبعت لأي سيرفر.</p>
<h2>اللي بيتبعت لسيرفر ميزان</h2>
<ul><li><b>التصويت ونتايج المعمل:</b> بنسجل اختيارك من غير اسمك. عشان كل واحد يصوّت مرة واحدة، بنحوّل عنوان الـ IP لكود مشفّر (hash) ميتعرفش منه العنوان الأصلي، وبيتمسح بعد سنة.</li>
<li><b>حلّل الكلام:</b> النص اللي بتكتبه بيتبعت لخدمة Claude من شركة Anthropic عشان يتحلل. بنحتفظ بنتيجة التحليل 30 يوم عشان لو حد كتب نفس النص ميتحللش تاني. متكتبش أسماء ولا أرقام تليفونات ولا أي بيانات شخصية.</li>
<li><b>ابعت مغالطة وبلاغات الأخطاء:</b> الجملة اللي بتبعتها بتتحفظ لحد 120 يوم عشان نراجعها بإيدينا. مش بنسجل مين بعتها.</li></ul>
<h2>لو عملت حساب (اختياري)</h2><p>الحساب مش إجباري، والموقع كله شغال من غيره. لو سجّلت دخول بجوجل أو بالإيميل، بنحفظ: إيميلك، والاسم اللي تختاره، وتقدمك (نتايج الألغاز والمسارات والاختبارات)، عشان يفضل معاك على أي جهاز. تسجيل الدخول بيتم عن طريق Firebase من جوجل، والبيانات محفوظة على Cloudflare. مش بنحفظ كلمات سر خالص. تقدر تمسح حسابك وكل بياناته من صفحة <a href="../account/">حسابي</a> في أي وقت، وبيتمسح على طول.</p>
<h2>دوري ميزان (اختياري)</h2><p>لو اشتركت في الدوري، بنحفظ اللقب اللي اخترته ونقطك في كل لعبة كل يوم. اللقب بس هو اللي بيظهر للناس في الترتيب، واسمك الحقيقي وإيميلك عمرهم ما بيظهروا. تقدر تخرج من الدوري من صفحته، ونقطك ولقبك بيتمسحوا على طول.</p>
<h2>المناظرة الحرة مع زِنة (لأصحاب الحسابات)</h2><p>الردود اللي بتكتبها في المناظرة الحرة بتتبعت لخدمة Claude من شركة Anthropic عشان زِنة ترد عليك. المناظرة بتتحفظ على السيرفر 6 ساعات بس عشان تكمّلها، وبعدها بتتمسح. مش بتتنشر لحد.</p>
<h2>تحدّي صاحبك</h2><p>نتيجتك واسمك اللي بتختاره بيتحطوا جوه اللينك نفسه، ومش بيتحفظوا على أي سيرفر. أي حد معاه اللينك يقدر يشوفهم.</p>
<h2>عدّاد الألعاب</h2><p>لما تبدأ لعبة أو تخلّصها، بنزوّد عدّاد واحد للعبة دي في اليوم ده. مش بيتبعت معاه أي حاجة عنك: لا اسم، ولا جهاز، ولا عنوان. ده عشان نعرف أنهي لعبة الناس بتحبها ونطوّرها.</p>
<h2>عدّاد الزيارات</h2><p>بنستخدم Cloudflare Web Analytics عشان نعرف عدد الزيارات والصفحات اللي الناس بتحبها. مش بيستخدم كوكيز، ومش بيتتبعك من موقع لموقع.</p>
<h2>اللي مش بنعمله</h2><p>مش بنبيع بيانات، ومش بنعرض إعلانات، ومش بنستخدم كوكيز تتبع.</p>
<h2>عايز تمسح حاجة؟</h2><p>بياناتك على جهازك تقدر تمسحها من إعدادات المتصفح. ولو بعتلنا جملة وعايزها تتمسح، <a href="../send/">ابعتلنا</a> نصها، وإحنا نمسحها.</p>
<p class="note">ميزان ماشي حسب قانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020. الصفحة دي اتحدّثت نوفمبر 2026.</p>"""
    write("privacy/index.html", page("الخصوصية — ميزان", body, "../", "", "ميزان بيتعامل مع بياناتك إزاي: من غير إعلانات ولا تتبّع شخصي، وإيه اللي بنحفظه لو عملت حساب، وإزاي تمسح حسابك وكل بياناتك في أي وقت.", path="privacy/"))

    # about
    body = """<h1>عن ميزان</h1>
<p>ميزان مشروع مفتوح هدفه يبقى أكبر مرجع عربي عن التفكير: المنطق، والانحيازات المعرفية، والأسئلة الفلسفية الكبيرة، مشروحة بالعامية المصرية وبأمثلة من حياتنا.</p>
<h2>إزاي بنشتغل</h2><p>المحتوى بيتكتب بشراكة بين إنسان متخصص وذكاء اصطناعي، وكل مدخل بيعدي على مراجعة بشرية قبل ما يتعلّم «اتراجع». أي مدخل مكتوب عليه «مسودة» لسه متراجعش.</p>
<h2>الأمانة العلمية</h2><p>بنكتب مصادر كل مدخل، وبنوضح قوة الدليل على كل انحياز. أي معلومة الدليل عليها ضعيف أو مختلف عليه، بنقول كده صراحة.</p>
<p class="note">ميزان تمرين على التفكير، مش تشخيص نفسي ولا استشارة متخصصة.</p>"""
    write("about/index.html", page("عن ميزان", body, "../", "about/"))
    # صفحة 404 بالعربي (GitHub Pages بيعرضها لأي لينك غلط تحت /mizan/)، فاللينكات كلها مطلقة
    r404 = "/" + SITE.split("/", 3)[3]
    nf = f'''<section class="today" style="text-align:center"><p class="kicker">404</p><h1>الصفحة دي مش موجودة</h1>
<p class="lead">يمكن اللينك اتكتب غلط، أو الصفحة اتنقلت. بس متقلقش، فيه حاجات كتير تانية تستاهل.</p>
<p><a class="btn" href="{r404}">الرئيسية</a> <a class="btn ghost" href="{r404}daily/">مغالطة اليوم</a> <a class="btn ghost" href="{r404}search/">دوّر على حاجة</a></p></section>'''
    html404 = page("الصفحة مش موجودة — ميزان", nf, r404, "", "الصفحة دي مش موجودة على ميزان.")
    (OUT / "404.html").write_text(html404.replace("<head>", '<head><meta name="robots" content="noindex">', 1), encoding="utf-8", newline="\n")

    write("manifest.webmanifest", json.dumps({"name": "ميزان", "short_name": "ميزان", "lang": "ar", "dir": "rtl",
        "start_url": "./", "scope": "./", "display": "standalone", "background_color": "#E9E1CC", "theme_color": "#A47E2E",
        "description": "مرجع مصري مفتوح عن المغالطات والانحيازات والفلسفة.",
        # «شارك لميزان»: من أي تطبيق على أندرويد (لما ميزان يبقى متسطّب)، والنص بيروح لصفحة التحليل
        "share_target": {"action": "analyze/", "method": "GET", "params": {"title": "title", "text": "text", "url": "url"}},
        "icons": [{"src": "assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png"}, {"src": "assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
                  {"src": "assets/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}, ensure_ascii=False))
    # sitemap + robots
    sm = "".join(f"<url><loc>{SITE}{u}</loc></url>" for u in URLS)
    (OUT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{sm}</urlset>', encoding="utf-8", newline="\n")
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE}sitemap.xml\n", encoding="utf-8", newline="\n")
    # service worker
    pre = ["./", "offline.html", "daily/", "review/", "atlas/", "philosophy/", "quiz/", "search/", "search.json", "manifest.webmanifest"] + [f"assets/{f}?v={VER}" for f in ["style.css", "app.js", "motion.js", "srs-core.js", "daily.js", "quiz.js", "search-core.js", "search.js", "review.js"]]
    sw = (ROOT / "tools/sw.template.js").read_text(encoding="utf-8").replace("__VER__", VER).replace("__PRE__", json.dumps(pre))
    (OUT / "sw.js").write_text(sw, encoding="utf-8", newline="\n")
    api_files = build_api()
    print("built", len(entries), "entries,", len(philo), "philosophy,", len(URLS), "pages,", api_files, "API files")


# ───── مراجعة اليوم ─────
def review_cards(entries, puzzles):
    """الكروت لكل مدخل يتعرف من مثال (مغالطة أو انحياز، مش أداة): [المكان، النص، اختيارات غلط جاهزة أو None]."""
    slug_of = {x["name"]: x["slug"] for x in entries}
    meta, cards = {}, {}
    for x in entries:
        if x["kind"] == "tool":
            continue
        nc = (x.get("notConfuse") or {}).get("slug") or ""
        meta[x["slug"]] = [x["name"], x["kind"], nc]
        cards[x["slug"]] = [[ex.get("where", ""), ex["text"], None] for ex in x["examples"]]
    for p in puzzles:
        if p["entry"] not in cards:
            continue
        wrong = [slug_of.get(o) for i, o in enumerate(p["options"]) if i != p["answer"]]
        if all(wrong):  # ألغاز اختياراتها جمل مش أسامي مدخلات بتتساب
            cards[p["entry"]].append(["", p["scene"], wrong])
    return meta, cards


def review_body(entries, puzzles):
    meta, cards = review_cards(entries, puzzles)
    for k, (_, _, nc) in meta.items():
        if nc not in meta:
            meta[k][2] = ""
    data = json.dumps({"e": meta, "c": cards}, ensure_ascii=False, separators=(",", ":"))
    return f"""<p class="kicker">دقيقتين في اليوم</p><h1>مراجعة اليوم</h1>
<p class="lead">المغالطات اللي بتغلط فيها بترجعلك بدري، واللي بتعرفها بتبعد. كل ما تجاوب صح، الكارت بيرجعلك بعد مدة أطول: يوم، 3، أسبوع، أسبوعين، شهر.</p>
<div class="sheet" id="rv-play"><p class="kicker" id="rv-count"></p><p class="note" id="rv-where" hidden></p><p class="scene" id="rv-scene"></p><div class="opts" id="rv-opts"></div>
<div class="reveal" id="rv-reveal"><h2 id="rv-verdict" style="margin-top:8px"></h2><p id="rv-when"></p><a class="btn ghost" id="rv-more" href="#">اقرأ عنها في الأطلس</a> <button class="btn" id="rv-next" type="button">اللي بعده</button></div></div>
<div class="sheet" id="rv-done" hidden><h2 id="rv-done-h"></h2><p id="rv-done-p" class="lead"></p><p><button class="btn ghost" id="rv-more-new" type="button">كمان 3 جداد</button> <a class="btn ghost" href="../daily/">مغالطة اليوم</a></p></div>
<h2>نقط ضعفك</h2><div id="rv-weak"></div>
<p class="note">ده تمرين على إنك تعرف المغالطة لما تشوفها، مش تشخيص لطريقة تفكيرك. تقدمك محفوظ على جهازك، ولو عندك حساب بيتزامن معاه.</p>
<script>window.MIZAN_REVIEW={data};</script><script src="../assets/review.js?v={VER}"></script>"""


# ───── Content API: نفس المحتوى كـ JSON ثابت، عشان التطبيق والموقع يقروا من مصدر واحد ─────
# GitHub Pages بيبعت الملفات دي بـ Access-Control-Allow-Origin: *، فأي تطبيق يقدر يقراها من غير سيرفر.
# v1 معناها إن شكل الملفات ثابت: أي تغيير بيكسر حاجة يروح لـ v2 جديدة.
API_FILES = ["entries", "philosophy", "puzzles", "paths", "dilemmas", "weekly", "thought", "problems", "trends"]


def build_api():
    out = OUT / "api" / "v1"
    out.mkdir(parents=True, exist_ok=True)
    files = {}
    for name in API_FILES:
        data = json.loads((ROOT / "content" / f"{name}.json").read_text(encoding="utf-8"))
        body = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        (out / f"{name}.json").write_text(body, encoding="utf-8", newline="\n")
        files[name] = {"url": f"{name}.json", "count": len(data),
                       "hash": hashlib.sha256(body.encode("utf-8")).hexdigest()[:12]}
    # الـ index من غير تاريخ: لو المحتوى متغيرش، الملف ميتغيرش (والتطبيق يعرف من الـ hash إن مفيش جديد)
    version = hashlib.sha256("".join(f["hash"] for f in files.values()).encode()).hexdigest()[:12]
    index = {"api": "v1", "version": version, "site": SITE,
             "license": {"content": "CC BY-SA 4.0", "attribution": "Mizan by Mohammed Tahawi",
                         "url": "https://github.com/Tahawi0/mizan/blob/main/LICENSE-CONTENT"},
             "files": files}
    (out / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8", newline="\n")
    return len(files) + 1


if __name__ == "__main__":
    build()
