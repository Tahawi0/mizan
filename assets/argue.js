// ابني الحجة: اختار المقدمتين اللي يثبتوا النتيجة.
(function () {
  var G = window.MIZAN_GAME || {};
  var box = document.getElementById("game"), KEY = "mizan-argue";
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }

  var lv = 0, first = 0, S = window.MizanStages, SKEY = "mizan-argue-stages";
  function map() {
    S.render(box, { key: SKEY, bossLabel: "مستوى الزعيم: 3 مقدمات",
      intro: "10 مستويات، كل واحد بيعلّمك نوع استدلال جديد. اختار المقدمات اللي لو صح، النتيجة لازم تبقى صح. لو بنيتها من أول محاولة تاخد 3 نجوم.",
      items: G.levels.map(function (L, k) { return { id: "a" + k, title: L.c, sub: L.n ? L.n + " مقدمات" : "مقدمتين" }; }),
      onPlay: function (k) { lv = k; level(); } });
  }
  function level() {
    box.innerHTML = "";
    var L = G.levels[lv], picked = [], tries = 0;
    box.appendChild(el("p", "kicker", "المستوى " + (lv + 1) + " من " + G.levels.length));
    var bar = el("div", "bar"), bi = el("i"); bi.style.width = (lv / G.levels.length * 100) + "%"; bar.appendChild(bi); box.appendChild(bar);
    var proof = el("div", "proof");
    var N = L.n || 2, slots = []; for (var q = 0; q < N; q++) slots.push(el("button", "slot", "مقدمة " + (q + 1)));
    slots.forEach(function (s, k) { s.type = "button"; s.onclick = function () { if (picked[k] != null) unpick(k); }; proof.appendChild(s); });
    proof.appendChild(el("div", "therefore", "إذن"));
    proof.appendChild(el("div", "concl", L.c));
    box.appendChild(proof);
    box.appendChild(el("p", "lead", "اسحب الكروت لخانات المقدمات، أو دوس عليها. اختار المقدمتين اللي لو صح، النتيجة لازم تبقى صح."));
    var deck = el("div", "deck"), order = shuffle(L.cards.map(function (c, i) { return i; })), btns = {};
    order.forEach(function (i) { var b = el("button", "pcard", L.cards[i].t); b.type = "button"; b.onclick = function () { if (b.dataset.dragged) { delete b.dataset.dragged; return; } pick(i); }; drag(b, i); btns[i] = b; deck.appendChild(b); });
    box.appendChild(deck);
    var msg = el("div", "argue-msg"); box.appendChild(msg);
    var check = el("button", "btn", "اتأكد من الحجة"); check.disabled = true; box.appendChild(check);
    function draw() {
      slots.forEach(function (s, k) { var i = picked[k]; s.textContent = i != null ? L.cards[i].t : "مقدمة " + (k + 1); s.classList.toggle("full", i != null); });
      Object.keys(btns).forEach(function (i) { btns[i].classList.toggle("used", picked.indexOf(+i) >= 0); });
      check.disabled = picked.filter(function (x) { return x != null; }).length < N;
    }
    function pick(i) {
      if (picked.indexOf(i) >= 0) return unpick(picked.indexOf(i));
      var k = -1; for (var q = 0; q < N; q++) if (picked[q] == null) { k = q; break; } if (k < 0) return;
      picked[k] = i; msg.innerHTML = ""; draw();
    }
    function unpick(k) { picked[k] = null; draw(); }
    function put(i, k) { var was = picked.indexOf(i); if (was >= 0) picked[was] = null; picked[k] = i; msg.innerHTML = ""; draw(); slots[k].classList.add("drop"); setTimeout(function () { slots[k].classList.remove("drop"); }, 400); }
    // سحب الكارت لخانة المقدمة (والدوس العادي شغال برضه)
    function drag(b, i) {
      b.addEventListener("pointerdown", function (e) {
        if (b.disabled || e.button > 0) return;
        var sx = e.clientX, sy = e.clientY, ghost = null, over = -1;
        function mv(ev) {
          var dx = ev.clientX - sx, dy = ev.clientY - sy;
          if (!ghost && Math.hypot(dx, dy) < 8) return;
          if (!ghost) { ghost = b.cloneNode(true); ghost.className = "pcard ghost"; ghost.style.width = b.offsetWidth + "px"; document.body.appendChild(ghost); b.classList.add("lifted"); }
          ghost.style.transform = "translate(" + (ev.clientX - b.offsetWidth / 2) + "px," + (ev.clientY - 24) + "px) rotate(-3deg)";
          over = -1; slots.forEach(function (s, k) { var r = s.getBoundingClientRect(), hit = ev.clientX > r.left && ev.clientX < r.right && ev.clientY > r.top && ev.clientY < r.bottom; s.classList.toggle("hover", hit); if (hit) over = k; });
          ev.preventDefault();
        }
        function up() {
          document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); document.removeEventListener("pointercancel", up);
          slots.forEach(function (s) { s.classList.remove("hover"); });
          if (ghost) { ghost.remove(); b.classList.remove("lifted"); b.dataset.dragged = "1"; if (over >= 0) put(i, over); }
        }
        document.addEventListener("pointermove", mv, { passive: false }); document.addEventListener("pointerup", up); document.addEventListener("pointercancel", up);
      });
    }
    check.onclick = function () {
      tries++; msg.innerHTML = "";
      var bad = picked.filter(function (i) { return !L.cards[i].ok; });
      if (!bad.length) {
        if (tries === 1) first++;
        var score = tries === 1 ? 10 : tries === 2 ? 7 : 4;
        S.record(SKEY, "a" + lv, score);
        if (window.MizanAuth && MizanAuth.score) MizanAuth.score("argue", score);
        proof.classList.add("valid");
        msg.className = "argue-msg ok"; msg.appendChild(el("b", null, "حجة سليمة!")); msg.appendChild(el("p", null, L.win));
        Object.keys(btns).forEach(function (i) { btns[i].disabled = true; }); slots.forEach(function (s) { s.disabled = true; });
        check.remove();
        var go = el("div", "court-end"); go.appendChild(el("p", "big-stars", S.stars(S.starsFor(score))));
        go.appendChild(S.endBar({ k: lv, count: G.levels.length, map: map, play: function (k) { lv = k; level(); },
          share: "بنيت حجة سليمة في «ابني الحجة» على ميزان ⚖️\nجرّب إنت: " + location.href.split("?")[0] }));
        box.appendChild(go);
      } else {
        msg.className = "argue-msg bad"; msg.appendChild(el("b", null, "الحجة دي مش بتثبت النتيجة."));
        bad.forEach(function (i) { msg.appendChild(el("p", null, "«" + L.cards[i].t + "»: " + L.cards[i].why)); });
        proof.classList.remove("shake"); void proof.offsetWidth; proof.classList.add("shake");
      }
    };
  }
  function end() {
    var d = load(); d.best = Math.max(d.best || 0, first); save(d);
    window.MizanAuth && MizanAuth.score && MizanAuth.score("argue", first / G.levels.length * 10);
    var w = el("div", "today");
    w.appendChild(el("p", "kicker", "خلّصت كل المستويات"));
    w.appendChild(el("p", "big-score", first + " / " + G.levels.length));
    w.appendChild(el("p", "lead", "ده عدد الحجج اللي بنيتها صح من أول محاولة."));
    w.appendChild(el("p", null, "اللي اتعلمته هنا: الحجة السليمة مش اللي كلامها حلو، دي اللي لو مقدماتها صح، نتيجتها لازم تبقى صح. وبعد كده، اتأكد إن المقدمات نفسها صح."));
    var p = el("p"), again = el("button", "btn", "العب تاني"), sh = el("button", "btn ghost", "شارك");
    again.onclick = function () { lv = 0; first = 0; level(); };
    sh.onclick = function () {
      var t = "بنيت " + first + " حجج سليمة من " + G.levels.length + " من أول محاولة في «ابني الحجة» على ميزان ⚖️\nجرّب إنت: " + location.href.split("?")[0];
      if (navigator.share) navigator.share({ text: t }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { sh.textContent = "اتنسخ ✓"; });
    };
    p.appendChild(again); p.appendChild(document.createTextNode(" ")); p.appendChild(sh); w.appendChild(p);
    box.appendChild(w);
  }
  map();
})();
