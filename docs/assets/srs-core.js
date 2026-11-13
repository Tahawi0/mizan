// منطق المراجعة المتباعدة ودمج نص المشاركة: من غير أي اعتماد على المتصفح، عشان يتختبر في node.
// صناديق Leitner: الصح بيطلّع الكارت صندوق، والغلط بيرجّعه للأول.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.MizanSRS = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var GAPS = [1, 3, 7, 14, 30];          // بعد كام يوم يرجع الكارت، لكل صندوق
  var SLUG = /^[a-z0-9-]{1,60}$/;
  var MIN_SEEN = 3;                       // أقل عدد إجابات قبل ما نقول إن فيه نقطة ضعف

  // اليوم المحلي كرقم، عشان المراجعة تتقلب على نص الليل بتاع المستخدم مش UTC
  function today(now) {
    var d = now ? new Date(now) : new Date();
    return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
  }

  // الشكل: "1|slug:box:due:right:wrong,..."
  function parse(s) {
    var out = {};
    if (typeof s !== "string" || s.indexOf("1|") !== 0) return out;
    s.slice(2).split(",").forEach(function (it) {
      var p = it.split(":");
      if (p.length !== 5 || !SLUG.test(p[0])) return;
      var n = p.slice(1).map(Number);
      if (n.some(function (x) { return !Number.isInteger(x) || x < 0; }) || n[0] < 1 || n[0] > GAPS.length) return;
      out[p[0]] = { box: n[0], due: n[1], r: n[2], w: n[3] };
    });
    return out;
  }
  function stringify(st) {
    return "1|" + Object.keys(st).sort().map(function (k) { var c = st[k]; return [k, c.box, c.due, c.r, c.w].join(":"); }).join(",");
  }

  function grade(st, slug, ok, day) {
    if (!SLUG.test(slug)) return st;
    var c = st[slug] || { box: 1, due: day, r: 0, w: 0 };
    if (ok) { c.r++; c.box = Math.min(GAPS.length, (st[slug] ? c.box + 1 : 2)); }
    else { c.w++; c.box = 1; }
    c.due = day + GAPS[c.box - 1];
    st[slug] = c;
    return st;
  }

  // المستحق النهارده الأول (الصناديق الواطية قبل العالية)، وبعدين كروت جديدة لحد newMax
  function pick(st, pool, day, n, newMax) {
    var due = Object.keys(st).filter(function (k) { return st[k].due <= day && pool.indexOf(k) >= 0; })
      .sort(function (a, b) { return st[a].box - st[b].box || st[a].due - st[b].due || (a < b ? -1 : 1); });
    var out = due.slice(0, n);
    var fresh = pool.filter(function (k) { return !st[k]; });
    for (var i = 0; out.length < n && i < fresh.length && i < (newMax == null ? n : newMax); i++) out.push(fresh[i]);
    return { slugs: out, due: due.length };
  }

  // بين جهازين: الكارت اللي اتجاوب أكتر هو الأحدث (العدّادات بتزيد بس)، والتعادل للأبعد في الميعاد
  function merge(a, b) {
    var x = parse(a), y = parse(b), out = {};
    Object.keys(x).concat(Object.keys(y)).forEach(function (k) {
      var p = x[k], q = y[k];
      if (!p || !q) { out[k] = p || q; return; }
      var np = p.r + p.w, nq = q.r + q.w;
      out[k] = np > nq || (np === nq && p.due >= q.due) ? p : q;
    });
    return stringify(out);
  }

  // اللخبطة: "a>b:n,..." يعني الإجابة كانت a واخترت b
  function parseMix(s) {
    var out = {};
    if (typeof s !== "string") return out;
    s.split(",").forEach(function (it) {
      var m = /^([a-z0-9-]{1,60})>([a-z0-9-]{1,60}):(\d{1,5})$/.exec(it);
      if (m && m[1] !== m[2]) out[m[1] + ">" + m[2]] = +m[3];
    });
    return out;
  }
  function stringifyMix(mx) {
    return Object.keys(mx).sort(function (a, b) { return mx[b] - mx[a] || (a < b ? -1 : 1); }).slice(0, 40)
      .map(function (k) { return k + ":" + mx[k]; }).join(",");
  }
  function addMix(mx, right, chosen) {
    if (SLUG.test(right) && SLUG.test(chosen) && right !== chosen) mx[right + ">" + chosen] = (mx[right + ">" + chosen] || 0) + 1;
    return mx;
  }
  function mergeMix(a, b) {
    var x = parseMix(a), y = parseMix(b);
    Object.keys(y).forEach(function (k) { x[k] = Math.max(x[k] || 0, y[k]); });
    return stringifyMix(x);
  }

  // نقط الضعف: أقل دقة الأول، بس للي اتجاوب عليه MIN_SEEN مرات على الأقل
  function weak(st, mx, limit) {
    var spots = Object.keys(st).filter(function (k) { var c = st[k]; return c.r + c.w >= MIN_SEEN && c.r / (c.r + c.w) < 0.7; })
      .map(function (k) { var c = st[k]; return { slug: k, seen: c.r + c.w, r: c.r, acc: c.r / (c.r + c.w) }; })
      .sort(function (a, b) { return a.acc - b.acc || b.seen - a.seen || (a.slug < b.slug ? -1 : 1); }).slice(0, limit || 5);
    var pairs = Object.keys(mx).filter(function (k) { return mx[k] >= 2; })
      .map(function (k) { var p = k.split(">"); return { right: p[0], chosen: p[1], n: mx[k] }; })
      .sort(function (a, b) { return b.n - a.n; }).slice(0, limit || 5);
    var seen = Object.keys(st).reduce(function (s, k) { return s + st[k].r + st[k].w; }, 0);
    return { spots: spots, pairs: pairs, seen: seen, enough: seen >= MIN_SEEN };
  }

  // نص المشاركة من تطبيق تاني: العنوان والنص واللينك بييجوا منفصلين، أو متكررين جوه بعض
  function shareText(p) {
    p = p || {};
    var title = String(p.title || "").trim(), text = String(p.text || "").trim(), url = String(p.url || "").trim();
    var urlRe = /https?:\/\/\S+/g;
    var body = text.replace(urlRe, "").replace(/[ \t]+/g, " ").trim();
    if (title && body.indexOf(title) < 0 && title.replace(urlRe, "").trim()) body = (title.replace(urlRe, "").trim() + "\n" + body).trim();
    if (!url) { var m = text.match(urlRe); url = m ? m[0] : ""; }
    return { text: body.slice(0, 1000), url: url, onlyUrl: !body && !!url };
  }

  // تسجيل إجابة من أي لعبة. storage زي localStorage (getItem/setItem)، وأي غلطة فيه بتتبلع.
  var KEY = "mizan-srs", MIX = "mizan-srs-mix";
  function record(storage, slug, ok, chosen, day) {
    try {
      var st = parse(storage.getItem(KEY));
      storage.setItem(KEY, stringify(grade(st, slug, ok, day == null ? today() : day)));
      if (!ok && chosen) storage.setItem(MIX, stringifyMix(addMix(parseMix(storage.getItem(MIX)), slug, chosen)));
      return true;
    } catch (e) { return false; }
  }

  // «بعد كام يوم» بالمصري
  function days(n) { return n <= 1 ? "بكرة" : n === 2 ? "بعد يومين" : "بعد " + n + (n <= 10 ? " أيام" : " يوم"); }
  function cards(n) { return n === 1 ? "كارت واحد" : n === 2 ? "كارتين" : n + (n <= 10 ? " كروت" : " كارت"); }

  return { days: days, cards: cards, GAPS: GAPS, KEY: KEY, MIX: MIX, record: record, MIN_SEEN: MIN_SEEN, today: today, parse: parse, stringify: stringify, grade: grade, pick: pick, merge: merge,
    parseMix: parseMix, stringifyMix: stringifyMix, addMix: addMix, mergeMix: mergeMix, weak: weak, shareText: shareText };
});
