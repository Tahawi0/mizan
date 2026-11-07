(function () {
  var M = window.MizanAuth, root = document.body.getAttribute("data-root") || "./";
  var $ = function (id) { return document.getElementById(id); };
  var out = $("ac-out"), st = $("ac-status");
  function msg(t) { st.textContent = t || ""; }
  function err(e) {
    var c = (e && e.code) || "", m = {
      "auth/popup-closed-by-user": "قفلت نافذة جوجل قبل ما تخلص. جرب تاني.",
      "auth/invalid-email": "الإيميل ده مش مظبوط.",
      "auth/invalid-action-code": "الرابط ده اتستخدم قبل كده أو انتهى. اطلب رابط جديد.",
      "auth/network-request-failed": "مفيش اتصال بالنت.",
      "auth/too-many-requests": "محاولات كتير. استنى شوية وجرب تاني."
    };
    msg(m[c] || "حصلت مشكلة، جرب تاني.");
  }
  function show(id) { ["ac-login", "ac-me", "ac-need-email"].forEach(function (x) { $(x).hidden = x !== id; }); }
  function stats(p) {
    var s = {}; try { s = JSON.parse(p["mizan-stats"] || "{}"); } catch (e) {}
    var paths = 0; for (var k in p) if (k.indexOf("mizan-path-") === 0) { try { if (JSON.parse(p[k]).length >= 7) paths++; } catch (e) {} }
    var lab = 0; for (k in p) if (k.indexOf("mizan-lab-") === 0) lab++;
    return [[s.streak || 0, "أيام ورا بعض"], [s.best || 0, "أحسن سلسلة"], [s.played || 0, "ألغاز لعبتها"], [p["mizan-quiz-best"] || 0, "أحسن نتيجة في الاختبار"], [paths, "مسارات خلّصتها"], [lab, "تجارب في المعمل"]];
  }
  function render(me) {
    show("ac-me");
    var u = M.user();
    $("ac-name").value = (me && me.name) || (u && u.displayName) || "";
    $("ac-email").textContent = (u && u.email) || "";
    $("ac-plan").textContent = me && me.plan === "pro" ? "ميزان بلس" : "مجاني";
    var a = (me && me.analyze) || { used: 0, limit: 10 };
    $("ac-quota").textContent = Math.max(0, a.limit - a.used) + " من " + a.limit;
    var g = $("ac-stats"); g.innerHTML = "";
    stats((me && me.progress) || {}).forEach(function (x) { var d = document.createElement("div"), b = document.createElement("b"); b.textContent = x[0]; d.appendChild(b); d.appendChild(document.createTextNode(x[1])); g.appendChild(d); });
  }
  $("ac-google").onclick = function () { msg("بنفتح جوجل…"); M.google().then(function () { msg(""); }, err); };
  $("ac-mail-form").onsubmit = function (e) {
    e.preventDefault(); var em = $("ac-mail").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { msg("اكتب إيميل صح."); return; }
    msg("بنبعت الرابط…");
    M.emailLink(em).then(function () { msg("بعتنالك رابط على " + em + ". افتحه من نفس الجهاز ده، وهتدخل على طول. لو مش لاقيه، بص في الـ Spam."); }, err);
  };
  $("ac-need-form").onsubmit = function (e) {
    e.preventDefault(); msg("بندخّلك…");
    M.finishLink($("ac-need-mail").value.trim()).then(function () { msg(""); }, err);
  };
  $("ac-save").onclick = function () {
    var b = this; b.disabled = true;
    M.save({ name: $("ac-name").value }).then(function () { b.textContent = "اتحفظ ✓"; setTimeout(function () { b.textContent = "احفظ"; b.disabled = false; }, 1500); }, function () { b.disabled = false; });
  };
  $("ac-out").onclick = function () { M.signOut().then(function () { show("ac-login"); msg("خرجت من حسابك. تقدمك لسه محفوظ على الجهاز ده وفي حسابك."); }); };
  $("ac-del").onclick = function () {
    var c = $("ac-del-confirm"); if (c.hidden) { c.hidden = false; return; }
  };
  $("ac-del-yes").onclick = function () {
    msg("بنمسح…");
    M.remove().then(function () { show("ac-login"); $("ac-del-confirm").hidden = true; msg("اتمسح حسابك وكل بياناته."); }, err);
  };
  $("ac-del-no").onclick = function () { $("ac-del-confirm").hidden = true; };

  msg("لحظة…");
  M.ready().then(function () {
    if (M.isLink()) {
      return M.finishLink().then(function (r) { if (r === "need-email") { show("ac-need-email"); msg("اكتب الإيميل اللي طلبت عليه الرابط."); } });
    }
  }).then(function () {
    if (!M.user()) { if ($("ac-need-email").hidden) show("ac-login"); if (st.textContent === "لحظة…") msg(""); }
  }, err);
  M.onChange(function (u) {
    if (u) { msg("بنجيب بياناتك…"); M.refresh().then(function (me) { render(me); msg(""); }, function () { render(null); msg("مش قادرين نوصل للسيرفر دلوقتي، تقدمك محفوظ على جهازك."); }); }
  });
})();
