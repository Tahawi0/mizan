// غرفة الهروب: 5 أوض، كل باب بيتفتح بالتفكير.
(function () {
  var G = window.MIZAN_GAME || {}, root = document.body.getAttribute("data-root") || "./";
  var NAMES = window.MIZAN_NAMES || {};
  var box = document.getElementById("game"), KEY = "mizan-escape-best";
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  var ROOMS = ["<path d=\"M20 40a8 8 0 1 1 8-8h22v6h-4v6h-6v-6h-12\"/><circle cx=\"20\" cy=\"32\" r=\"3\"/>", "<circle cx=\"22\" cy=\"16\" r=\"5\"/><path d=\"M22 21v16M14 28h16M22 37l-6 12M22 37l6 12\"/><circle cx=\"46\" cy=\"16\" r=\"5\"/><path d=\"M46 21v16M38 28h16M46 37l-6 12M46 37l6 12\"/><path d=\"M42 12l8 8M50 12l-8 8\" stroke-width=\"1.5\"/>", "<rect x=\"18\" y=\"30\" width=\"32\" height=\"22\" rx=\"4\"/><path class=\"shackle\" d=\"M24 30v-8a10 10 0 0 1 20 0v8\"/><circle cx=\"34\" cy=\"40\" r=\"3\"/><path d=\"M34 43v4\"/>", "<path d=\"M14 14h40v22H14zM34 36v18M26 54h16\"/><path d=\"M20 22h28M20 28h20\" stroke-width=\"1.5\"/>", "<path d=\"M34 10v42M24 52h20M12 20h44\"/><path d=\"M18 20l-6 14h12zM50 20l-6 14h12z\"/><circle cx=\"34\" cy=\"10\" r=\"2.5\" fill=\"currentColor\"/>"];
  function fmt(s) { var m = Math.floor(s / 60), r = s % 60; return m + ":" + (r < 10 ? "0" : "") + r; }
  function best() { try { return parseInt(localStorage.getItem(KEY), 10) || 0; } catch (e) { return 0; } }

  function intro() {
    box.innerHTML = "";
    box.appendChild(el("p", "scene", G.intro));
    box.appendChild(el("p", "lead", "كل تلميح بيزوّد 30 ثانية على وقتك، وكل محاولة غلط بتزوّد 15."));
    var b0 = best(); if (b0) box.appendChild(el("p", "kicker", "أحسن وقت ليك: " + fmt(b0)));
    var b = el("button", "btn", "ادخل أول أوضة"); b.onclick = play; box.appendChild(b);
  }

  function play() {
    var r = 0, t0 = Date.now(), pen = 0, timer;
    box.innerHTML = "";
    var hud = el("div", "esc-hud"), dots = el("div", "esc-dots"), clock = el("b", "esc-clock", "0:00");
    G.rooms.forEach(function () { dots.appendChild(el("i")); });
    hud.appendChild(dots); hud.appendChild(clock); box.appendChild(hud);
    var stage = el("div", "esc-stage"); box.appendChild(stage);
    function secs() { return Math.floor((Date.now() - t0) / 1000) + pen; }
    timer = setInterval(function () { clock.textContent = fmt(secs()); }, 500);
    function penalty(n) { pen += n; clock.textContent = fmt(secs()); var f = el("span", "esc-pen", "+" + n + " ث"); hud.appendChild(f); setTimeout(function () { f.remove(); }, 1200); }
    function room() {
      stage.innerHTML = "";
      if (r >= G.rooms.length) return out();
      [].forEach.call(dots.children, function (d, k) { d.className = k < r ? "done" : k === r ? "now" : ""; });
      var R = G.rooms[r], door = el("div", "door"); door.appendChild(el("span", "door-no", String(r + 1)));
      var scene = el("div", "esc-scene"), art = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      art.setAttribute("viewBox", "0 0 68 64"); art.setAttribute("class", "esc-art"); art.setAttribute("aria-hidden", "true");
      art.innerHTML = '<g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + (ROOMS[r] || "") + "</g>";
      scene.appendChild(art); scene.appendChild(door); stage.appendChild(scene);
      for (var c = 0; c < 2; c++) { var cd = el("span", "candle c" + c); scene.appendChild(cd); }
      stage.appendChild(el("h2", null, R.title));
      stage.appendChild(el("p", null, R.story));
      if (R.clues) { var ul = el("ul", "esc-clues"); R.clues.forEach(function (c) { ul.appendChild(el("li", null, c)); }); stage.appendChild(ul); }
      stage.appendChild(el("p", "scene", R.q));
      var msg = el("p", "esc-msg"), area = el("div");
      stage.appendChild(area); stage.appendChild(msg);
      function solved() {
        area.querySelectorAll("button,input").forEach(function (x) { x.disabled = true; });
        door.classList.add("open"); scene.classList.add("solved"); msg.className = "esc-msg ok"; msg.textContent = "اتفتح! " + R.why;
        var go = el("button", "btn", r === G.rooms.length - 1 ? "اخرج" : "ادخل الأوضة اللي بعدها"); go.onclick = function () { r++; room(); };
        stage.appendChild(go); go.focus();
      }
      function wrong(b) {
        penalty(15); msg.className = "esc-msg bad"; msg.textContent = "القفل مفتحش. فكّر تاني.";
        stage.classList.remove("shake"); void stage.offsetWidth; stage.classList.add("shake");
        if (b) { b.disabled = true; b.classList.add("wrong"); }
      }
      if (R.type === "choice") {
        var o = el("div", "opts"), opts = R.slugOpts ? R.slugOpts.map(function (s) { return NAMES[s] || s; }) : R.opts;
        opts.forEach(function (t, k) { var b = el("button", null, t); b.onclick = function () { if (k === R.a) { b.classList.add("right"); solved(); } else wrong(b); }; o.appendChild(b); });
        area.appendChild(o);
      } else {
        var f = el("form", "num-form esc-code"), inp = el("input"); inp.type = "text"; inp.inputMode = "numeric"; inp.maxLength = 4; inp.placeholder = R.answer.length > 1 ? "الرقم السري" : "رقم"; inp.setAttribute("aria-label", R.q); inp.autocomplete = "off";
        var b = el("button", "btn", "جرّب"); b.type = "submit"; f.appendChild(inp); f.appendChild(b); area.appendChild(f);
        f.onsubmit = function (e) {
          e.preventDefault();
          var v = inp.value.replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }).trim();
          if (!v) return;
          if (v === R.answer) solved(); else { wrong(); inp.select(); }
        };
      }
      var h = el("button", "btn ghost esc-hint", "تلميح (+30 ثانية)");
      h.onclick = function () { penalty(30); h.replaceWith(el("p", "note", "تلميح: " + R.hint)); };
      stage.appendChild(h);
    }
    function out() {
      clearInterval(timer);
      var s = secs(), b0 = best(), rec = !b0 || s < b0;
      if (rec) try { localStorage.setItem(KEY, String(s)); } catch (e) {}
      window.MizanAuth && MizanAuth.score && MizanAuth.score("escape", s <= 180 ? 10 : s <= 300 ? 8 : s <= 480 ? 6 : 4);
      [].forEach.call(dots.children, function (d) { d.className = "done"; });
      var w = el("div", "today");
      w.appendChild(el("p", "kicker", "خرجت من البيت!"));
      w.appendChild(el("p", "big-score", fmt(s)));
      w.appendChild(el("p", "lead", rec ? "ده أحسن وقت ليك لحد دلوقتي." : "أحسن وقت ليك: " + fmt(b0)));
      var p = el("p"), again = el("button", "btn", "العب تاني"), sh = el("button", "btn ghost", "تحدّى صاحبك");
      again.onclick = play;
      sh.onclick = function () {
        var t = "خرجت من «غرفة الهروب» في ميزان ⚖️ في " + fmt(s) + ".\n5 أقفال بتتفتح بالتفكير بس. تقدر تكسر وقتي؟ " + location.href.split("?")[0];
        if (navigator.share) navigator.share({ text: t }).catch(function () {});
        else if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { sh.textContent = "اتنسخ ✓"; });
      };
      p.appendChild(again); p.appendChild(document.createTextNode(" ")); p.appendChild(sh); w.appendChild(p);
      stage.appendChild(w);
    }
    room();
  }
  intro();
})();
