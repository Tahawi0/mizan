// لوحة الأرقام (لصاحب الموقع): مين بيلعب إيه، ومين بيكمّل، وبيقف فين، وصرف الذكاء الاصطناعي النهارده.
(function () {
  var G = window.MIZAN_GAME || {}, box = document.getElementById("game");
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function bar(p, cls) { var b = el("div", "bar ops-bar" + (cls ? " " + cls : "")), i = el("i"); i.style.width = Math.max(0, Math.min(100, p)) + "%"; b.appendChild(i); return b; }
  var days = 7, KEY = "mizan-ops-key";
  function getKey() { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } }
  function setKey(v) { try { if (v) localStorage.setItem(KEY, v); else localStorage.removeItem(KEY); } catch (e) {} }
  // أرقام الحدود والحسابات محتاجة مفتاح التشغيل (OPS_KEY)، وبيتحفظ في المتصفح ده بس
  function keyForm(wrong) {
    var f = el("form", "ops-key"), i = el("input"), b = el("button", "btn", "افتح");
    i.type = "password"; i.placeholder = "مفتاح التشغيل"; i.autocomplete = "off"; b.type = "submit";
    f.appendChild(el("p", "note", wrong ? "المفتاح غلط، أو لسه مش متسجّل على السيرفر." : "أرقام الحدود والحسابات محتاجة مفتاح التشغيل."));
    f.appendChild(i); f.appendChild(b);
    f.onsubmit = function (e) { e.preventDefault(); setKey(i.value.trim()); load(); };
    return f;
  }
  function load() {
    box.innerHTML = ""; box.appendChild(el("p", "lead", "لحظة…"));
    var k = getKey();
    fetch(window.MIZAN_API + "/evt?days=" + days, k ? { headers: { "X-Ops-Key": k } } : undefined).then(function (r) { return r.json(); }).then(render, function () { box.innerHTML = ""; box.appendChild(el("p", "lead", "مش قادرين نوصل للسيرفر.")); });
  }
  function render(d) {
    box.innerHTML = "";
    var tf = el("div", "tf");
    [[1, "النهارده"], [7, "7 أيام"], [30, "30 يوم"]].forEach(function (x) { var b = el("button", "btn ghost" + (x[0] === days ? " on" : ""), x[1]); b.type = "button"; b.onclick = function () { days = x[0]; load(); }; tf.appendChild(b); });
    box.appendChild(tf);
    if (!d.ops) box.appendChild(keyForm(!!getKey()));
    var o = d.ops || {}, st = el("div", "stats");
    [[(o.analyze ? o.analyze.used + " / " + o.analyze.limit : "-"), "تحليلات النهارده"], [(o.debate ? o.debate.used + " / " + o.debate.limit : "-"), "ردود المناظرة الحرة النهارده"], [o.users || 0, "حسابات"], [o.league || 0, "في الدوري"]].forEach(function (x) { var c = el("div"); c.appendChild(el("b", null, String(x[0]))); c.appendChild(document.createTextNode(x[1])); st.appendChild(c); });
    box.appendChild(st);
    if (o.debate && o.debate.used / o.debate.limit > .8) box.appendChild(el("p", "note", "⚠ المناظرة الحرة قربت من حدها النهارده. لو ده بيتكرر، فكّر ترفع الحد أو تحولها لميزة في «ميزان بلس»."));
    var names = G.names || {}, list = Object.keys(d.games || {}).map(function (k) { var g = d.games[k]; return { k: k, s: g.start || 0, d: g.done || 0, st: g.stages || [] }; }).sort(function (a, b) { return b.s - a.s; });
    box.appendChild(el("h2", null, "الألعاب (" + d.since + " لحد النهارده)"));
    if (!list.length) { box.appendChild(el("p", "lead", "لسه مفيش لعب في الفترة دي.")); return; }
    var mx = list[0].s || 1, t = el("table", "duel-table ops-table"), h = el("tr");
    ["اللعبة", "بدأ", "خلّص", "نسبة التكملة", ""].forEach(function (x) { h.appendChild(el("th", null, x)); }); t.appendChild(h);
    list.forEach(function (g) {
      var r = el("tr"), rate = g.s ? Math.round(g.d / g.s * 100) : 0;
      r.appendChild(el("td", null, names[g.k] || g.k)); r.appendChild(el("td", null, String(g.s))); r.appendChild(el("td", null, String(g.d)));
      var c = el("td", null, rate + "%"); c.className = rate >= 60 ? "ok" : rate < 30 ? "no" : ""; r.appendChild(c);
      var bc = el("td"); bc.appendChild(bar(g.s / mx * 100)); r.appendChild(bc); t.appendChild(r);
    });
    box.appendChild(t);
    box.appendChild(el("p", "sub", "«خلّص» بيتعد مرة لكل مرحلة خلصت، فممكن يبقى أكبر من «بدأ» في الألعاب اللي بمراحل."));
    box.appendChild(el("h2", null, "الناس بتوصل لأنهي مرحلة"));
    box.appendChild(el("p", "lead", "كل خط هو عدد المرات اللي مرحلة اتفتحت فيها. لو فيه نزول كبير بين مرحلتين، يبقى المرحلة اللي قبل النزول ممكن تكون صعبة أو مملة."));
    list.filter(function (g) { return g.st.length > 1; }).forEach(function (g) {
      var sec = el("section", "ops-game"); sec.appendChild(el("h3", null, names[g.k] || g.k));
      var m = Math.max.apply(null, g.st) || 1;
      g.st.forEach(function (n, i) {
        var row = el("div", "ops-row"), drop = i > 0 && g.st[i - 1] >= 5 && n < g.st[i - 1] * .5;
        row.appendChild(el("span", null, "م" + (i + 1))); row.appendChild(bar(n / m * 100, drop ? "drop" : "")); row.appendChild(el("b", null, String(n) + (drop ? " ⬇" : "")));
        sec.appendChild(row);
      });
      box.appendChild(sec);
    });
  }
  load();
})();
