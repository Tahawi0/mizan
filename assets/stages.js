// خريطة المراحل المشتركة: كل مرحلة بتفتح اللي بعدها، والنجوم بتتحفظ على الجهاز (وبتتزامن مع الحساب).
(function () {
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function load(k) { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function starsFor(sc) { return sc == null ? 0 : sc >= 9 ? 3 : sc >= 6 ? 2 : 1; }
  function stars(n) { return "★★★".slice(0, n) + "☆☆☆".slice(0, 3 - n); }
  window.MizanStages = {
    stars: stars, starsFor: starsFor,
    get: function (key) { return load(key); },
    record: function (key, id, score) { var d = load(key); d[id] = Math.max(d[id] || 0, score); save(key, d); return d; },
    // opts: key, intro, items:[{id,title,sub,icon}], bossLabel, onPlay(k)
    render: function (box, o) {
      box.innerHTML = "";
      var done = load(o.key), total = 0;
      o.items.forEach(function (it) { total += starsFor(done[it.id]); });
      var top = el("div", "map-head");
      top.appendChild(el("p", "lead", o.intro));
      top.appendChild(el("p", "map-stars", "★ " + total + " من " + o.items.length * 3));
      box.appendChild(top);
      var map = el("ol", "stage-map");
      o.items.forEach(function (it, k) {
        var open = k === 0 || done[o.items[k - 1].id] != null, st = starsFor(done[it.id]), boss = k === o.items.length - 1;
        var li = el("li", "stage" + (open ? "" : " locked") + (st ? " won" : "") + (boss ? " boss" : "") + (open && !st ? " next" : ""));
        var b = el("button", "stage-btn"); b.type = "button"; b.disabled = !open;
        var no = el("span", "stage-no");
        if (it.icon && open) { var im = el("img"); im.src = it.icon; im.alt = ""; no.appendChild(im); no.classList.add("has-icon"); }
        else no.textContent = boss ? "👑" : String(k + 1);
        b.appendChild(no);
        var info = el("span", "stage-info");
        info.appendChild(el("b", null, open ? it.title : "مرحلة مقفولة"));
        info.appendChild(el("small", null, open ? (st ? stars(st) + " · " + done[it.id] + " من 10" : (boss ? (o.bossLabel || "مرحلة الزعيم") : (it.sub || "مرحلة جديدة"))) : "خلّص اللي قبلها عشان تفتحها"));
        b.appendChild(info);
        b.onclick = function () { o.onPlay(k); };
        li.appendChild(b); map.appendChild(li);
      });
      box.appendChild(map);
    },
    // أزرار آخر المرحلة: الجاية، والخريطة، والشير
    endBar: function (o) {
      var p = el("p"), last = o.k === o.count - 1;
      var nx = el("button", "btn", last ? "خريطة المراحل" : "المرحلة اللي بعدها"), mp = el("button", "btn ghost", "الخريطة"), sh = el("button", "btn ghost", "شارك");
      nx.onclick = function () { if (last) o.map(); else o.play(o.k + 1); };
      mp.onclick = o.map;
      sh.onclick = function () {
        var t = o.share;
        if (navigator.share) navigator.share({ text: t }).catch(function () {});
        else if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { sh.textContent = "اتنسخ ✓"; });
      };
      [mp, nx, sh].forEach(function (b) { p.appendChild(b); p.appendChild(document.createTextNode(" ")); });
      return p;
    }
  };
})();
