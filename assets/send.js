(function () {
  var f = document.getElementById("send-form"), st = document.getElementById("send-status");
  if (!f) return;
  var err = new URLSearchParams(location.search).get("err");
  if (err) {
    err = err.replace(/[^a-z0-9\-\/]/gi, "").slice(0, 50);
    document.querySelector("h1").textContent = "فيه غلط؟ قولّنا";
    document.querySelector("main .lead").textContent = "شكراً إنك أخدت بالك. اكتب الغلط اللي لقيته، ولو تعرف الصح اكتبه. هنراجعه بإيدينا ونصلّحه.";
    document.querySelector('label[for="send-text"]').textContent = "الغلط إيه؟";
    document.getElementById("send-text").placeholder = "مثلاً: التاريخ ده غلط، أو المثال ده مش مناسب…";
    var w = document.getElementById("send-where"); w.value = "غلط: " + err; w.readOnly = true;
    var g = document.getElementById("send-guess"); g.closest ? null : null; document.querySelector('label[for="send-guess"]').hidden = true; g.hidden = true;
  }
  f.onsubmit = function (e) {
    e.preventDefault();
    var text = document.getElementById("send-text").value.trim();
    if (text.length < 15) { st.textContent = "اكتب الجملة كاملة (15 حرف على الأقل)."; return; }
    var btn = f.querySelector("button[type=submit]"); btn.disabled = true; st.textContent = "بيتبعت…";
    fetch(window.MIZAN_API + "/submit", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text, where: document.getElementById("send-where").value, guess: document.getElementById("send-guess").value, website: document.getElementById("send-hp").value }) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) {
        if (x.ok) { f.reset(); st.textContent = "وصلت، شكراً! هنراجعها، ولو نفعت هتلاقيها لغز في «مغالطة اليوم»."; }
        else st.textContent = x.j.error || "حصلت مشكلة، جرب تاني.";
      }).catch(function () { st.textContent = "مفيش اتصال، جرب تاني."; }).finally(function () { btn.disabled = false; });
  };
})();
