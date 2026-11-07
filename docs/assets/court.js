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

  function list() {
    box.innerHTML = "";
    var done = load();
    box.appendChild(el("p", "lead", "اختار قضية. المحامين هيتكلموا جملة جملة. أول ما تسمع مغالطة، دوس «اعتراض!». بس خلي بالك: لو اعترضت على كلام سليم، مصداقيتك بتقل."));
    var g = el("div", "grid");
    G.cases.forEach(function (c) {
      var a = el("button", "tile case-tile");
      a.appendChild(el("span", null, done[c.id] != null ? "اتحكمت: " + done[c.id] + " من 10" : "قضية جديدة"));
      a.appendChild(el("b", null, c.title)); a.appendChild(el("span", null, c.brief));
      a.onclick = function () { trial(c); }; g.appendChild(a);
    });
    box.appendChild(g);
  }

  function trial(c) {
    var i = 0, cred = 3, hit = 0, miss = 0, wrongObj = 0, total = c.lines.filter(function (l) { return l.f; }).length;
    box.innerHTML = "";
    var head = el("div", "court-head");
    head.appendChild(el("b", null, c.title));
    var credEl = el("span", "cred", "مصداقيتك " + stars(cred)); head.appendChild(credEl);
    box.appendChild(head);
    box.appendChild(el("p", "lead brief", c.brief));
    var log = el("div", "court-log"); box.appendChild(log);
    var act = el("div", "court-act"); box.appendChild(act);
    function line() {
      act.innerHTML = "";
      if (i >= c.lines.length) return verdict();
      var L = c.lines[i], row = el("div", "court-line " + L.who);
      row.appendChild(el("small", null, WHO[L.who])); row.appendChild(el("p", null, L.text));
      log.appendChild(row); row.scrollIntoView({ block: "nearest", behavior: "smooth" });
      var ob = el("button", "btn objection", "اعتراض!"), go = el("button", "btn ghost", "كمّل");
      ob.onclick = function () { object(L, row); };
      go.onclick = function () { if (L.f) { miss++; row.appendChild(el("p", "court-fb bad", "فاتتك: دي كانت «" + (NAMES[L.f] || L.f) + "». " + L.why)); } i++; line(); };
      act.appendChild(ob); act.appendChild(document.createTextNode(" ")); act.appendChild(go);
    }
    function object(L, row) {
      act.innerHTML = "";
      var stamp = el("div", "stamp", "اعتراض!"); row.appendChild(stamp);
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
    function verdict() {
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
      var score = Math.max(0, Math.round((hit / total) * 6 + (right ? 3 : 0) + Math.max(0, cred) / 3));
      score = Math.min(10, score);
      var d = load(); d[c.id] = Math.max(d[c.id] || 0, score); save(d);
      var rank = score >= 9 ? "قاضي محنّك: مفيش حيلة بتعدّي عليك." : score >= 6 ? "قاضي كويس، بس فيه حيل لسه بتعدّي." : "القاضي محتاج يركز أكتر. جرّب تاني.";
      var r = el("div", "court-end");
      r.appendChild(el("p", "stats-line", "مغالطات مسكتها: " + hit + " من " + total + " · اعتراضات في غير محلها: " + wrongObj));
      r.appendChild(el("p", "big-score", score + " / 10"));
      r.appendChild(el("p", "lead", rank));
      var p = el("p"), again = el("button", "btn", "قضية تانية"), sh = el("button", "btn ghost", "شارك");
      again.onclick = list;
      sh.onclick = function () {
        var t = "حكمت في «" + c.title + "» في محكمة ميزان ⚖️ وجبت " + score + " من 10.\nتقدر تمسك المغالطات أحسن مني؟ " + location.href.split("?")[0];
        if (navigator.share) navigator.share({ text: t }).catch(function () {});
        else if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { sh.textContent = "اتنسخ ✓"; });
      };
      p.appendChild(again); p.appendChild(document.createTextNode(" ")); p.appendChild(sh);
      r.appendChild(p); sec.appendChild(r);
    }
    line();
  }
  list();
})();
