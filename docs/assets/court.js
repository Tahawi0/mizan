// محكمة ميزان: اسمع المرافعة، واعترض أول ما تسمع مغالطة.
(function () {
  var G = window.MIZAN_GAME || {}, root = document.body.getAttribute("data-root") || "./";
  var NAMES = window.MIZAN_NAMES || {};
  var box = document.getElementById("game"), KEY = "mizan-court";
  var WHO = { pro: "الاتهام", def: "الدفاع", wit: "شاهد" };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
  function stars(n) { return "★★★".slice(0, Math.max(0, n)) + "☆☆☆".slice(0, 3 - Math.max(0, n)); }

  function starsFor(sc) { return sc == null ? 0 : sc >= 9 ? 3 : sc >= 6 ? 2 : 1; }
  // خريطة المراحل: كل قضية بتفتح اللي بعدها، والعاشرة قضية الزعيم
  function list() {
    box.innerHTML = "";
    var CH = window.MizanStages && MizanStages.challenge();
    if (CH && !CH.used && G.cases[CH.k]) {
      CH.used = true;
      box.parentNode.insertBefore(el("p", "note ch-ban", "⚔ تحدّي من " + CH.n + ": " + CH.s + " من 10 في قضية «" + G.cases[CH.k].title + "». تقدر تعدّي الرقم ده؟"), box);
      if (window.MizanTrack) MizanTrack("court", "start");
      return trial(G.cases[CH.k], CH.k);
    }
    var done = load(), total = 0;
    G.cases.forEach(function (c) { total += starsFor(done[c.id]); });
    var top = el("div", "map-head");
    top.appendChild(el("p", "lead", "10 قضايا، كل واحدة أصعب من اللي قبلها. المحامين هيتكلموا جملة جملة، وأول ما تسمع مغالطة دوس «اعتراض!». لو اعترضت على كلام سليم، مصداقيتك بتقل."));
    top.appendChild(el("p", "map-stars", "★ " + total + " من " + G.cases.length * 3));
    box.appendChild(top);
    var map = el("ol", "stage-map");
    G.cases.forEach(function (c, k) {
      var open = k === 0 || done[G.cases[k - 1].id] != null, st = starsFor(done[c.id]), boss = k === G.cases.length - 1;
      var li = el("li", "stage" + (open ? "" : " locked") + (st ? " won" : "") + (boss ? " boss" : "") + (open && !st ? " next" : ""));
      var b = el("button", "stage-btn"); b.type = "button"; b.disabled = !open;
      b.appendChild(el("span", "stage-no", boss ? "👑" : String(k + 1)));
      var info = el("span", "stage-info");
      info.appendChild(el("b", null, open ? c.title : "قضية مقفولة"));
      info.appendChild(el("small", null, open ? (st ? stars(st) + " · " + done[c.id] + " من 10" : (boss ? "قضية الزعيم: 5 مغالطات مستخبية" : "قضية جديدة")) : "خلّص القضية اللي قبلها عشان تفتحها"));
      b.appendChild(info);
      b.onclick = function () { if (window.MizanTrack) MizanTrack("court", "start"); trial(c, k); };
      li.appendChild(b); map.appendChild(li);
    });
    box.appendChild(map);
  }
  function trial(c, k) {
    var i = 0, cred = 3, hit = 0, miss = 0, wrongObj = 0, total = c.lines.filter(function (l) { return l.f; }).length;
    box.innerHTML = "";
    var bench = el("div", "bench"); bench.innerHTML = '<svg class="gavel" viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><g class="gv-head"><rect x="22" y="8" width="26" height="14" rx="3" transform="rotate(-35 35 15)" fill="currentColor" fill-opacity=".15"/><path d="M33 20L14 47"/></g><path d="M8 56h34M12 52h26v4H12z"/></svg>'; box.appendChild(bench);
    var head = el("div", "court-head");
    head.appendChild(el("b", null, c.title));
    var credEl = el("span", "cred", "مصداقيتك " + stars(cred)); head.appendChild(credEl);
    box.appendChild(head);
    box.appendChild(el("p", "lead brief", c.brief));
    var stage = el("div", "court-stage"), cast = {};
    ["pro", "wit", "def"].forEach(function (w) { var f = el("figure", "actor a-" + w), im = el("img"); im.src = root + "assets/court/" + w + ".webp"; im.alt = ""; f.appendChild(im); f.appendChild(el("figcaption", null, WHO[w])); cast[w] = f; stage.appendChild(f); });
    var judge = el("img", "judge"); judge.src = root + "assets/court/judge.webp"; judge.alt = "القاضي"; stage.appendChild(judge);
    box.appendChild(stage);
    function speak(w) { Object.keys(cast).forEach(function (x) { cast[x].classList.toggle("talk", x === w); }); }
    var log = el("div", "court-log"); box.appendChild(log);
    var act = el("div", "court-act"); box.appendChild(act);
    function line() {
      act.innerHTML = "";
      if (i >= c.lines.length) return verdict();
      var L = c.lines[i], row = el("div", "court-line " + L.who); speak(L.who);
      row.appendChild(el("small", null, WHO[L.who])); row.appendChild(el("p", null, L.text));
      log.appendChild(row); row.scrollIntoView({ block: "nearest", behavior: "smooth" });
      var ob = el("button", "btn objection", "اعتراض!"), go = el("button", "btn ghost", "كمّل");
      ob.onclick = function () { object(L, row); };
      go.onclick = function () { if (L.f) { miss++; row.appendChild(el("p", "court-fb bad", "فاتتك: دي كانت «" + (NAMES[L.f] || L.f) + "». " + L.why)); } i++; line(); };
      act.appendChild(ob); act.appendChild(document.createTextNode(" ")); act.appendChild(go);
    }
    function object(L, row) {
      act.innerHTML = "";
      var stamp = el("div", "stamp", "اعتراض!"); row.appendChild(stamp); strike();
      if (!L.f) {
        cred--; wrongObj++; credEl.textContent = "مصداقيتك " + stars(cred);
        row.appendChild(el("p", "court-fb bad", "الاعتراض مرفوض. الكلام ده معلومة أو دليل عادي، مفيهوش مغالطة."));
        var go = el("button", "btn ghost", "كمّل"); go.onclick = function () { i++; line(); }; act.appendChild(go); go.focus();
        return;
      }
      act.appendChild(el("p", "kicker", "إيه المغالطة؟"));
      var opts = shuffle([L.f].concat(shuffle(G.pool.filter(function (s) { return s !== L.f; })).slice(0, 3)));
      var o = el("div", "opts");
      opts.forEach(function (s) {
        var b = el("button", null, NAMES[s] || s);
        b.onclick = function () {
          o.querySelectorAll("button").forEach(function (x) { x.disabled = true; });
          if (s === L.f) { hit++; b.classList.add("right"); row.classList.add("struck"); row.appendChild(el("p", "court-fb ok", "الاعتراض مقبول، والكلام ده يتشطب. " + L.why)); }
          else { miss++; b.classList.add("wrong"); row.appendChild(el("p", "court-fb bad", "اعتراضك في محله، بس النوع غلط. دي «" + (NAMES[L.f] || L.f) + "». " + L.why)); }
          var go = el("button", "btn ghost", "كمّل"); go.onclick = function () { i++; line(); }; act.appendChild(go); go.focus();
        };
        o.appendChild(b);
      });
      act.appendChild(o);
    }
    function strike() { bench.classList.remove("hit"); void bench.offsetWidth; bench.classList.add("hit"); if (window.MizanFX) MizanFX.play("gavel"); }
    function verdict() {
      speak(null); stage.classList.add("deliberate");
      var V = c.verdict, sec = el("div", "today");
      sec.appendChild(el("h2", null, "الحكم"));
      sec.appendChild(el("p", "scene", V.q));
      var o = el("div", "opts");
      V.opts.forEach(function (t, k) {
        var b = el("button", null, t);
        b.onclick = function () {
          o.querySelectorAll("button").forEach(function (x, j) { x.disabled = true; if (j === V.a) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); });
          sec.appendChild(el("p", null, V.why));
          finish(k === V.a, sec);
        };
        o.appendChild(b);
      });
      sec.appendChild(o); act.appendChild(sec); sec.scrollIntoView({ block: "start", behavior: "smooth" });
    }
    function finish(right, sec) {
      strike();
      var score = Math.max(0, Math.round((hit / total) * 6 + (right ? 3 : 0) + Math.max(0, cred) / 3));
      score = Math.min(10, score);
      var d = load(); d[c.id] = Math.max(d[c.id] || 0, score); save(d);
      window.MizanAuth && MizanAuth.score && MizanAuth.score("court", score);
      var rank = score >= 9 ? "قاضي محنّك: مفيش حيلة بتعدّي عليك." : score >= 6 ? "قاضي كويس، بس فيه حيل لسه بتعدّي." : "القاضي محتاج يركز أكتر. جرّب تاني.";
      var r = el("div", "court-end");
      r.appendChild(el("p", "stats-line", "مغالطات مسكتها: " + hit + " من " + total + " · اعتراضات في غير محلها: " + wrongObj));
      r.appendChild(el("p", "big-score", score + " / 10"));
      r.appendChild(el("p", "lead", rank));
      var st = starsFor(score), last = k === G.cases.length - 1;
      r.appendChild(el("p", "big-stars", stars(st)));
      r.appendChild(window.MizanStages.endBar({ score: score, k: k, count: G.cases.length, map: list, play: function (n) { trial(G.cases[n], n); },
        share: "حكمت في «" + c.title + "» في محكمة ميزان ⚖️ وجبت " + score + " من 10.\nتقدر تمسك المغالطات أحسن مني؟ " + location.href.split("?")[0] }));
      if (window.MizanTrack) MizanTrack("court", "done");
      sec.appendChild(r);
    }
    line();
  }
  list();
})();
