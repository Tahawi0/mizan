// سماء المغالطات: الأطلس كله نجوم. دوس على نجمة تنوّر قرايبها اللي بيتلخبطوا معاها.
(function () {
  var G = window.MIZAN_GAME || {}, root = document.body.getAttribute("data-root") || "./";
  var box = document.getElementById("game"), NS = "http://www.w3.org/2000/svg";
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function sv(t, a) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); return e; }
  var E = G.entries, idx = {}; E.forEach(function (e, i) { idx[e.s] = i; });
  var links = [], deg = E.map(function () { return 0; });
  E.forEach(function (e, i) { if (e.c && idx[e.c] != null && idx[e.c] !== i) { var j = idx[e.c]; if (!links.some(function (l) { return (l[0] === j && l[1] === i); })) { links.push([i, j]); deg[i]++; deg[j]++; } } });

  // ترتيب «زهرة عباد الشمس»: المغالطات في مجرة والانحيازات في مجرة. على الموبايل فوق بعض، وعلى الشاشة الكبيرة جنب بعض.
  var tall = (box.clientWidth || 600) < 560, W = tall ? 400 : 640, H = tall ? 700 : 440, s = 11, rnd = function () { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  var C = { fallacy: tall ? [W / 2, 200] : [W * .7, H / 2], bias: tall ? [W / 2, 530] : [W * .28, H / 2] };
  var cnt = { fallacy: 0, bias: 0 }, tot = { fallacy: 0, bias: 0 }; E.forEach(function (e) { tot[e.k]++; });
  var P = E.map(function (e) {
    var i = cnt[e.k]++, R = tall ? (e.k === "fallacy" ? 175 : 150) : (e.k === "fallacy" ? 190 : 165), r = R * Math.sqrt((i + .5) / tot[e.k]), a = i * 2.39996;
    return { x: C[e.k][0] + Math.cos(a) * r * (tall ? 1 : .95), y: C[e.k][1] + Math.sin(a) * r * (tall ? .88 : 1) };
  });
  for (var it = 0; it < 80; it++) for (var a2 = 0; a2 < P.length; a2++) for (var b2 = a2 + 1; b2 < P.length; b2++) {
    var dx = P[a2].x - P[b2].x, dy = P[a2].y - P[b2].y, d = Math.sqrt(dx * dx + dy * dy) || .1;
    if (d < 40) { var m = (40 - d) / 2 / d; P[a2].x += dx * m; P[a2].y += dy * m; P[b2].x -= dx * m; P[b2].y -= dy * m; }
  }
  P.forEach(function (p) { p.x = Math.max(24, Math.min(W - 24, p.x)); p.y = Math.max(24, Math.min(H - 16, p.y)); });

  box.innerHTML = "";
  var legend = el("p", "sky-legend");
  legend.appendChild(el("span", "sky-f", "مغالطة منطقية")); legend.appendChild(el("span", "sky-b", "انحياز معرفي")); legend.appendChild(el("small", null, "الخط بين نجمتين: حاجتين الناس بتتلخبط بينهم"));
  box.appendChild(legend);
  var sky = el("div", "sky-wrap"), svg = sv("svg", { viewBox: "0 0 " + W + " " + H, "class": "sky", role: "group", "aria-label": "سماء المغالطات" });
  for (var k = 0; k < 90; k++) svg.appendChild(sv("circle", { cx: rnd() * W, cy: rnd() * H, r: rnd() * 1.1 + .2, "class": "sky-dust" }));
  var lines = links.map(function (l) { var p = P[l[0]], q = P[l[1]], ln = sv("line", { x1: p.x, y1: p.y, x2: q.x, y2: q.y, "class": "sky-link" }); svg.appendChild(ln); return ln; });
  var stars = E.map(function (e, i) {
    var g = sv("g", { "class": "sky-star " + (e.k === "fallacy" ? "f" : "b"), tabindex: 0, role: "button", "aria-label": e.n });
    var r = 4 + deg[i] * 1.4;
    g.appendChild(sv("circle", { cx: P[i].x, cy: P[i].y, r: r * 2.6, "class": "sky-halo" }));
    g.appendChild(sv("circle", { cx: P[i].x, cy: P[i].y, r: r, "class": "sky-core" }));
    var t = sv("text", { x: P[i].x, y: P[i].y - r - 6, "text-anchor": "middle", "class": "sky-name" }); t.textContent = e.n; g.appendChild(t);
    g.style.animationDelay = (i % 9) * .35 + "s";
    g.addEventListener("click", function () { pick(i); });
    g.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pick(i); } });
    svg.appendChild(g); return g;
  });
  sky.appendChild(svg); box.appendChild(sky);
  var card = el("div", "sky-card"); card.appendChild(el("p", "lead", "دوس على أي نجمة.")); box.appendChild(card);

  function pick(i) {
    var near = {}; near[i] = 1;
    links.forEach(function (l, n) { var on = l[0] === i || l[1] === i; lines[n].classList.toggle("on", on); if (on) { near[l[0]] = 1; near[l[1]] = 1; } });
    stars.forEach(function (g, j) { g.classList.toggle("dim", !near[j]); g.classList.toggle("sel", j === i); });
    var e = E[i]; card.innerHTML = "";
    card.appendChild(el("p", "kicker", e.k === "fallacy" ? "مغالطة منطقية" : "انحياز معرفي"));
    card.appendChild(el("h2", null, e.n));
    card.appendChild(el("p", null, e.o));
    var p = el("p"), a = el("a", "btn", "افتح المدخل"); a.href = root + "atlas/" + e.s + "/"; p.appendChild(a);
    Object.keys(near).forEach(function (j) { j = +j; if (j === i) return; p.appendChild(document.createTextNode(" ")); var b = el("button", "btn ghost", "↔ " + E[j].n); b.onclick = function () { pick(j); }; p.appendChild(b); });
    card.appendChild(p);
    try { var seen = JSON.parse(localStorage.getItem("mizan-sky") || "[]"); if (seen.indexOf(e.s) < 0) { seen.push(e.s); localStorage.setItem("mizan-sky", JSON.stringify(seen)); } } catch (x) {}
  }
  var q = new URLSearchParams(location.search).get("s"); if (q && idx[q] != null) pick(idx[q]);
})();
