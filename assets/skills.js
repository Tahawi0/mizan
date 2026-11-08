// شجرة مهاراتك: بتقرا تقدمك من الجهاز (ومن حسابك لو مسجّل) وبتنوّر كل مهارة على قد ما لعبت.
(function () {
  var G = window.MIZAN_GAME || {}, root = document.body.getAttribute("data-root") || "./";
  var box = document.getElementById("game"), NS = "http://www.w3.org/2000/svg";
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function sv(t, a) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); return e; }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function obj(k) { try { return JSON.parse(get(k) || "{}") || {}; } catch (e) { return {}; } }
  function starsFor(sc) { return sc == null ? 0 : sc >= 9 ? 3 : sc >= 6 ? 2 : 1; }
  function keys(prefix) { var n = 0; try { for (var i = 0; i < localStorage.length; i++) if (localStorage.key(i).indexOf(prefix) === 0) n++; } catch (e) {} return n; }

  // كل مصدر بيدّي نسبة من 0 لـ 1
  function staged(key) { var g = G.games[key]; if (!g) return 0; var d = obj(g.key), s = 0; for (var id in d) s += starsFor(d[id]); return Math.min(1, s / (g.n * 3)); }
  var SRC = {
    daily: function () { return Math.min(1, (obj("mizan-stats").played || 0) / 30); },
    quiz: function () { return Math.min(1, (+get("mizan-quiz-best") || 0) / 10); },
    lab: function () { return Math.min(1, keys("mizan-lab-") / 4); },
    profile: function () { return get("mizan-profile") ? 1 : 0; },
    paths: function () { return Math.min(1, keys("mizan-path-") / 3); },
    dilemmas: function () { return Math.min(1, keys("mizan-dilemma-") / 12); },
    bayes: function () { var d = obj("mizan-bayes"), n = 0; for (var k in d) n++; return Math.min(1, n / 4); },
    duel: function () { var d = obj("mizan-duel"); return Math.min(1, ((d.sent || 0) + (d.played || 0)) / 3); },
    debateAi: function () { return Math.min(1, (obj("mizan-debate-ai").n || 0) / 3); }
  };
  function val(src) { return SRC[src] ? SRC[src]() : staged(src); }

  function render() {
    box.innerHTML = "";
    var total = 0;
    var data = G.skills.map(function (s) {
      var v = s.src.reduce(function (a, x) { return a + val(x); }, 0) / s.src.length;
      total += v; return { s: s, v: v };
    });
    var lvl = function (v) { return v >= .8 ? "أستاذ" : v >= .45 ? "متمكن" : v > 0 ? "مبتدئ" : "لسه مبدأتش"; };
    var head = el("div", "map-head");
    head.appendChild(el("p", "lead", "كل مهارة بتنوّر على قد ما لعبت واتعلمت في الألعاب اللي ليها علاقة بيها. تقدمك محفوظ على جهازك، ولو عندك حساب بيتزامن معاه."));
    head.appendChild(el("p", "map-stars", "شجرتك منوّرة " + Math.round(total / data.length * 100) + "%"));
    box.appendChild(head);

    // الشجرة: جذع في النص، وفروع للمهارات
    var W = 360, H = 330, cx = W / 2, svg = sv("svg", { viewBox: "0 0 " + W + " " + H, "class": "sk-tree", role: "img", "aria-label": "شجرة مهاراتك" });
    svg.appendChild(sv("path", { d: "M" + cx + " " + H + " C " + (cx - 6) + " " + (H - 60) + " " + (cx + 6) + " " + (H - 120) + " " + cx + " 150", "class": "sk-trunk" }));
    var n = data.length;
    data.forEach(function (d, i) {
      var a = Math.PI * (0.08 + 0.84 * i / (n - 1)), r = 125 + (i % 2) * 22;
      var x = cx + Math.cos(Math.PI - a) * r, y = 165 - Math.sin(a) * r * .95;
      svg.appendChild(sv("path", { d: "M" + cx + " 160 Q " + ((cx + x) / 2) + " " + (y + 40) + " " + x + " " + y, "class": "sk-branch" + (d.v > 0 ? " on" : "") }));
      var g = sv("g", { "class": "sk-node", tabindex: 0 });
      g.appendChild(sv("circle", { cx: x, cy: y, r: 23, "class": "sk-bg" }));
      var C = 2 * Math.PI * 23;
      g.appendChild(sv("circle", { cx: x, cy: y, r: 23, "class": "sk-ring", "stroke-dasharray": (C * d.v).toFixed(1) + " " + C.toFixed(1), transform: "rotate(-90 " + x + " " + y + ")" }));
      if (d.v >= .45) g.appendChild(sv("circle", { cx: x, cy: y, r: 30, "class": "sk-glow", style: "opacity:" + (d.v * .9).toFixed(2) }));
      var t = sv("text", { x: x, y: y + 6, "text-anchor": "middle", "class": "sk-ico" }); t.textContent = d.s.icon; g.appendChild(t);
      var lb = sv("text", { x: x, y: y + 42, "text-anchor": "middle", "class": "sk-lab" }); lb.textContent = d.s.name; g.appendChild(lb);
      g.addEventListener("click", function () { show(d); }); g.addEventListener("keydown", function (e) { if (e.key === "Enter") show(d); });
      svg.appendChild(g);
    });
    box.appendChild(svg);
    var panel = el("div", "sk-panel"); box.appendChild(panel);
    var list = el("div", "grid sk-list");
    data.forEach(function (d) {
      var b = el("button", "tile atile"); b.type = "button";
      b.appendChild(el("span", "meta", d.s.icon + " " + lvl(d.v) + " · " + Math.round(d.v * 100) + "%"));
      b.appendChild(el("b", null, d.s.name)); b.appendChild(el("span", null, d.s.desc));
      b.onclick = function () { show(d); }; list.appendChild(b);
    });
    box.appendChild(list);
    function show(d) {
      panel.innerHTML = "";
      panel.appendChild(el("h2", null, d.s.icon + " " + d.s.name + " · " + lvl(d.v)));
      panel.appendChild(el("p", null, d.s.desc));
      panel.appendChild(el("p", "kicker", "علشان تكبّرها:"));
      var p = el("p");
      d.s.go.forEach(function (g) { var a = el("a", "btn ghost", g[1]); a.href = root + g[0]; p.appendChild(a); p.appendChild(document.createTextNode(" ")); });
      panel.appendChild(p);
      panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }
  render();
  // لو المستخدم مسجّل، بعد المزامنة نعيد الرسم
  document.addEventListener("DOMContentLoaded", function () { if (window.MizanAuth) MizanAuth.onChange(function (u) { if (u) MizanAuth.refresh().then(render, function () {}); }); });
})();
