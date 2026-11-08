"""كروت المشاركة للألعاب (1200x630): اسم اللعبة وسؤال يشد، وزِنة أو رسمة اللعبة على الجنب.

Output: cards/og/g-<page-key>.png ، و build.py بيختارها لوحده لو موجودة.
Run: python tools/game_cards.py
"""
from pathlib import Path
from PIL import Image, ImageDraw
from cards import ROOT, PAPER, INK, MUTED, GOLD, LAPIS, SITE, font, frame, rtl, wrap, scale_icon, fit_title

A = ROOT / "tools" / "art"
# key: (العنوان، السؤال، الصورة، النوع)
GAMES = {
    "games": ("الساحة", "25 لعبة ولوحة بتعلّمك تفكر صح. كل واحدة دقايق.", "zina/happy", "ألعاب ميزان"),
    "daily": ("مغالطة اليوم", "لغز جديد كل يوم. هتكشف المغالطة؟", "zina/think", "كل يوم"),
    "quiz": ("اختبر نفسك", "10 أسئلة. بتكشف كام مغالطة من 10؟", "zina/explain", "اختبار"),
    "games-court": ("محكمة ميزان", "إنت القاضي. هتمسك كام مغالطة في المرافعة؟", "court/judge", "لعبة"),
    "games-family": ("جروب العيلة", "رسالة غلط في جروب العيلة. هترد إزاي من غير ما حد يزعل؟", "family/m", "لعبة"),
    "games-escape": ("غرفة الهروب", "10 أوض، وكل قفل بيتفتح بالتفكير بس.", "escape/key", "لعبة"),
    "games-argue": ("ابني الحجة", "اختار المقدمات اللي تثبت النتيجة. من غير ولا ثغرة.", "zina/explain", "لعبة"),
    "games-spot": ("اكشف الحيلة", "الإعلان ده بيضحك عليك إزاي؟", "zina/shock", "لعبة"),
    "games-lab": ("معمل الانحيازات", "4 تجارب علم نفس حقيقية. مخك هيتخدع؟", "zina/think", "تجربة"),
    "games-philosopher": ("أنهي فيلسوف إنت؟", "8 أسئلة خفيفة، وفي الآخر مفاجأة.", "zina/wink", "اختبار"),
    "games-profile": ("بصمتك المعرفية", "اعرف أكتر الانحيازات اللي بتأثر على قراراتك.", "zina/think", "اختبار"),
    "games-calibration": ("ميزان الثقة", "معلوماتك على قد ثقتك؟", "zina/explain", "لعبة"),
    "games-fix": ("صلّح الحجة", "قول نفس الفكرة من غير الغلط.", "zina/explain", "لعبة"),
    "games-charts": ("الرسم الكداب", "الرسم ده بيكدب من غير ما رقم يبقى غلط. فين الحيلة؟", "zina/shock", "لعبة"),
    "games-verify": ("محقق الخبر", "حقيقي، ولا مفبرك، ولا ناقص سياق؟ حقق بنفسك.", "zina/think", "لعبة"),
    "games-rumor": ("مصنع الإشاعة", "اتعلم حيل الإشاعات من جوه، عشان متتضحكش عليك.", "zina/wink", "لعبة"),
    "games-live": ("على الهوا", "إنت مشرف بث مباشر. خبّي الكومنت الغلط قبل ما يعدّي.", "zina/shock", "لعبة"),
    "games-debate": ("ناظر زِنة", "تقدر تكسب مناظرة قدام بومة بتحب الجدال؟", "zina/wink", "مناظرة"),
    "games-bayes": ("شجرة الاحتمالات", "التحليل طلع إيجابي. إنت عيان فعلاً؟ الإجابة هتفاجئك.", "zina/shock", "لعبة"),
    "games-duel": ("تحدّي صاحبك", "5 أسئلة مغالطات. مين فيكم هيكسب؟", "zina/happy", "تحدّي"),
    "games-league": ("دوري ميزان", "العب كل يوم، واجمع نقط، واطلع الأول.", "zina/happy", "دوري"),
    "games-mirror": ("مرآة الناس", "الناس اختارت إيه، ووقعت في أنهي فخ؟", "zina/think", "لوحة"),
    "games-skills": ("شجرة مهاراتك", "خريطة بتنوّر كل ما تتعلم. إنت قوي في إيه؟", "zina/happy", "لوحة"),
    "teachers": ("ميزان في الفصل", "6 حصص تفكير نقدي جاهزة، بألعاب وأوراق نشاط للطباعة.", "zina/explain", "للمدرسين"),
    "tools": ("أدوات التفكير", "10 أدوات صغيرة تفكر بيها صح قبل ما تقرر أو تصدّق.", "zina/explain", "اتعلّم"),
    "philosophy-problems": ("الفلاسفة بيردوا على مشكلتك", "قلقان أو محتار؟ شوف 3 مدارس فلسفية هتقولك إيه.", "zina/think", "فلسفة"),
    "philosophy-thought": ("تجارب ذهنية", "8 تجارب غيّرت طريقة تفكيرنا. فكّر وصوّت.", "zina/shock", "فلسفة"),
    "atlas-situations": ("دوّر حسب الموقف", "إنت فين دلوقتي؟ شوف الحيل اللي ممكن تقابلك هناك.", "zina/think", "الأطلس"),
    "paths": ("مسارات", "10 كورسات قصيرة، 5 دقايق في اليوم، من مبتدئ لمتقدم.", "zina/happy", "اتعلّم"),
    "atlas-sky": ("سماء المغالطات", "50 مغالطة وانحياز، في سما واحدة.", "zina/wink", "لوحة"),
}


def make(key, title, hook, img, kind):
    W, H = 1200, 630
    im = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(im)
    frame(d, W, H, 34)
    pic = Image.open(A / f"{img}.webp").convert("RGBA")
    ph = 330
    pic = pic.resize((int(pic.width * ph / pic.height), ph), Image.LANCZOS)
    if pic.width > 380:
        pic = pic.resize((380, int(pic.height * 380 / pic.width)), Image.LANCZOS)
    d.ellipse([90, 140, 90 + 360, 140 + 360], fill="#EADBB4")
    im.paste(pic, (90 + (360 - pic.width) // 2, 140 + (360 - pic.height) // 2 + 10), pic)
    right, inner = W - 100, 620
    y = 108
    rtl(d, right, y, kind, font("ElMessiri-Bold.ttf", 30), GOLD)
    y += 58
    tf = fit_title(d, title, inner, 92)
    rtl(d, right, y, title, tf, INK)
    y += int(tf.size * 1.6)
    d.line([(right - 120, y), (right, y)], fill=GOLD, width=3)
    y += 30
    for size in (42, 38, 34, 30):
        bf = font("Amiri-Regular.ttf", size)
        lines = wrap(d, hook, bf, inner)
        if y + len(lines) * int(size * 1.7) + 70 <= 528:
            break
    for ln in lines[:3]:
        rtl(d, right, y, ln, bf, INK)
        y += int(bf.size * 1.7)
    bw, by = 280, max(y + 8, 440)
    d.rounded_rectangle([right - bw, by, right, by + 58], radius=10, fill=LAPIS)
    bt = "العب دلوقتي"
    bfont = font("ElMessiri-Bold.ttf", 32)
    rtl(d, right - (bw - d.textlength(bt, font=bfont, direction="rtl", language="ar")) / 2, by + 7, bt, bfont, "#F3EDDD")
    fy = 530
    rtl(d, 420, fy, "ميزان", font("ElMessiri-Bold.ttf", 30), INK)
    scale_icon(d, 450, fy + 22, 34, GOLD)
    d.text((100, fy + 8), SITE, font=font("Amiri-Regular.ttf", 22), fill=MUTED)
    out = ROOT / "cards/og" / f"g-{key}.png"
    im.save(out, optimize=True)


if __name__ == "__main__":
    for k, v in GAMES.items():
        make(k, *v)
    print("game cards:", len(GAMES))
