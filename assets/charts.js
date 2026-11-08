// الرسم الكداب: اكشف الحيلة في الرسم البياني، وصلّحه بإيدك، وشوف الحقيقة.
(function () {
  var G = window.MIZAN_GAME || {}, root = document.body.getAttribute("data-root") || "./";
  var NAMES = window.MIZAN_NAMES || {}, S = window.MizanStages;
  var box = document.getElementById("game"), KEY = "mizan-charts-stages", NS = "http://www.w3.org/2000/svg";
  var fast = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var COLORS = ["var(--lapis)", "var(--bad)", "var(--gold)"];
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function sv(t, a) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); return e; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function fmt(v) { return Math.abs(v) < 10 && v % 1 ? v.toFixed(v < 1 ? 2 : 1).replace(/\.?0+$/, "") : String(Math.round(v)); }

  // رسم واحد: أعمدة أو خط أو دواير. لو الرسمين نفس الشكل، بنحرّك من واحد للتاني.
  var W = 360, H = 230, L = 46, R = 12, T = 16, B = 34;
  function draw(svg, v) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var n = v.labels.length, pw = W - L - R, ph = H - T - B;
    if (v.kind === "circle") {
      var mx = Math.max.apply(null, v.series[0].vals), cw = pw / n;
      v.series[0].vals.forEach(function (x, i) {
        var r = v.mode === "area" ? 70 * Math.sqrt(x / mx) : 70 * (x / mx);
        var cx = L + cw * i + cw / 2;
        svg.appendChild(sv("circle", { cx: cx, cy: T + ph / 2, r: r, fill: COLORS[i % 3], "fill-opacity": ".75" }));
        var t = sv("text", { x: cx, y: H - 10, "text-anchor": "middle", "class": "ch-lab" }); t.textContent = v.labels[i] + " · " + fmt(x); svg.appendChild(t);
      });
      return;
    }
    var mn = v.min, mx2 = v.max, y = function (val) { return T + ph - (val - mn) / (mx2 - mn) * ph; };
    for (var g = 0; g <= 4; g++) {
      var gv = mn + (mx2 - mn) * g / 4, gy = y(gv);
      svg.appendChild(sv("line", { x1: L, x2: W - R, y1: gy, y2: gy, "class": "ch-grid" }));
      var tt = sv("text", { x: L - 6, y: gy + 4, "text-anchor": "end", "class": "ch-ax" }); tt.textContent = fmt(gv); svg.appendChild(tt);
    }
    var step = pw / n;
    v.labels.forEach(function (lb, i) {
      if (n > 6 && i % 2) return;
      var t = sv("text", { x: L + step * i + step / 2, y: H - 12, "text-anchor": "middle", "class": "ch-lab" }); t.textContent = lb; svg.appendChild(t);
    });
    v.series.forEach(function (s, si) {
      if (v.kind === "bar") {
        var bw = Math.min(46, step * .6);
        s.vals.forEach(function (val, i) {
          var top = y(Math.max(val, mn)), x = L + step * i + (step - bw) / 2;
          svg.appendChild(sv("rect", { x: x, y: top, width: bw, height: Math.max(0, T + ph - top), rx: 2, fill: COLORS[si % 3] }));
          var t = sv("text", { x: x + bw / 2, y: top - 5, "text-anchor": "middle", "class": "ch-val" }); t.textContent = fmt(val); svg.appendChild(t);
        });
      } else {
        var d = s.vals.map(function (val, i) { return (i ? "L" : "M") + (L + step * i + step / 2).toFixed(1) + " " + y(val).toFixed(1); }).join(" ");
        svg.appendChild(sv("path", { d: d, fill: "none", stroke: COLORS[si % 3], "stroke-width": 3, "stroke-linejoin": "round", "stroke-linecap": "round", "stroke-dasharray": si === 2 ? "6 5" : "" }));
        s.vals.forEach(function (val, i) { svg.appendChild(sv("circle", { cx: L + step * i + step / 2, cy: y(val), r: 3.5, fill: COLORS[si % 3] })); });
      }
    });
    // خط الصفر لو المحور مش بادئ منه: علامة كسر صغيرة
    if (mn > 0) { var z = sv("text", { x: L - 6, y: T + ph + 16, "text-anchor": "end", "class": "ch-ax ch-cut" }); z.textContent = "≈"; svg.appendChild(z); }
  }
  function legend(v) {
    var p = el("p", "ch-legend");
    if (v.series.length > 1) v.series.forEach(function (s, i) { var sp = el("span", null, s.name); sp.style.setProperty("--c", COLORS[i % 3]); p.appendChild(sp); });
    if (v.unit) p.appendChild(el("small", null, "الوحدة: " + v.unit));
    return p;
  }
  // تحريك ناعم بين رسمين ليهم نفس العدد
  function tween(svg, a, b, done) {
    var same = a.kind === b.kind && a.labels.length === b.labels.length && a.series.length === b.series.length && a.kind !== "circle";
    if (fast || !same) { svg.classList.add("ch-fade"); setTimeout(function () { draw(svg, b); svg.classList.remove("ch-fade"); done(); }, fast ? 0 : 250); return; }
    var t0 = null, D = 900;
    function lerp(x, y, k) { return x + (y - x) * k; }
    (function step(ts) {
      if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / D); k = 1 - Math.pow(1 - k, 3);
      draw(svg, { kind: b.kind, labels: b.labels, unit: b.unit, min: lerp(a.min, b.min, k), max: lerp(a.max, b.max, k),
        series: b.series.map(function (s, i) { return { name: s.name, vals: s.vals.map(function (v, j) { return lerp(a.series[i].vals[j], v, k); }) }; }) });
      if (k < 1) requestAnimationFrame(step); else { draw(svg, b); done(); }
    })(performance.now());
  }

  function map() {
    S.render(box, { key: KEY, bossLabel: "مرحلة الزعيم: مؤتمر صحفي", intro: G.intro,
      items: G.stages.map(function (s, k) { return { id: "c" + k, title: s.title, sub: s.source }; }), onPlay: play });
  }

  function play(k) {
    var st = G.stages[k], score = 0, tries = 0;
    box.innerHTML = "";
    box.appendChild(el("p", "kicker", "المرحلة " + (k + 1) + " من " + G.stages.length + " · " + st.source));
    var card = el("div", "ch-card");
    card.appendChild(el("h2", "ch-head", st.headline));
    var svg = sv("svg", { viewBox: "0 0 " + W + " " + H, "class": "ch-svg", role: "img", "aria-label": "رسم بياني: " + st.headline });
    card.appendChild(svg); draw(svg, st.fake);
    var lg = legend(st.fake); card.appendChild(lg);
    box.appendChild(card);
    var act = el("div", "ch-act"); box.appendChild(act);

    // الخطوة 1: الحيلة فين؟
    act.appendChild(el("p", "scene", "الرسم ده بيضلل إزاي؟"));
    var o = el("div", "opts");
    shuffle(st.opts).forEach(function (id) {
      var b = el("button", null, G.tricks[id]);
      b.onclick = function () {
        tries++;
        if (id !== st.trick) { b.disabled = true; b.classList.add("wrong"); return; }
        b.classList.add("right"); o.querySelectorAll("button").forEach(function (x) { x.disabled = true; });
        score += tries === 1 ? 4 : tries === 2 ? 2 : 1;
        fixStep();
      };
      o.appendChild(b);
    });
    act.appendChild(o);

    // الخطوة 2: صلّح الرسم بإيدك
    function fixStep() {
      var f = el("button", "btn ch-fix", "🛠 " + st.fix);
      f.onclick = function () {
        f.disabled = true;
        tween(svg, st.fake, st.honest, function () { card.classList.add("ch-honest"); var nl = legend(st.honest); lg.replaceWith(nl); lg = nl; askStep(); });
      };
      act.appendChild(f);
    }
    // الخطوة 3: الحكم على العنوان
    function askStep() {
      act.appendChild(el("p", "scene", st.q));
      var q = el("div", "opts");
      st.qopts.forEach(function (t, j) {
        var b = el("button", null, t);
        b.onclick = function () {
          q.querySelectorAll("button").forEach(function (x, i) { x.disabled = true; if (i === st.a) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); });
          if (j === st.a) score += 6; else score += 1;
          finish();
        };
        q.appendChild(b);
      });
      act.appendChild(q);
    }
    function finish() {
      score = Math.min(10, score);
      S.record(KEY, "c" + k, score);
      if (window.MizanAuth && MizanAuth.score) MizanAuth.score("charts", score);
      var fb = el("div", "court-fb");
      var p = el("p", null, st.why + " ");
      if (st.entry) { var a = el("a", null, "اقرا عن «" + (NAMES[st.entry] || st.entry) + "»"); a.href = root + "atlas/" + st.entry + "/"; p.appendChild(a); }
      fb.appendChild(p); act.appendChild(fb);
      var w = el("div", "court-end");
      w.appendChild(el("p", "big-stars", S.stars(S.starsFor(score))));
      w.appendChild(S.endBar({ k: k, count: G.stages.length, play: play, map: map,
        share: "كشفت الحيلة في رسم «" + st.title + "» على ميزان ⚖️📊\nتقدر تكشفها إنت؟ " + location.href.split("?")[0] }));
      act.appendChild(w);
    }
  }
  map();
})();
