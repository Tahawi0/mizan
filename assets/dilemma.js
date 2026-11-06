(function () {
  var box = document.getElementById("dilemma");
  if (!box) return;
  var id = box.getAttribute("data-id");
  var api = window.MIZAN_API || "";
  var btns = box.querySelectorAll(".opts button");
  var key = "mizan-dilemma-" + id;
  function load() { try { var v = localStorage.getItem(key); return v === null ? null : parseInt(v, 10); } catch (e) { return null; } }
  function save(i) { try { localStorage.setItem(key, String(i)); } catch (e) {} }
  function render(mine, counts) {
    btns.forEach(function (b, j) {
      b.disabled = true;
      if (j === mine) b.classList.add("right");
      var total = counts ? counts.reduce(function (a, c) { return a + c; }, 0) : 0;
      var lab = b.querySelector("small");
      if (!lab) { lab = document.createElement("small"); lab.style.display = "block"; lab.style.fontWeight = "400"; b.appendChild(lab); }
      if (counts && total) lab.textContent = Math.round(counts[j] * 100 / total) + "% من " + total + " صوت";
      else lab.textContent = j === mine ? "ده اختيارك" : "";
    });
    document.getElementById("views").classList.add("show");
    var n = document.getElementById("vote-note");
    if (!api) n.textContent = "التصويت العام هيشتغل قريب. دلوقتي اختيارك محفوظ عندك بس.";
  }
  function fetchCounts(mine) {
    if (!api) return render(mine, null);
    fetch(api + "/votes?id=" + encodeURIComponent(id)).then(function (r) { return r.json(); })
      .then(function (d) { render(mine, d.counts); }, function () { render(mine, null); });
  }
  btns.forEach(function (b, i) {
    b.onclick = function () {
      save(i);
      if (!api) return render(i, null);
      fetch(api + "/vote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: id, choice: i }) })
        .then(function (r) { return r.json(); }).then(function (d) { render(i, d.counts); }, function () { render(i, null); });
    };
  });
  var mine = load();
  if (mine !== null) fetchCounts(mine);
})();
