// مصنع الإشاعة: العب دور صاحب صفحة تضليل، واتعلم الحيل من جوه (التطعيم النفسي).
(function () {
  var G = window.MIZAN_GAME || {}, root = document.body.getAttribute("data-root") || "./";
  var NAMES = window.MIZAN_NAMES || {}, S = window.MizanStages;
  var box = document.getElementById("game"), KEY = "mizan-rumor-stages", NS = "http://www.w3.org/2000/svg";
  var fast = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function sv(t, a) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); return e; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var levels = G.levels, all = levels.length + 1;

  // شبكة ناس ثابتة: 70 نقطة، الإشاعة بتبدأ من النص وبتتنقل للأقرب
  var NODES = (function () { var s = 7, r = function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }, a = [];
    for (var i = 0; i < 70; i++) { var ang = r() * Math.PI * 2, d = Math.sqrt(r()) * 95; a.push({ x: 160 + Math.cos(ang) * d * 1.45, y: 105 + Math.sin(ang) * d, d: d + r() * 30 }); }
    a[0] = { x: 160, y: 105, d: -1 }; return a; })();
  var ORDER = NODES.map(function (n, i) { return i; }).sort(function (a, b) { return NODES[a].d - NODES[b].d; });
  // كل واحد بيوصله البوست من أقرب حد وصله قبله
  var PARENT = {}; ORDER.forEach(function (i, k) { if (!k) return; var best = ORDER[0], bd = 1e9; for (var j = 0; j < k; j++) { var q = NODES[ORDER[j]], dd = Math.pow(q.x - NODES[i].x, 2) + Math.pow(q.y - NODES[i].y, 2); if (dd < bd) { bd = dd; best = ORDER[j]; } } PARENT[i] = best; });
  function net(spread, done) {
    var svg = sv("svg", { viewBox: "0 0 320 210", "class": "rm-net", role: "img", "aria-label": "انتشار البوست بين الناس" });
    NODES.forEach(function (n, i) {
      if (PARENT[i] != null) { var p = NODES[PARENT[i]]; svg.appendChild(sv("line", { x1: p.x, y1: p.y, x2: n.x, y2: n.y, "class": "rm-edge", "data-i": i })); }
    });
    var dots = NODES.map(function (n, i) { var c = sv("circle", { cx: n.x, cy: n.y, r: i ? 4 : 7, "class": "rm-node" + (i ? "" : " src") }); svg.appendChild(c); return c; });
    var target = Math.round(spread / 100 * NODES.length), j = 0;
    (function tick() {
      if (j >= target) return done && done();
      var i = ORDER[j++]; dots[i].classList.add("hit");
      var e = svg.querySelector('[data-i="' + i + '"]'); if (e) e.classList.add("hit");
      setTimeout(tick, fast ? 0 : 28);
    })();
    return svg;
  }

  function map() {
    S.render(box, { key: KEY, intro: G.intro, bossLabel: "مرحلة الزعيم: إنت المحقق",
      items: levels.map(function (l, k) { return { id: "r" + k, title: l.title, sub: l.tactic }; }).concat([{ id: "r" + levels.length, title: G.boss.title }]),
      onPlay: function (k) { if (k < levels.length) play(k); else boss(); } });
  }
  function endBar(k, score, title) {
    var w = el("div", "court-end");
    w.appendChild(el("p", "big-stars", S.stars(S.starsFor(score))));
    w.appendChild(S.endBar({ score: score, k: k, count: all, map: map, play: function (n) { if (n < levels.length) play(n); else boss(); },
      share: "اتعلمت حيلة «" + title + "» من جوه في «مصنع الإشاعة» على ميزان ⚖️\nجرّب تبقى صاحب صفحة إشاعات (في لعبة بس 😄): " + location.href.split("?")[0] }));
    return w;
  }

  function play(k) {
    var L = levels[k];
    box.innerHTML = "";
    box.appendChild(el("p", "kicker", "المرحلة " + (k + 1) + " من " + all + " · الحيلة: " + L.tactic));
    var hud = el("div", "rm-hud"); hud.appendChild(el("b", null, "📣 صفحة «الحقيقة الكاملة»")); var fol = el("span", null, "المتابعين: " + (1200 + k * 3400).toLocaleString("en-US")); hud.appendChild(fol);
    box.appendChild(hud);
    box.appendChild(el("p", "scene", L.mission));
    var o = el("div", "opts"), act = el("div");
    shuffle(L.opts).forEach(function (op) {
      var b = el("button", null, op.t);
      b.onclick = function () {
        o.querySelectorAll("button").forEach(function (x) { x.disabled = true; }); b.classList.add(op.k === "tactic" ? "right" : "wrong");
        var gain = Math.round(op.spread * 120);
        act.appendChild(net(op.spread, function () {
          fol.textContent = "المتابعين: " + (1200 + k * 3400 + gain).toLocaleString("en-US") + "  (+" + gain.toLocaleString("en-US") + ")";
          act.appendChild(el("p", "rm-react", op.r));
          var fb = el("div", "court-fb");
          fb.appendChild(el("b", null, op.k === "tactic" ? "دي الحيلة: " + L.tactic : op.k === "honest" ? "اخترت الصدق، والصدق مش بيولّع" : "محاولة ضعيفة"));
          var p = el("p", null, L.lesson + " ");
          var a = el("a", null, "اقرا عن «" + (NAMES[L.entry] || L.entry) + "»"); a.href = root + "atlas/" + L.entry + "/"; p.appendChild(a);
          fb.appendChild(p); act.appendChild(fb);
          var score = op.k === "tactic" ? 10 : op.k === "weak" ? 5 : 4;
          S.record(KEY, "r" + k, score);
          if (window.MizanAuth && MizanAuth.score) MizanAuth.score("rumor", score);
          if (op.k !== "tactic") { var again = el("button", "btn ghost", "جرّب الحيلة نفسها"); again.onclick = function () { play(k); }; act.appendChild(again); }
          act.appendChild(endBar(k, score, L.tactic));
        }));
      };
      o.appendChild(b);
    });
    box.appendChild(o); box.appendChild(act);
  }

  function boss() {
    var B = G.boss, posts = shuffle(B.posts), i = 0, right = 0, k = levels.length;
    box.innerHTML = "";
    box.appendChild(el("p", "kicker", "مرحلة الزعيم"));
    box.appendChild(el("h2", null, B.title));
    box.appendChild(el("p", "lead", B.intro));
    var stage = el("div"); box.appendChild(stage);
    function next() {
      stage.innerHTML = "";
      if (i >= posts.length) return end();
      var P = posts[i];
      stage.appendChild(el("p", "kicker", "بوست " + (i + 1) + " من " + posts.length));
      var card = el("div", "rm-post"); card.appendChild(el("b", null, P.who)); card.appendChild(el("p", null, P.t)); stage.appendChild(card);
      var o = el("div", "opts");
      levels.forEach(function (l, j) {
        var b = el("button", null, l.tactic);
        b.onclick = function () {
          o.querySelectorAll("button").forEach(function (x, n) { x.disabled = true; if (n === P.a) x.classList.add("right"); });
          if (j === P.a) right++; else b.classList.add("wrong");
          var nx = el("button", "btn", i < posts.length - 1 ? "البوست اللي بعده" : "النتيجة"); nx.onclick = function () { i++; next(); };
          stage.appendChild(el("p", "note", levels[P.a].lesson)); stage.appendChild(nx);
        };
        o.appendChild(b);
      });
      stage.appendChild(o);
    }
    function end() {
      var score = Math.round(right / posts.length * 10);
      S.record(KEY, "r" + k, score);
      if (window.MizanAuth && MizanAuth.score) MizanAuth.score("rumor", score);
      var w = el("div", "today");
      w.appendChild(el("p", "big-score", right + " / " + posts.length));
      w.appendChild(el("p", "lead", right === posts.length ? "مطعّم ضد الإشاعات! كشفت كل الحيل." : "كويس! ارجع للمراحل اللي غلطت في حيلتها وجرّبها تاني."));
      w.appendChild(el("p", "note", "المصدر: " + G.source));
      stage.appendChild(w); stage.appendChild(endBar(k, score, "المحقق"));
    }
    next();
  }
  map();
})();
