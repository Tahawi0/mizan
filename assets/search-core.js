// البحث: تطبيع العربي، تجريد خفيف للسوابق واللواحق، وتسامح مع غلطة إملا واحدة.
// من غير أي اعتماد على المتصفح، عشان يتختبر في node (tools/test/search.test.mjs).
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.MizanSearch = factory();
})(typeof self !== "undefined" ? self : this, function () {
  // التشكيل والتطويل بيتشالوا، والحروف اللي ليها أكتر من شكل بتتوحد (ومنها حروف الكيبورد الفارسي)
  function norm(s) {
    return String(s || "").toLowerCase()
      .replace(/[ً-ٰٟۖ-ۭـ]/g, "")
      .replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/[ىی]/g, "ي").replace(/ؤ/g, "و").replace(/ئ/g, "ي").replace(/ک/g, "ك")
      .replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 0x660); })
      .replace(/[^ء-يa-z0-9]+/g, " ").trim();
  }

  // «والشخصنه» ← «شخصن»، «بالانحيازات» ← «انحياز». بيفضل 3 حروف على الأقل عشان مايبوظش كلمات قصيرة.
  var PRE = /^(?:[وف]?(?:بال|كال|لل|ال)|[وف](?=..[^\s]))/;
  var SUF = /(?:ات|ون|ين|ان|يه|يا|ها|هم|نا|ه|ي)$/;
  function stem(w) {
    if (!/[ء-ي]/.test(w)) return w.length > 4 ? w.replace(/(?:'s|es|s)$/, "") : w;
    var x = w;
    var p = x.replace(PRE, ""); if (p.length >= 3) x = p;
    var s = x.replace(SUF, ""); if (s.length >= 3) x = s;
    return x;
  }

  function terms(q) {
    return norm(q).split(" ").filter(function (w) { return w && !STOP[w]; }).map(function (w) { return { w: w, s: stem(w) }; });
  }
  var STOP = { "يا": 1, "في": 1, "من": 1, "على": 1, "علي": 1, "عن": 1, "و": 1, "ال": 1, "the": 1, "of": 1 };

  // مسافة التحرير بحد أقصى: بتقف بدري لو عدّت الحد
  function near(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return false;
    var prev = [], cur, i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i]; var low = i;
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (cur[j] < low) low = cur[j];
      }
      if (low > max) return false;
      prev = cur;
    }
    return prev[b.length] <= max;
  }
  function allowed(w) { return w.length >= 7 ? 2 : w.length >= 4 ? 1 : 0; }

  // كل حقل بيتجهز مرة واحدة: النص المطبّع، وجذور كلماته للمقارنة التقريبية
  function prepField(s) {
    var n = norm(s), ws = {};
    n.split(" ").forEach(function (w) { if (w.length >= 3) ws[stem(w)] = 1; });
    return { n: " " + n + " ", w: Object.keys(ws) };
  }
  function prep(d) {
    d._t = prepField(d.t); d._k = prepField(d.k + " " + d.d); d._x = prepField(d.x);
    return d;
  }

  // درجة الكلمة في حقل: كلمة كاملة > جذر > جزء من كلمة > قريبة إملائياً.
  // القرب الإملائي في العنوان (من 4 حروف) والوصف (من 5) بس: في النص الطويل «كانط» كانت بتلاقي «كانت» و«كان» في كل صفحة.
  function fieldHit(f, t, fuzzyFrom) {
    if (f.n.indexOf(" " + t.w + " ") > -1) return 1;
    if (t.s.length >= 3 && f.n.indexOf(t.s) > -1) return 0.8;
    if (t.w.length >= 2 && f.n.indexOf(t.w) > -1) return 0.6;
    var m = fuzzyFrom && t.s.length >= fuzzyFrom ? allowed(t.s) : 0;
    if (m) for (var i = 0; i < f.w.length; i++) if (f.w[i].length >= 4 && near(t.s, f.w[i], m)) return 0.45;
    return 0;
  }

  function score(d, ts, q) {
    if (!ts.length) return 0;
    var s = 0;
    for (var i = 0; i < ts.length; i++) {
      var h = Math.max(fieldHit(d._t, ts[i], 4) * 10, fieldHit(d._k, ts[i], 5) * 4, fieldHit(d._x, ts[i], 0) * 1.5);
      if (!h) return 0; // كل كلمة لازم تلاقي مكان
      s += h;
    }
    var nq = norm(q), nt = d._t.n.trim();
    if (nt === nq) s += 25; else if (nt.indexOf(nq) === 0) s += 12;
    return s;
  }

  function search(idx, q, limit) {
    var ts = terms(q);
    return idx.map(function (d) { return { d: d, s: score(d, ts, q) }; }).filter(function (r) { return r.s > 0; })
      .sort(function (a, b) { return b.s - a.s || a.d.t.length - b.d.t.length; }).slice(0, limit || 30);
  }

  return { norm: norm, stem: stem, terms: terms, near: near, prep: prep, score: score, search: search };
});
