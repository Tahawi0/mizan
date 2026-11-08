// شجرة الاحتمالات: خمّن الأول، وبعدين حرّك الأرقام وشوف الناس بيتقسموا.
(function () {
  var G = window.MIZAN_GAME || {}, box = document.getElementById("game"), KEY = "mizan-bayes";
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function n(v) { return v >= 100 ? Math.round(v).toLocaleString("en-US") : v >= 10 ? Math.round(v).toLocaleString("en-US") : (Math.round(v * 10) / 10).toLocaleString("en-US"); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }

  function home() {
    box.innerHTML = "";
    box.appendChild(el("p", "lead", G.intro));
    var done = load(), g = el("div", "grid");
    G.cases.forEach(function (c, k) {
      var b = el("button", "tile atile"); b.type = "button";
      b.appendChild(el("span", "meta", done[k] != null ? "✓ خمّنت " + done[k] + "%" : "مثال " + (k + 1)));
      b.appendChild(el("b", null, c.title)); b.appendChild(el("span", null, c.story.slice(0, 70) + "…"));
      b.onclick = function () { play(k); }; g.appendChild(b);
    });
    box.appendChild(g);
    box.appendChild(el("p", "note", G.note));
  }

  function post(base, hit, fp) { var tp = base * hit / 100, ff = (100 - base) * fp / 100; return { tp: tp, ff: ff, p: tp / (tp + ff) * 100 }; }

  function play(k) {
    if (window.MizanTrack) MizanTrack("bayes", "start");
    var C = G.cases[k];
    box.innerHTML = "";
    var back = el("button", "btn ghost", "كل الأمثلة"); back.onclick = home; box.appendChild(back);
    box.appendChild(el("h2", null, C.title));
    box.appendChild(el("p", "scene", C.story));
    box.appendChild(el("p", "lead", C.q + " خمّن:"));
    var f = el("div", "by-guess"), rg = el("input"); rg.type = "range"; rg.min = 0; rg.max = 100; rg.value = 50; rg.setAttribute("aria-label", "تخمينك بالنسبة المئوية");
    var out = el("b", null, "50%"); rg.oninput = function () { out.textContent = rg.value + "%"; };
    f.appendChild(rg); f.appendChild(out); box.appendChild(f);
    var go = el("button", "btn", "شوف الحقيقة"); box.appendChild(go);
    go.onclick = function () {
      var guess = +rg.value; rg.disabled = true; go.remove(); if (window.MizanTrack) MizanTrack("bayes", "done");
      var d = load(); d[k] = guess; save(d);
      reveal(C, guess);
    };
  }

  function reveal(C, guess) {
    var v = { base: C.base, hit: C.hit, fp: C.fp };
    var res = el("div", "by-res"); box.appendChild(res);
    var big = el("p", "big-score"), cmp = el("p", "lead");
    res.appendChild(big); res.appendChild(cmp);
    var grid = el("div", "by-grid"); grid.setAttribute("role", "img"); res.appendChild(grid);
    var cap = el("p", "by-cap"); res.appendChild(cap);
    var dots = []; for (var i = 0; i < 100; i++) { var s = el("i"); grid.appendChild(s); dots.push(s); }
    var tree = el("div", "by-tree"); res.appendChild(tree);
    res.appendChild(el("p", "note", C.lesson));
    // مفاتيح التحكم
    var ctl = el("div", "by-ctl");
    [["base", "نسبة «" + C.who[0] + "» من الأصل", 0.01, 60, 0.01], ["hit", "التحليل بيكشف كام % من «" + C.who[0] + "»", 50, 100, 1], ["fp", "بيطلع إيجابي غلط عند كام % من «" + C.who[1] + "»", 0, 30, 0.5]].forEach(function (x) {
      var row = el("label", "by-row"), t = el("span", null, x[1]), r = el("input"), o = el("b");
      r.type = "range"; r.min = x[2]; r.max = x[3]; r.step = x[4]; r.value = v[x[0]];
      function sync() { v[x[0]] = +r.value; o.textContent = (+r.value).toLocaleString("en-US") + "%"; draw(); }
      r.oninput = sync; row.appendChild(t); row.appendChild(r); row.appendChild(o); ctl.appendChild(row); o.textContent = (+r.value).toLocaleString("en-US") + "%";
    });
    res.appendChild(el("h3", null, "جرّب بنفسك: غيّر الأرقام"));
    res.appendChild(ctl);
    res.appendChild(el("p", "note", "المصدر: " + G.source));
    function draw() {
      var r = post(v.base, v.hit, v.fp), N = 10000, sick = N * v.base / 100;
      big.textContent = n(r.p) + "%";
      var nTrue = Math.round(r.p);
      dots.forEach(function (d, i) { d.className = i < nTrue ? "t" : "f"; });
      grid.setAttribute("aria-label", "من كل 100 " + C.pos + "، " + nTrue + " بس " + C.who[0]);
      cap.textContent = "من كل 100 شخص «" + C.pos + "»: " + nTrue + " بس فعلاً «" + C.who[0] + "» (الغامق)، و" + (100 - nTrue) + " «" + C.who[1] + "».";
      tree.innerHTML = "";
      var top = el("div", "by-node by-root", "10,000 شخص"); tree.appendChild(top);
      var lv = el("div", "by-lvl");
      [[C.who[0], sick, sick * v.hit / 100, "t"], [C.who[1], N - sick, (N - sick) * v.fp / 100, "f"]].forEach(function (x) {
        var col = el("div", "by-col");
        col.appendChild(el("div", "by-node", n(x[1]) + " " + x[0]));
        col.appendChild(el("div", "by-node by-pos by-" + x[3], n(x[2]) + " " + C.pos));
        lv.appendChild(col);
      });
      tree.appendChild(lv);
    }
    draw();
    var real = post(C.base, C.hit, C.fp).p, diff = Math.abs(guess - real);
    cmp.textContent = "إنت خمّنت " + guess + "%. " + (diff <= 10 ? "قريب جداً! إنت من القليلين." : guess > real ? "خمّنت أعلى بكتير، زي أغلب الناس وحتى أطبا كتير. السبب: بنبص على دقة التحليل وننسى قد إيه الحاجة نادرة." : "خمّنت أقل من الحقيقة. هنا الحاجة منتشرة، فالتحليل بقى موثوق أكتر.");
    if (window.MizanFX && MizanFX.zina) MizanFX.zina(diff <= 10 ? "right" : "wrong");
  }
  home();
})();
