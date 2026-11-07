(function () {
  var root = document.body.getAttribute("data-root") || "./";
  var input = document.getElementById("s-q"), out = document.getElementById("s-out"), idx = null;
  function norm(s) {
    return (s || "").replace(/[ً-ٰٟـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/ؤ/g, "و").replace(/ئ/g, "ي").replace(/[«»"'.,،؟?!:؛]/g, " ").toLowerCase();
  }
  function strip(w) { return w.length > 4 && w.indexOf("ال") === 0 ? w.slice(2) : w; }
  function score(d, terms) {
    var s = 0;
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i], hit = 0;
      if (d.nt.indexOf(t) > -1) hit = 10; else if (d.nk.indexOf(t) > -1) hit = 4; else if (d.nx.indexOf(t) > -1) hit = 1;
      if (!hit) return 0; s += hit;
    }
    return s;
  }
  function render(q) {
    out.innerHTML = "";
    var terms = norm(q).split(/\s+/).filter(Boolean).map(strip);
    if (!terms.length) { out.innerHTML = '<p class="lead">اكتب كلمة: «تعميم»، «كانط»، «إعلانات»، «حجة»…</p>'; return; }
    var res = idx.map(function (d) { return { d: d, s: score(d, terms) }; }).filter(function (r) { return r.s; })
      .sort(function (a, b) { return b.s - a.s; }).slice(0, 30);
    var meta = document.createElement("p"); meta.className = "kicker";
    meta.textContent = res.length ? res.length + " نتيجة" : "ملقيناش حاجة. جرّب كلمة تانية أو أقصر.";
    out.appendChild(meta);
    var ul = document.createElement("ul"); ul.className = "index";
    res.forEach(function (r) {
      var li = document.createElement("li"), a = document.createElement("a"), b = document.createElement("b"), em = document.createElement("em"), sp = document.createElement("span");
      a.href = root + r.d.u; b.textContent = r.d.t; em.textContent = r.d.k; sp.textContent = r.d.d;
      a.appendChild(b); a.appendChild(em); a.appendChild(sp); li.appendChild(a); ul.appendChild(li);
    });
    out.appendChild(ul);
  }
  fetch(root + "search.json").then(function (r) { return r.json(); }).then(function (data) {
    idx = data.map(function (d) { d.nt = norm(d.t); d.nk = norm(d.k + " " + d.d); d.nx = norm(d.x); return d; });
    var q = new URLSearchParams(location.search).get("q") || "";
    input.value = q; render(q); input.focus();
    var tm; input.oninput = function () { clearTimeout(tm); tm = setTimeout(function () {
      render(input.value); history.replaceState(null, "", input.value ? "?q=" + encodeURIComponent(input.value) : location.pathname); }, 120); };
  });
})();
