// ابني الحجة: اختار المقدمتين اللي يثبتوا النتيجة.
(function () {
  var G = window.MIZAN_GAME || {};
  var box = document.getElementById("game"), KEY = "mizan-argue";
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }

  var lv = 0, first = 0;
  function level() {
    box.innerHTML = "";
    if (lv >= G.levels.length) return end();
    var L = G.levels[lv], picked = [], tries = 0;
    box.appendChild(el("p", "kicker", "المستوى " + (lv + 1) + " من " + G.levels.length));
    var bar = el("div", "bar"), bi = el("i"); bi.style.width = (lv / G.levels.length * 100) + "%"; bar.appendChild(bi); box.appendChild(bar);
    var proof = el("div", "proof");
    var slots = [el("button", "slot", "مقدمة 1"), el("button", "slot", "مقدمة 2")];
    slots.forEach(function (s, k) { s.type = "button"; s.onclick = function () { if (picked[k] != null) unpick(k); }; proof.appendChild(s); });
    proof.appendChild(el("div", "therefore", "إذن"));
    proof.appendChild(el("div", "concl", L.c));
    box.appendChild(proof);
    box.appendChild(el("p", "lead", "اختار من الكروت المقدمتين اللي لو صح، النتيجة لازم تبقى صح."));
    var deck = el("div", "deck"), order = shuffle(L.cards.map(function (c, i) { return i; })), btns = {};
    order.forEach(function (i) { var b = el("button", "pcard", L.cards[i].t); b.type = "button"; b.onclick = function () { pick(i); }; btns[i] = b; deck.appendChild(b); });
    box.appendChild(deck);
    var msg = el("div", "argue-msg"); box.appendChild(msg);
    var check = el("button", "btn", "اتأكد من الحجة"); check.disabled = true; box.appendChild(check);
    function draw() {
      slots.forEach(function (s, k) { var i = picked[k]; s.textContent = i != null ? L.cards[i].t : "مقدمة " + (k + 1); s.classList.toggle("full", i != null); });
      Object.keys(btns).forEach(function (i) { btns[i].classList.toggle("used", picked.indexOf(+i) >= 0); });
      check.disabled = picked.filter(function (x) { return x != null; }).length < 2;
    }
    function pick(i) {
      if (picked.indexOf(i) >= 0) return unpick(picked.indexOf(i));
      var k = picked[0] == null ? 0 : picked[1] == null ? 1 : -1; if (k < 0) return;
      picked[k] = i; msg.innerHTML = ""; draw();
    }
    function unpick(k) { picked[k] = null; draw(); }
    check.onclick = function () {
      tries++; msg.innerHTML = "";
      var bad = picked.filter(function (i) { return !L.cards[i].ok; });
      if (!bad.length) {
        if (tries === 1) first++;
        proof.classList.add("valid");
        msg.className = "argue-msg ok"; msg.appendChild(el("b", null, "حجة سليمة!")); msg.appendChild(el("p", null, L.win));
        Object.keys(btns).forEach(function (i) { btns[i].disabled = true; }); slots.forEach(function (s) { s.disabled = true; });
        check.remove();
        var go = el("button", "btn", lv === G.levels.length - 1 ? "شوف النتيجة" : "المستوى اللي بعده"); go.onclick = function () { lv++; level(); };
        box.appendChild(go); go.focus();
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
  level();
})();
