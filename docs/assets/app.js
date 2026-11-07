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
