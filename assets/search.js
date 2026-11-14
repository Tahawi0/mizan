(function () {
  var root = document.body.getAttribute("data-root") || "./";
  var input = document.getElementById("s-q"), out = document.getElementById("s-out"), idx = null;
  function render(q) {
    out.innerHTML = "";
    if (!MizanSearch.terms(q).length) { out.innerHTML = '<p class="lead">اكتب كلمة: «تعميم»، «كانط»، «إعلانات»، «حجة»…</p>'; return; }
    var res = MizanSearch.search(idx, q, 30);
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
    idx = data.map(MizanSearch.prep);
    var q = new URLSearchParams(location.search).get("q") || "";
    input.value = q; render(q); input.focus();
    var tm; input.oninput = function () { clearTimeout(tm); tm = setTimeout(function () {
      render(input.value); history.replaceState(null, "", input.value ? "?q=" + encodeURIComponent(input.value) : location.pathname); }, 120); };
  });
})();
