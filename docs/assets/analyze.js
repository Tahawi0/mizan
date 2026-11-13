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
    var tok = window.MizanAuth && window.MizanAuth.user() ? window.MizanAuth.token() : Promise.resolve(null);
    tok.catch(function () { return null; }).then(function (t) {
      var h = { "Content-Type": "application/json" }; if (t) h.Authorization = "Bearer " + t;
      return fetch(api + "/analyze", { method: "POST", headers: h, body: JSON.stringify({ text: text }) });
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        form.querySelector("button").disabled = false;
        if (!res.ok) {
          st.textContent = res.d.error || "حصلت مشكلة، جرب تاني.";
          if (res.d.limit && !(window.MizanAuth && window.MizanAuth.user())) { var l = document.createElement("a"); l.href = root + "account/"; l.className = "btn ghost"; l.textContent = "سجّل دخول"; l.style.marginInlineStart = "8px"; st.appendChild(document.createTextNode(" ")); st.appendChild(l); }
          return;
        }
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
  var qs = new URLSearchParams(location.search), pre = qs.get("t");
  // جاي من «مشاركة» في تطبيق تاني: النص بيتحط جاهز، والتحليل مبيبدأش غير لما المستخدم يدوس، عشان الحد اليومي
  if (!pre && (qs.has("text") || qs.has("title") || qs.has("url")) && window.MizanSRS) {
    var sh = MizanSRS.shareText({ title: qs.get("title"), text: qs.get("text"), url: qs.get("url") });
    history.replaceState(null, "", location.pathname);
    var stt = document.getElementById("an-status"), ta = document.getElementById("an-text");
    if (sh.onlyUrl) stt.textContent = "ميزان مبيفتحش اللينكات. انسخ الكلام نفسه من البوست والصقه هنا.";
    else if (sh.text) { ta.value = sh.text; stt.textContent = "الكلام وصل. راجعه ودوس «وزّن الكلام»."; form.querySelector("button").focus(); }
    return;
  }
  if (pre) { document.getElementById("an-text").value = pre.slice(0, 1000); history.replaceState(null, "", location.pathname); var go = false; try { go = sessionStorage.getItem("mizan-an-go") === "1"; sessionStorage.removeItem("mizan-an-go"); } catch (e) {} if (go && pre.trim().length >= 15) form.requestSubmit ? form.requestSubmit() : form.onsubmit(new Event("submit")); }
})();
