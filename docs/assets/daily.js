(function () {
  var data = window.MIZAN_PUZZLES || [];
  var root = document.body.getAttribute("data-root") || "./";
  var START = Date.UTC(2026, 10, 1); // first puzzle day
  var dayNo = Math.floor((Date.now() - START) / 86400000);
  if (!data.length) return;
  var p = data[((dayNo % data.length) + data.length) % data.length];

  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var st = load("mizan-stats", { streak: 0, best: 0, last: -1, played: 0, wins: 0 });
  var done = load("mizan-day-" + dayNo, null);

  document.getElementById("dayno").textContent = (dayNo + 1);
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
    var txt = "ميزان — مغالطة اليوم #" + (dayNo + 1) + "\n" + (ok ? "⚖️ وزنتها صح" : "❌ المرة الجاية") + " | سلسلة: " + st.streak + "\n" + location.href;
    var btn = this;
    function done2() { btn.textContent = "اتنسخ ✓"; }
    if (navigator.share) { navigator.share({ text: txt }).catch(function () {}); }
    else if (navigator.clipboard) { navigator.clipboard.writeText(txt).then(done2, function () {}); }
  };

  if (done !== null) show(done); else renderStats();
})();
