(function () {
  var data = window.MIZAN_PUZZLES || [];
  var root = document.body.getAttribute("data-root") || "./";
  var START = Date.UTC(2026, 10, 1); // first puzzle day
  var dayNo = Math.floor((Date.now() - START) / 86400000);
  if (!data.length) return;
  var todayIdx = ((dayNo % data.length) + data.length) % data.length;
  var q = parseInt(new URLSearchParams(location.search).get("p"), 10);
  var practice = !isNaN(q) && q >= 0 && q < data.length && q !== todayIdx;
  var p = data[practice ? q : todayIdx];

  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var st = load("mizan-stats", { streak: 0, best: 0, last: -1, played: 0, wins: 0 });
  var done = practice ? null : load("mizan-day-" + dayNo, null);

  if (practice) { var lab = document.getElementById("dayno").parentNode; lab.firstChild.textContent = "تمرين، لغز رقم "; }
  document.getElementById("dayno").textContent = practice ? (q + 1) : (dayNo + 1);
  var past = document.getElementById("past");
  if (past) {
    var seen = Math.min(dayNo, data.length - 1);
    for (var k = 0; k < data.length; k++) {
      if (k === todayIdx || (dayNo < data.length && k > seen)) continue;
      var a = document.createElement("a");
      a.className = "tile"; a.href = "?p=" + k;
      a.innerHTML = "<span>لغز " + (k + 1) + "</span>";
      var bb = document.createElement("b"); bb.textContent = data[k].scene.slice(0, 60) + "…"; a.appendChild(bb);
      past.appendChild(a);
    }
    if (!past.children.length) { document.getElementById("past-h").style.display = "none"; past.style.display = "none"; }
  }
  document.getElementById("scene").textContent = p.scene;
  var box = document.getElementById("opts");
  p.options.forEach(function (o, i) {
    var b = document.createElement("button");
    b.textContent = o;
    b.onclick = function () { pick(i); };
    box.appendChild(b);
  });

  function show(i) {
    var btns = box.querySelectorAll("button");
    if (practice) { var t = document.createElement("a"); t.className = "btn ghost"; t.href = "./"; t.textContent = "ارجع للغز النهارده"; document.getElementById("reveal").appendChild(t); }
    btns.forEach(function (b, j) {
      b.disabled = true;
      if (j === p.answer) b.classList.add("right");
      else if (j === i) b.classList.add("wrong");
    });
    var ok = i === p.answer;
    document.getElementById("verdict").textContent = ok ? "صح عليك! وزنتها صح." : "قربت. الإجابة: " + p.options[p.answer];
    document.getElementById("why").textContent = p.why;
    document.getElementById("more").href = root + "atlas/" + p.entry + "/";
    document.getElementById("reveal").classList.add("show");
    renderStats();
  }

  function pick(i) {
    if (done !== null) return;
    done = i;
    if (practice) { show(i); return; }
    save("mizan-day-" + dayNo, i);
    var ok = i === p.answer;
    st.played++;
    if (ok) {
      st.wins++;
      st.streak = (st.last === dayNo - 1) ? st.streak + 1 : 1;
      st.best = Math.max(st.best, st.streak);
    } else { st.streak = 0; }
    st.last = dayNo;
    save("mizan-stats", st);
    show(i);
  }

  function renderStats() {
    document.getElementById("s-streak").textContent = st.streak;
    document.getElementById("s-best").textContent = st.best;
    document.getElementById("s-played").textContent = st.played;
  }

  document.getElementById("share").onclick = function () {
    var ok = done === p.answer;
    var txt = "ميزان — " + (practice ? "لغز #" + (q + 1) : "مغالطة اليوم #" + (dayNo + 1)) + "\n" + (ok ? "⚖️ وزنتها صح" : "❌ المرة الجاية") + " | سلسلة: " + st.streak + "\n" + location.href;
    var btn = this;
    function done2() { btn.textContent = "اتنسخ ✓"; }
    if (navigator.share) { navigator.share({ text: txt }).catch(function () {}); }
    else if (navigator.clipboard) { navigator.clipboard.writeText(txt).then(done2, function () {}); }
  };

  if (done !== null) show(done); else renderStats();
})();
