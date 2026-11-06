(function () {
  var api = window.MIZAN_API || "";
  var form = document.getElementById("an-form");
  if (!form) return;
  var out = document.getElementById("an-out");
  var root = document.body.getAttribute("data-root") || "./";
  var names = window.MIZAN_NAMES || {};
  if (!api) {
    form.querySelector("button").disabled = true;
    document.getElementById("an-status").textContent = "الخاصية دي هتشتغل قريب جداً.";
    return;
  }
  form.onsubmit = function (ev) {
    ev.preventDefault();
    var text = document.getElementById("an-text").value.trim();
    var st = document.getElementById("an-status");
    out.innerHTML = "";
    if (text.length < 15) { st.textContent = "اكتب جملة أطول شوية."; return; }
    st.textContent = "بوزن الكلام…";
    form.querySelector("button").disabled = true;
    fetch(api + "/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: text }) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        form.querySelector("button").disabled = false;
        if (!res.ok) { st.textContent = res.d.error || "حصلت مشكلة، جرب تاني."; return; }
        st.textContent = "";
        var d = res.d;
        var h = document.createElement("h2"); h.textContent = d.summary || ""; out.appendChild(h);
        (d.findings || []).forEach(function (f) {
          var c = document.createElement("div"); c.className = "card"; c.style.marginBottom = "10px";
          var t = document.createElement("b"); t.textContent = names[f.slug] || f.slug; c.appendChild(t);
          var q = document.createElement("p"); q.className = "oneline"; q.textContent = f.quote || ""; c.appendChild(q);
          var w = document.createElement("p"); w.textContent = f.why || ""; c.appendChild(w);
          if (f.reply) { var r = document.createElement("p"); r.textContent = "ترد إزاي: " + f.reply; c.appendChild(r); }
          if (names[f.slug]) { var a = document.createElement("a"); a.href = root + "atlas/" + f.slug + "/"; a.textContent = "اقرأ عنها في الأطلس"; c.appendChild(a); }
          out.appendChild(c);
        });
        var n = document.createElement("p"); n.className = "note"; n.textContent = "التحليل ده بالذكاء الاصطناعي وممكن يغلط. استخدمه كبداية تفكير، مش كحكم نهائي."; out.appendChild(n);
      }, function () { form.querySelector("button").disabled = false; st.textContent = "مقدرتش أوصل للسيرفر، جرب تاني."; });
  };
})();
