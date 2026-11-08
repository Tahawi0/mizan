// ناظر زِنة: مناظرة جاهزة بمراحل، ومناظرة حرة بالذكاء الاصطناعي لأصحاب الحسابات.
(function () {
  var G = window.MIZAN_GAME || {}, root = document.body.getAttribute("data-root") || "./";
  var NAMES = window.MIZAN_NAMES || {}, S = window.MizanStages;
  var box = document.getElementById("game"), KEY = "mizan-debate-stages", ZINA = root + "assets/zina/";
  var fast = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function ava(face) { var i = el("img", "ava"); i.src = ZINA + (face || "explain") + ".webp"; i.alt = ""; return i; }

  function tabs(cur) {
    var t = el("div", "tf db-tabs");
    [["stages", "مراحل جاهزة"], ["ai", "مناظرة حرة ✨"]].forEach(function (x) {
      var b = el("button", "btn ghost" + (x[0] === cur ? " on" : ""), x[1]); b.type = "button";
      b.onclick = function () { x[0] === "ai" ? aiHome() : map(); };
      t.appendChild(b);
    });
    return t;
  }
  function chat(title) {
    var phone = el("div", "chat"), top = el("div", "chat-top");
    top.appendChild(el("b", null, title)); top.appendChild(el("span", null, "زِنة ضدك، وإنت مع رأيك"));
    phone.appendChild(top);
    var feed = el("div", "chat-feed"); phone.appendChild(feed);
    return { phone: phone, feed: feed };
  }
  function bubble(feed, text, mine, face) {
    var row = el("div", "msg-row" + (mine ? " me" : "")), b = el("div", "msg" + (mine ? " me" : ""));
    if (!mine) { row.appendChild(ava(face)); b.appendChild(el("small", null, "زِنة")); }
    b.appendChild(el("p", null, text)); row.appendChild(b); feed.appendChild(row); feed.scrollTop = feed.scrollHeight;
    return b;
  }
  function typing(feed) { var t = el("div", "typing"); t.appendChild(ava("think")); t.appendChild(el("span", null, "زِنة بتفكر")); var d = el("i", "dots"); d.innerHTML = "<b></b><b></b><b></b>"; t.appendChild(d); feed.appendChild(t); feed.scrollTop = feed.scrollHeight; return t; }

  // ───── المراحل الجاهزة ─────
  function map() {
    box.innerHTML = "";
    var wrap = el("div"); box.appendChild(tabs("stages")); box.appendChild(wrap);
    S.render(wrap, { key: KEY, intro: G.intro, bossLabel: "مناظرة الزعيم",
      items: G.topics.map(function (t, k) { return { id: "d" + k, title: t.title, sub: "3 جولات", icon: ZINA + "explain.webp" }; }), onPlay: play });
  }
  function play(k) {
    var T = G.topics[k], r = 0, pts = 0;
    box.innerHTML = "";
    box.appendChild(el("p", "kicker", "المناظرة " + (k + 1) + " من " + G.topics.length));
    box.appendChild(el("p", "lead", T.you));
    var c = chat("مناظرة: " + T.title); box.appendChild(c.phone);
    var act = el("div", "chat-act"); box.appendChild(act);
    function round() {
      if (r >= T.rounds.length) return end();
      var R = T.rounds[r], t = typing(c.feed);
      setTimeout(function () {
        t.remove(); bubble(c.feed, R.z, false, "explain");
        act.innerHTML = ""; act.appendChild(el("p", "kicker", "الجولة " + (r + 1) + " من " + T.rounds.length + ": هترد بإيه؟"));
        var o = el("div", "opts");
        shuffle(R.opts).forEach(function (op) {
          var b = el("button", null, op.t);
          b.onclick = function () {
            act.innerHTML = ""; bubble(c.feed, op.t, true);
            pts += op.k === "strong" ? 10 : op.k === "weak" ? 4 : 1;
            var t2 = typing(c.feed);
            setTimeout(function () {
              t2.remove();
              var bb = bubble(c.feed, op.r, false, op.k === "strong" ? "shock" : op.k === "fallacy" ? "wink" : "think");
              var tag = el("p", "db-tag db-" + op.k, G.kinds[op.k]);
              if (op.f) { tag.appendChild(document.createTextNode(": ")); var a = el("a", null, NAMES[op.f] || op.f); a.href = root + "atlas/" + op.f + "/"; tag.appendChild(a); }
              bb.appendChild(tag);
              if (window.MizanFX && MizanFX.zina) MizanFX.zina(op.k === "strong" ? "right" : "wrong");
              r++; var nx = el("button", "btn", r < T.rounds.length ? "الجولة اللي بعدها" : "النتيجة"); nx.onclick = round; act.appendChild(nx);
            }, fast ? 100 : 900);
          };
          o.appendChild(b);
        });
        act.appendChild(o);
      }, fast ? 100 : 900);
    }
    function end() {
      var score = Math.round(pts / T.rounds.length);
      S.record(KEY, "d" + k, score);
      if (window.MizanAuth && MizanAuth.score) MizanAuth.score("debate", score);
      act.innerHTML = "";
      var w = el("div", "court-end");
      w.appendChild(el("p", "big-stars", S.stars(S.starsFor(score))));
      w.appendChild(el("p", "lead", score >= 9 ? "كسبت المناظرة! رديت على الحجة نفسها في كل جولة." : score >= 6 ? "مناظرة كويسة، بس فيه جولة رديت فيها على الشخص أو هربت من النقطة." : "زِنة كسبت المرة دي. جرّب تاني، ودوّر على الرد اللي بيرد على الحجة نفسها."));
      if (score < 9) { var again = el("button", "btn ghost", "ناظرها تاني"); again.onclick = function () { play(k); }; w.appendChild(again); }
      w.appendChild(S.endBar({ score: score, k: k, count: G.topics.length, play: play, map: map,
        share: "ناظرت زِنة في «" + T.title + "» على ميزان ⚖️🦉\nتقدر تكسبها؟ " + location.href.split("?")[0] }));
      act.appendChild(w);
    }
    round();
  }

  // ───── المناظرة الحرة (ذكاء اصطناعي) ─────
  function api(body) {
    var M = window.MizanAuth;
    return M.token().then(function (t) {
      return fetch(window.MIZAN_API + "/debate", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + t }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw d; return d; }); });
    });
  }
  function aiHome() {
    var M = window.MizanAuth;
    box.innerHTML = ""; box.appendChild(tabs("ai"));
    var s = el("div", "today");
    s.appendChild(el("h2", null, "مناظرة حرة مع زِنة"));
    s.appendChild(el("p", "lead", "اختار موضوع، أو اكتب موضوعك، وقول إنت مع ولا ضد. زِنة هتاخد الرأي العكسي وترد عليك بجد. بعد كل رد ليك، هتقولك لو فيه مغالطة في كلامك، وفي الآخر حكم على المناظرة كلها."));
    s.appendChild(el("p", "note", "المناظرة الحرة لأصحاب الحسابات بس: 3 مناظرات في اليوم، وكل مناظرة لحد 6 ردود منك. اللي بتكتبه بيتبعت لذكاء اصطناعي عشان يرد، ومش بيتنشر لحد."));
    box.appendChild(s);
    var stt = el("p", "sub"); s.appendChild(stt);
    if (!M) { stt.textContent = "الحسابات مش شغالة دلوقتي."; return; }
    M.ready().then(function () {
      if (!M.user()) {
        stt.textContent = "سجّل دخول الأول عشان تبدأ.";
        var a = el("a", "btn", "سجّل دخول"); a.href = root + "account/"; s.appendChild(a); return;
      }
      var f = el("form", "db-form");
      f.appendChild(el("label", null, "الموضوع"));
      var sel = el("select"); G.ai.topics.forEach(function (t) { var o = el("option", null, t); o.value = t; sel.appendChild(o); });
      var oc = el("option", null, "موضوع من عندي…"); oc.value = ""; sel.appendChild(oc); f.appendChild(sel);
      var own = el("input"); own.type = "text"; own.maxLength = 120; own.placeholder = "اكتب الموضوع كجملة، زي: «الصيف أحسن من الشتا»"; own.hidden = true; f.appendChild(own);
      sel.onchange = function () { own.hidden = sel.value !== ""; if (!own.hidden) own.focus(); };
      var side = "pro", sd = el("div", "tf");
      [["pro", "أنا مع"], ["con", "أنا ضد"]].forEach(function (x) {
        var b = el("button", "btn ghost" + (x[0] === side ? " on" : ""), x[1]); b.type = "button";
        b.onclick = function () { side = x[0]; sd.querySelectorAll("button").forEach(function (y) { y.classList.remove("on"); }); b.classList.add("on"); };
        sd.appendChild(b);
      });
      f.appendChild(sd);
      var go = el("button", "btn", "ابدأ المناظرة"); go.type = "submit"; f.appendChild(go);
      f.onsubmit = function (e) {
        e.preventDefault();
        var topic = (sel.value || own.value).trim();
        if (topic.length < 5) { stt.textContent = "اكتب موضوع أوضح."; return; }
        go.disabled = true; stt.textContent = "زِنة بتجهّز…";
        api({ action: "start", topic: topic, side: side }).then(function (d) { aiRun(topic, side, d); }, function (e) { go.disabled = false; stt.textContent = (e && e.error) || "مش قادرين نوصل للسيرفر دلوقتي."; });
      };
      s.appendChild(f);
    });
  }
  function aiRun(topic, side, d) {
    var id = d.id, turns = 0, scores = [], MAXT = d.max || 6;
    box.innerHTML = "";
    box.appendChild(el("p", "kicker", "مناظرة حرة · فاضلك " + d.left + " مناظرة النهارده"));
    box.appendChild(el("p", "lead", "الموضوع: «" + topic + "». إنت " + (side === "pro" ? "مع" : "ضد") + "، وزِنة " + (side === "pro" ? "ضد" : "مع") + "."));
    var c = chat("مناظرة حرة"); box.appendChild(c.phone);
    bubble(c.feed, d.reply, false, "explain");
    var meter = el("p", "db-meter"); box.appendChild(meter);
    var f = el("form", "db-input"), ta = el("textarea"); ta.maxLength = 500; ta.rows = 3; ta.placeholder = "اكتب ردك (لحد 500 حرف)";
    var send = el("button", "btn", "ابعت"); send.type = "submit"; f.appendChild(ta); f.appendChild(send); box.appendChild(f);
    var stt = el("p", "sub"); box.appendChild(stt);
    function upd() { meter.textContent = "ردودك: " + turns + " من " + MAXT + (scores.length ? " · قوة حججك: " + (scores.reduce(function (a, b) { return a + b; }, 0) / scores.length).toFixed(1) + " من 10" : ""); }
    upd();
    f.onsubmit = function (e) {
      e.preventDefault();
      var text = ta.value.trim(); if (text.length < 5) { stt.textContent = "اكتب رد أطول شوية."; return; }
      send.disabled = true; ta.disabled = true; stt.textContent = "";
      var mine = bubble(c.feed, text, true), t = typing(c.feed);
      api({ action: "turn", id: id, text: text }).then(function (r) {
        t.remove(); turns++;
        if (typeof r.score === "number") scores.push(r.score);
        if (r.fallacies && r.fallacies.length) r.fallacies.forEach(function (x) {
          var tag = el("p", "db-tag db-fallacy", "فيه «"); var a = el("a", null, NAMES[x.slug] || x.slug); a.href = root + "atlas/" + x.slug + "/"; tag.appendChild(a); tag.appendChild(document.createTextNode("»: " + x.why)); mine.appendChild(tag);
        });
        else mine.appendChild(el("p", "db-tag db-strong", "مفيش مغالطة واضحة ✓"));
        bubble(c.feed, r.reply, false, r.fallacies && r.fallacies.length ? "wink" : "think");
        upd();
        if (r.done) {
          f.remove();
          var w = el("div", "today");
          w.appendChild(el("p", "kicker", "حكم زِنة"));
          w.appendChild(el("p", "lead", r.final || "خلصت المناظرة."));
          var avg = scores.length ? scores.reduce(function (a, b) { return a + b; }, 0) / scores.length : 0;
          w.appendChild(el("p", "big-stars", S.stars(S.starsFor(avg))));
          try { var b = JSON.parse(localStorage.getItem("mizan-debate-ai") || "{}"); b.n = (b.n || 0) + 1; b.best = Math.max(b.best || 0, Math.round(avg)); localStorage.setItem("mizan-debate-ai", JSON.stringify(b)); } catch (e2) {}
          var again = el("button", "btn", "مناظرة جديدة"); again.onclick = aiHome; w.appendChild(again);
          box.appendChild(w);
        } else { send.disabled = false; ta.disabled = false; ta.value = ""; ta.focus(); }
      }, function (er) { t.remove(); send.disabled = false; ta.disabled = false; stt.textContent = (er && er.error) || "مش قادرين نوصل للسيرفر. جرب تاني."; });
    };
  }

  document.addEventListener("DOMContentLoaded", function () { if (/[?&]mode=ai/.test(location.search)) aiHome(); else map(); });
})();
