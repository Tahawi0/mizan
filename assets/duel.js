// تحدّي صاحبك: 5 أسئلة، ولينك فيه نتيجتك. صاحبك يلعب نفس الأسئلة، وتتقارنوا سؤال سؤال.
// كل البيانات جوه اللينك نفسه، ومفيش حاجة بتتحفظ على السيرفر.
(function () {
  var all = window.MIZAN_PUZZLES || [], root = document.body.getAttribute("data-root") || "./";
  var NAMES = window.MIZAN_NAMES || {}, box = document.getElementById("game"), N = 5;
  var byId = {}; all.forEach(function (p) { byId[p.id] = p; });
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function enc(o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function dec(s) { try { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return JSON.parse(decodeURIComponent(escape(atob(s)))); } catch (e) { return null; } }
  function nick(s) { return String(s || "").replace(/[<>]/g, "").trim().slice(0, 20); }
  function bits(a) { return Array.isArray(a) && a.length === N && a.every(function (x) { return x === 0 || x === 1; }); }
  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }
  function link(o) { return location.origin + location.pathname + "?d=" + enc(o); }
  function share(text, btn) {
    if (navigator.share) navigator.share({ text: text }).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { btn.textContent = "اتنسخ اللينك ✓"; });
  }

  var d = dec(new URLSearchParams(location.search).get("d") || "");
  if (d && !(Array.isArray(d.q) && d.q.length === N && d.q.every(function (x) { return byId[x]; }) && bits(d.a) && nick(d.n))) d = null;
  if (d && d.a2 && !(bits(d.a2) && nick(d.n2))) d.a2 = null;
  var myName = ""; try { myName = localStorage.getItem("mizan-duel-name") || ""; } catch (e) {}

  function nameForm(lead, cb) {
    box.innerHTML = "";
    var s = el("div", "today");
    s.appendChild(el("p", "lead", lead));
    var f = el("form", "nick-form"), inp = el("input"); inp.maxLength = 20; inp.placeholder = "اسمك (هيظهر لصاحبك)"; inp.value = myName; inp.required = true;
    var b = el("button", "btn", "يلا"); b.type = "submit"; f.appendChild(inp); f.appendChild(b); s.appendChild(f);
    f.onsubmit = function (e) { e.preventDefault(); var v = nick(inp.value); if (!v) return; myName = v; try { localStorage.setItem("mizan-duel-name", v); } catch (x) {} cb(); };
    box.appendChild(s);
  }

  function quiz(qs, rival, done) {
    var i = 0, ans = [];
    function ask() {
      box.innerHTML = "";
      var p = byId[qs[i]];
      box.appendChild(el("p", "kicker", "سؤال " + (i + 1) + " من " + N + (rival ? " · " + rival.n + " جاوب عليه " + (rival.a[i] ? "صح ✓" : "غلط ✗") : "")));
      var bar = el("div", "bar"), bi = el("i"); bi.style.width = (i / N * 100) + "%"; bar.appendChild(bi); box.appendChild(bar);
      box.appendChild(el("p", "scene", p.scene));
      box.appendChild(el("p", "lead", "إيه المغالطة هنا؟"));
      var o = el("div", "opts"), why = el("p", "note");
      p.options.forEach(function (t, k) {
        var b = el("button", null, t);
        b.onclick = function () {
          o.querySelectorAll("button").forEach(function (x, j) { x.disabled = true; if (j === p.answer) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); });
          ans.push(k === p.answer ? 1 : 0);
          if (p.why) { why.textContent = p.why; box.appendChild(why); }
          var nx = el("button", "btn", i < N - 1 ? "اللي بعده" : "النتيجة"); nx.onclick = function () { i++; if (i < N) ask(); else done(ans); };
          box.appendChild(nx);
        };
        o.appendChild(b);
      });
      box.appendChild(o);
    }
    ask();
  }

  function table(o) {
    var t = el("table", "duel-table"), h = el("tr");
    ["", o.n, o.n2].forEach(function (x) { h.appendChild(el("th", null, x)); }); t.appendChild(h);
    o.q.forEach(function (id, i) {
      var r = el("tr"), p = byId[id];
      var c0 = el("td"), a = el("a", null, NAMES[p.entry] || ("سؤال " + (i + 1))); a.href = root + "atlas/" + p.entry + "/"; c0.appendChild(a); r.appendChild(c0);
      r.appendChild(el("td", o.a[i] ? "ok" : "no", o.a[i] ? "✓" : "✗")); r.appendChild(el("td", o.a2[i] ? "ok" : "no", o.a2[i] ? "✓" : "✗"));
      t.appendChild(r);
    });
    var f = el("tr", "duel-sum"); f.appendChild(el("td", null, "المجموع")); f.appendChild(el("td", null, sum(o.a) + " / " + N)); f.appendChild(el("td", null, sum(o.a2) + " / " + N)); t.appendChild(f);
    return t;
  }
  // me: "b" لو إنت اللي قبلت التحدي، وnull لو بتتفرج على نتيجة
  function verdict(o, me) {
    var a = sum(o.a), b = sum(o.a2);
    if (a === b) return "تعادل! " + a + " لـ " + b + ". محتاجين ماتش فاصل.";
    var bWins = b > a, txt = me === "b" ? (bWins ? "إنت كسبت" : o.n + " كسب") : (bWins ? o.n2 : o.n) + " كسب";
    return txt + " " + Math.max(a, b) + " لـ " + Math.min(a, b) + "!";
  }

  function fresh() {
    nameForm("تحدّي صاحبك في 5 أسئلة مغالطات. هتلعب الأول، وبعدين تبعتله لينك فيه نتيجتك. هو هيلعب نفس الأسئلة بالظبط، ويشوف إنت جاوبت إزاي في كل سؤال.", function () {
      var qs = shuffle(all.map(function (p) { return p.id; })).slice(0, N);
      quiz(qs, null, function (ans) {
        box.innerHTML = "";
        var w = el("div", "today");
        w.appendChild(el("p", "big-score", sum(ans) + " / " + N));
        w.appendChild(el("p", "lead", "دلوقتي ابعت التحدي. صاحبك هيشوف نتيجتك سؤال بسؤال وهو بيلعب."));
        var url = link({ n: myName, q: qs, a: ans }), b = el("button", "btn", "ابعت التحدي");
        b.onclick = function () { share("ميزان — تحدّي ⚖️\n" + myName + " جاب " + sum(ans) + " من " + N + " في كشف المغالطات. تقدر تغلبه؟\n" + url, b); };
        w.appendChild(b); box.appendChild(w);
        try { localStorage.setItem("mizan-duel", JSON.stringify({ sent: 1 })); } catch (e) {}
      });
    });
  }

  function accept() {
    nameForm(d.n + " بيتحداك! جاب " + sum(d.a) + " من " + N + " في نفس الأسئلة دي. وإنت بتلعب، هتشوف هو جاوب إزاي في كل سؤال.", function () {
      quiz(d.q, d, function (ans) {
        var o = { n: d.n, q: d.q, a: d.a, n2: myName, a2: ans };
        box.innerHTML = "";
        var w = el("div", "today");
        w.appendChild(el("p", "kicker", "النتيجة"));
        w.appendChild(el("h2", null, verdict(o, "b")));
        w.appendChild(table(o));
        var b = el("button", "btn", "ابعتله النتيجة"), nw = el("button", "btn ghost", "تحدّي جديد");
        b.onclick = function () { share("ميزان — نتيجة التحدي ⚖️\n" + verdict(o, "b") + "\nشوف الجدول:\n" + link(o), b); };
        nw.onclick = function () { history.replaceState(null, "", location.pathname); d = null; fresh(); };
        var p = el("p"); p.appendChild(b); p.appendChild(document.createTextNode(" ")); p.appendChild(nw); w.appendChild(p);
        box.appendChild(w);
        if (window.MizanAuth && MizanAuth.score) MizanAuth.score("duel", sum(ans) * 2);
        try { var r = JSON.parse(localStorage.getItem("mizan-duel") || "{}"); r.played = (r.played || 0) + 1; if (sum(ans) > sum(d.a)) r.won = (r.won || 0) + 1; localStorage.setItem("mizan-duel", JSON.stringify(r)); } catch (e) {}
      });
    });
  }

  function view() {
    box.innerHTML = "";
    var w = el("div", "today");
    w.appendChild(el("p", "kicker", "نتيجة تحدّي"));
    w.appendChild(el("h2", null, verdict(d, null)));
    w.appendChild(table(d));
    var nw = el("button", "btn", "ماتش جديد"); nw.onclick = function () { history.replaceState(null, "", location.pathname); d = null; fresh(); };
    w.appendChild(nw); box.appendChild(w);
  }

  if (!d) fresh(); else if (d.a2) view(); else accept();
})();
