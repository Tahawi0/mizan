(function () {
  var all = window.MIZAN_PUZZLES || [];
  var root = document.body.getAttribute("data-root") || "./";
  var $ = function (id) { return document.getElementById(id); };
  var N = 10, qs = [], i = 0, score = 0, wrong = [];
  // وضع التحدي: ?c=ids&s=score يدي صاحبك نفس الأسئلة.
  var sp = new URLSearchParams(location.search), ch = null;
  (function () {
    var ids = (sp.get("c") || "").split(".").map(Number), byId = {};
    all.forEach(function (p) { byId[p.id] = p; });
    var list = ids.map(function (k) { return byId[k]; }).filter(Boolean);
    var s = parseInt(sp.get("s"), 10);
    if (list.length === N && s >= 0 && s <= N) ch = { qs: list, s: s };
  })();
  if (ch) { var bn = $("q-banner"); bn.hidden = false; bn.textContent = "صاحبك جاب " + ch.s + " من 10 في نفس الأسئلة دي. تقدر تغلبه؟"; }

  function shuffle(a) { for (var k = a.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)); var t = a[k]; a[k] = a[j]; a[j] = t; } return a; }

  function start() {
    qs = ch ? ch.qs.slice() : shuffle(all.slice()).slice(0, N); i = 0; score = 0; wrong = [];
    $("q-intro").style.display = "none"; $("q-end").style.display = "none"; $("q-play").style.display = "";
    ask();
  }

  function ask() {
    var p = qs[i];
    $("q-no").textContent = (i + 1) + " من " + N;
    $("q-bar").style.width = (i / N * 100) + "%";
    $("q-scene").textContent = p.scene;
    $("q-why").textContent = ""; $("q-next").style.display = "none";
    var box = $("q-opts"); box.innerHTML = "";
    p.options.forEach(function (o, k) {
      var b = document.createElement("button"); b.textContent = o;
      b.onclick = function () { pick(k); }; box.appendChild(b);
    });
  }

  function pick(k) {
    var p = qs[i], btns = $("q-opts").querySelectorAll("button");
    btns.forEach(function (b, j) { b.disabled = true; if (j === p.answer) b.classList.add("right"); else if (j === k) b.classList.add("wrong"); });
    if (k === p.answer) score++; else wrong.push(p);
    $("q-why").textContent = p.why;
    $("q-next").textContent = i === N - 1 ? "شوف نتيجتك" : "اللي بعده";
    $("q-next").style.display = "";
  }

  function level(s) {
    if (s === 10) return "ميزانك مظبوط على الشعرة.";
    if (s >= 8) return "عينك حلوة، قليل اللي بيعدي عليك.";
    if (s >= 5) return "بداية كويسة، وفي حيل لسه بتعدي.";
    return "الحيل دي بتعدي على ناس كتير. اقرا الأطلس وجرّب تاني.";
  }

  function end() {
    $("q-play").style.display = "none"; $("q-end").style.display = "";
    $("q-bar").style.width = "100%";
    $("q-score").textContent = score;
    $("q-level").textContent = level(score);
    window.MizanAuth && MizanAuth.score && MizanAuth.score("quiz", score);
    var vs = $("q-vs");
    if (ch) { vs.hidden = false; vs.textContent = score > ch.s ? "كسبت صاحبك! إنت " + score + " وهو " + ch.s + "." : score === ch.s ? "تعادل! إنتوا الاتنين " + score + "." : "صاحبك كسب المرة دي: هو " + ch.s + " وإنت " + score + "."; ch = null; $("q-banner").hidden = true; }
    else vs.hidden = true;
    var ul = $("q-review"); ul.innerHTML = "";
    var seen = {};
    wrong.forEach(function (p) {
      if (seen[p.entry]) return; seen[p.entry] = 1;
      var li = document.createElement("li"), a = document.createElement("a");
      a.href = root + "atlas/" + p.entry + "/"; a.textContent = (window.MIZAN_NAMES || {})[p.entry] || p.entry;
      li.appendChild(a); ul.appendChild(li);
    });
    $("q-review-h").style.display = wrong.length ? "" : "none";
    try { var b = parseInt(localStorage.getItem("mizan-quiz-best") || "0", 10); if (score > b) localStorage.setItem("mizan-quiz-best", score); $("q-best").textContent = Math.max(b, score); } catch (e) { $("q-best").textContent = score; }
  }

  $("q-start").onclick = start;
  $("q-again").onclick = start;
  $("q-next").onclick = function () { i++; if (i < N) ask(); else end(); };
  $("q-challenge").onclick = function () {
    var url = location.origin + location.pathname + "?c=" + qs.map(function (p) { return p.id; }).join(".") + "&s=" + score;
    var txt = "ميزان — تحدّي ⚖️\nأنا كشفت " + score + " من 10 مغالطات. تقدر تغلبني في نفس الأسئلة؟\n" + url, btn = this;
    if (navigator.share) navigator.share({ text: txt }).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { btn.textContent = "اتنسخ اللينك ✓"; });
  };
  $("q-share").onclick = function () {
    var txt = "ميزان — اختبر نفسك\nكشفت " + score + " من " + N + " مغالطات ⚖️\n" + level(score) + "\nجرّب إنت: " + location.href.split("?")[0];
    var btn = this;
    if (navigator.share) navigator.share({ text: txt }).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { btn.textContent = "اتنسخ ✓"; }, function () {});
  };
})();
