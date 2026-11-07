(function () {
  var el = document.getElementById("path");
  if (!el) return;
  var key = "mizan-path-" + el.getAttribute("data-id");
  var days = el.querySelectorAll(".day");
  var done = [];
  try { done = JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) {}

  function render() {
    var n = 0;
    days.forEach(function (d, k) {
      var on = done.indexOf(k) > -1; if (on) n++;
      d.classList.toggle("done", on);
      var b = d.querySelector(".mark");
      b.textContent = on ? "خلصته ✓" : "خلصت اليوم ده";
    });
    document.getElementById("p-bar").style.width = (n / days.length * 100) + "%";
    document.getElementById("p-count").textContent = n + " من " + days.length;
    document.getElementById("p-done").style.display = n === days.length ? "" : "none";
  }

  days.forEach(function (d, k) {
    d.querySelector(".mark").onclick = function () {
      var at = done.indexOf(k);
      if (at > -1) done.splice(at, 1); else done.push(k);
      try { localStorage.setItem(key, JSON.stringify(done)); } catch (e) {}
      render();
    };
  });
  render();
})();
