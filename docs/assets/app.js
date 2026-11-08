(function () {
  // القايمة: قسم واحد مفتوح، وزرار ☰ على الموبايل
  var dds = document.querySelectorAll("nav .dd"), nav = document.getElementById("mainnav"), bg = document.querySelector(".burger");
  dds.forEach(function (d) { d.addEventListener("toggle", function () { if (d.open && !nav.classList.contains("open")) dds.forEach(function (o) { if (o !== d) o.open = false; }); }); });
  document.addEventListener("click", function (e) { if (!e.target.closest("nav") && !e.target.closest(".burger")) { dds.forEach(function (d) { if (!nav.classList.contains("open")) d.open = false; }); } });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { dds.forEach(function (d) { d.open = false; }); if (nav.classList.contains("open")) bg.click(); } });
  if (bg) bg.onclick = function () { var o = nav.classList.toggle("open"); bg.setAttribute("aria-expanded", o); document.body.classList.toggle("menu-open", o); dds.forEach(function (d) { d.open = o; }); };
})();
(function () {
  var root = document.body.getAttribute("data-root") || "./";
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register(root + "sw.js").catch(function () {}); });
  }
  var btn = document.getElementById("install"), hint = document.getElementById("install-hint"), ev = null;
  if (!btn) return;
  var standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (standalone) return;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); ev = e; btn.hidden = false; });
  btn.onclick = function () { if (!ev) return; ev.prompt(); ev.userChoice.finally(function () { ev = null; btn.hidden = true; }); };
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) { btn.hidden = false; btn.onclick = function () { hint.hidden = !hint.hidden; }; }
})();
// عدّاد مجهول للألعاب: «بدأ» و«خلّص» بس، من غير أي بيانات عن الشخص.
window.MizanTrack = function (g, e) {
  try {
    if (!window.MIZAN_API || !/^[a-z]{2,12}$/.test(g) || (e !== "start" && e !== "done")) return;
    var k = "mz-t-" + g + e, now = Date.now(), last = +(sessionStorage.getItem(k) || 0);
    if (now - last < 20000) return; sessionStorage.setItem(k, now);
    var body = JSON.stringify({ g: g, e: e });
    if (navigator.sendBeacon) navigator.sendBeacon(window.MIZAN_API + "/evt", body);
    else fetch(window.MIZAN_API + "/evt", { method: "POST", body: body, keepalive: true }).catch(function () {});
  } catch (x) {}
};
