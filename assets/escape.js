// غرفة الهروب: 10 أوض، كل أوضة مرحلة، وكل باب بيتفتح بالتفكير.
(function () {
  var G = window.MIZAN_GAME || {}, root = document.body.getAttribute("data-root") || "./";
  var NAMES = window.MIZAN_NAMES || {}, S = window.MizanStages;
  var box = document.getElementById("game"), KEY = "mizan-escape-stages";
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function fmt(s) { var m = Math.floor(s / 60), r = s % 60; return m + ":" + (r < 10 ? "0" : "") + r; }
  function icon(R) { return root + "assets/escape/" + R.icon + ".webp"; }

  function map() {
    S.render(box, {
      key: KEY, intro: G.intro, bossLabel: "أوضة الزعيم: آخر قفل",
      items: G.rooms.map(function (R, k) { return { id: "r" + k, title: R.title, icon: icon(R) }; }),
      onPlay: play
    });
  }

  function play(k) {
    var R = G.rooms[k], t0 = Date.now(), pen = 0, hints = 0, timer;
    box.innerHTML = "";
    var hud = el("div", "esc-hud"), dots = el("div", "esc-dots"), clock = el("b", "esc-clock", "0:00");
    G.rooms.forEach(function (x, j) { dots.appendChild(el("i", j < k ? "done" : j === k ? "now" : "")); });
    hud.appendChild(dots); hud.appendChild(clock); box.appendChild(hud);
    var stage = el("div", "esc-stage"); box.appendChild(stage);
    function secs() { return Math.floor((Date.now() - t0) / 1000) + pen; }
    timer = setInterval(function () { clock.textContent = fmt(secs()); }, 500);
    function penalty(n) { pen += n; clock.textContent = fmt(secs()); var f = el("span", "esc-pen", "+" + n + " ث"); hud.appendChild(f); setTimeout(function () { f.remove(); }, 1200); }

    var scene = el("div", "esc-scene"), art = el("img", "esc-art"); art.src = icon(R); art.alt = "";
    var door = el("div", "door"); door.appendChild(el("span", "door-no", k === G.rooms.length - 1 ? "👑" : String(k + 1)));
    scene.appendChild(art); scene.appendChild(door);
    for (var c = 0; c < 2; c++) scene.appendChild(el("span", "candle c" + c));
    stage.appendChild(scene);
    stage.appendChild(el("p", "kicker", "الأوضة " + (k + 1) + " من " + G.rooms.length));
    stage.appendChild(el("h2", null, R.title));
    stage.appendChild(el("p", null, R.story));
    if (R.clues) { var ul = el("ul", "esc-clues"); R.clues.forEach(function (x) { ul.appendChild(el("li", null, x)); }); stage.appendChild(ul); }
    stage.appendChild(el("p", "scene", R.q));
    var area = el("div"), msg = el("p", "esc-msg");
    stage.appendChild(area); stage.appendChild(msg);

    function solved() {
      clearInterval(timer);
      area.querySelectorAll("button,input").forEach(function (x) { x.disabled = true; });
      door.classList.add("open"); scene.classList.add("solved");
      msg.className = "esc-msg ok"; msg.textContent = "اتفتح! " + R.why;
      var s = secs(), score = hints ? (s <= 120 ? 7 : 5) : (s <= 60 ? 10 : s <= 150 ? 8 : s <= 300 ? 6 : 4);
      S.record(KEY, "r" + k, score);
      if (window.MizanAuth && MizanAuth.score) MizanAuth.score("escape", score);
      var w = el("div", "today court-end");
      w.appendChild(el("p", "big-score", fmt(s)));
      w.appendChild(el("p", "big-stars", S.stars(S.starsFor(score))));
      w.appendChild(el("p", "lead", hints ? "خرجت بتلميح. جرّب تاني من غيره عشان 3 نجوم." : s <= 60 ? "سريع جداً!" : "خرجت! كل ما تبقى أسرع، نجومك تزيد."));
      w.appendChild(S.endBar({ score: score, k: k, count: G.rooms.length, play: play, map: map,
        share: "خرجت من «" + R.title + "» في غرفة الهروب على ميزان ⚖️ في " + fmt(s) + ".\nتقدر تكسر وقتي؟ " + location.href.split("?")[0] }));
      stage.appendChild(w);
    }
    function wrong(b) {
      penalty(15); msg.className = "esc-msg bad"; msg.textContent = "القفل مفتحش. فكّر تاني.";
      stage.classList.remove("shake"); void stage.offsetWidth; stage.classList.add("shake");
      if (b) { b.disabled = true; b.classList.add("wrong"); }
    }
    if (R.type === "choice") {
      var o = el("div", "opts"), opts = R.slugOpts ? R.slugOpts.map(function (x) { return NAMES[x] || x; }) : R.opts;
      opts.forEach(function (t, j) { var b = el("button", null, t); b.onclick = function () { if (j === R.a) { b.classList.add("right"); solved(); } else wrong(b); }; o.appendChild(b); });
      area.appendChild(o);
    } else {
      var f = el("form", "num-form esc-code"), inp = el("input"); inp.type = "text"; inp.inputMode = "numeric"; inp.maxLength = 4; inp.placeholder = "الرقم"; inp.setAttribute("aria-label", R.q); inp.autocomplete = "off";
      var sb = el("button", "btn", "جرّب"); sb.type = "submit"; f.appendChild(inp); f.appendChild(sb); area.appendChild(f);
      f.onsubmit = function (e) {
        e.preventDefault();
        var v = inp.value.replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }).trim();
        if (!v) return;
        if (v === R.answer) solved(); else { wrong(); inp.select(); }
      };
    }
    var h = el("button", "btn ghost esc-hint", "تلميح (+30 ثانية)");
    h.onclick = function () { hints++; penalty(30); h.replaceWith(el("p", "note", "تلميح: " + R.hint)); };
    stage.appendChild(h);
    var back = el("button", "btn ghost", "الخريطة"); back.onclick = function () { clearInterval(timer); map(); }; stage.appendChild(document.createTextNode(" ")); stage.appendChild(back);
  }
  map();
})();
