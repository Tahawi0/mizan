// بصمتك المعرفية: 15 موقف، رسم عنكبوتي، وكارت للشير.
(function () {
  var G = window.MIZAN_GAME || {}, root = document.body.getAttribute("data-root") || "./";
  var NAMES = window.MIZAN_NAMES || {};
  var box = document.getElementById("game"), KEY = "mizan-profile";
  var C = { paper: "#E9E1CC", leaf: "#F3EDDD", ink: "#221C14", muted: "#6B604E", gold: "#A47E2E", lapis: "#1F3B73", rule: "#CDBF9F" };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
  var AX = G.axes, max = {};
  G.items.forEach(function (it) { max[it.axis] = (max[it.axis] || 0) + 2; });

  function intro() {
    box.innerHTML = "";
    box.appendChild(el("p", "scene", "15 موقف من حياتنا. اختار اللي هتعمله فعلاً، مش اللي المفروض تعمله."));
    box.appendChild(el("p", "lead", "في الآخر هتشوف رسم لأكتر 5 انحيازات بتأثر على قراراتك."));
    var b = el("button", "btn", "ابدأ"); b.onclick = play; box.appendChild(b);
  }

  function play() {
    var qs = shuffle(G.items), i = 0, sc = {};
    AX.forEach(function (a) { sc[a.key] = 0; });
    function ask() {
      box.innerHTML = "";
      box.appendChild(el("p", "kicker", (i + 1) + " من " + qs.length));
      var bar = el("div", "bar"), bi = el("i"); bi.style.width = (i / qs.length * 100) + "%"; bar.appendChild(bi); box.appendChild(bar);
      box.appendChild(el("p", "scene", qs[i].scene));
      var o = el("div", "opts");
      shuffle(qs[i].opts).forEach(function (op) {
        var b = el("button", null, op[0]);
        b.onclick = function () { sc[qs[i].axis] += op[1]; i++; if (i < qs.length) ask(); else done(); };
        o.appendChild(b);
      });
      box.appendChild(o);
    }
    function done() {
      var pct = {};
      AX.forEach(function (a) { pct[a.key] = Math.round(sc[a.key] / max[a.key] * 100); });
      var r = { pct: pct, at: Date.now() }; save(r); result(r);
    }
    ask();
  }

  function top(r) {
    var best = null;
    AX.forEach(function (a) { if (!best || r.pct[a.key] > r.pct[best.key]) best = a; });
    return r.pct[best.key] <= 34 ? null : best;
  }

  function radar(pct, size) {
    var NS = "http://www.w3.org/2000/svg", s = document.createElementNS(NS, "svg"), c = size / 2, R = size * 0.28, n = AX.length;
    s.setAttribute("viewBox", "0 0 " + size + " " + size); s.setAttribute("class", "radar"); s.setAttribute("role", "img");
    s.setAttribute("aria-label", AX.map(function (a) { return a.label + " " + pct[a.key] + "%"; }).join("، "));
    function pt(k, f) { var ang = -Math.PI / 2 + k * 2 * Math.PI / n; return [c + Math.cos(ang) * R * f, c + Math.sin(ang) * R * f]; }
    function poly(f, cls) { var p = document.createElementNS(NS, "polygon"); p.setAttribute("points", AX.map(function (a, k) { return pt(k, f(a)).join(","); }).join(" ")); p.setAttribute("class", cls); s.appendChild(p); }
    [1, 2 / 3, 1 / 3].forEach(function (f) { poly(function () { return f; }, "grid"); });
    AX.forEach(function (a, k) { var l = document.createElementNS(NS, "line"), e = pt(k, 1); l.setAttribute("x1", c); l.setAttribute("y1", c); l.setAttribute("x2", e[0]); l.setAttribute("y2", e[1]); l.setAttribute("class", "grid"); s.appendChild(l); });
    poly(function (a) { return Math.max(0.04, pct[a.key] / 100); }, "shape");
    AX.forEach(function (a, k) {
      var p = pt(k, 1.28), t = document.createElementNS(NS, "text");
      t.setAttribute("x", p[0]); t.setAttribute("y", p[1]); t.setAttribute("text-anchor", "middle"); t.setAttribute("dominant-baseline", "middle");
      t.textContent = a.label + " " + pct[a.key] + "%"; s.appendChild(t);
    });
    return s;
  }

  function result(r) {
    box.innerHTML = "";
    var t = top(r), title = t ? t.title : G.balanced.title, desc = t ? t.desc : G.balanced.desc;
    box.appendChild(el("p", "kicker", "بصمتك المعرفية"));
    box.appendChild(el("h2", "prof-title", title));
    box.appendChild(radar(r.pct, 340));
    box.appendChild(el("p", null, desc));
    var ul = el("ul", "index");
    AX.slice().sort(function (a, b) { return r.pct[b.key] - r.pct[a.key]; }).forEach(function (a) {
      var li = el("li"), aa = el("a"); aa.href = root + "atlas/" + a.key + "/";
      aa.appendChild(el("b", null, NAMES[a.key] || a.label)); aa.appendChild(el("em", null, r.pct[a.key] + "%"));
      li.appendChild(aa); ul.appendChild(li);
    });
    box.appendChild(el("h3", "sub", "اقرا عن كل واحد"));
    box.appendChild(ul);
    var p = el("p"); p.style.marginTop = "1.2rem";
    var mk = el("button", "btn", "اعمل كارت بصمتك");
    var sh = el("button", "btn ghost", "شارك");
    var ag = el("button", "btn ghost", "اعمل الاختبار تاني");
    sh.onclick = function () {
      var txt = "بصمتي المعرفية في ميزان ⚖️: «" + title + "»\nاعرف بصمتك إنت: " + location.href.split("?")[0];
      if (navigator.share) navigator.share({ text: txt }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { sh.textContent = "اتنسخ ✓"; });
    };
    ag.onclick = play;
    var out = el("div");
    mk.onclick = function () { card(r, title, out, mk); };
    [mk, sh, ag].forEach(function (b) { p.appendChild(b); p.appendChild(document.createTextNode(" ")); });
    box.appendChild(p); box.appendChild(out);
    box.appendChild(el("p", "note", "ده مش اختبار علمي ولا تشخيص. دي مرآة صغيرة تساعدك تاخد بالك من طريقة تفكيرك. نتيجتك محفوظة على جهازك بس."));
  }

  function card(r, title, out, btn) {
    btn.disabled = true;
    Promise.all([document.fonts.load('700 60px "El Messiri"'), document.fonts.load('400 40px Amiri')]).catch(function () {}).then(function () {
      var W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
      var x = cv.getContext("2d"); x.direction = "rtl"; x.textAlign = "center";
      x.fillStyle = C.paper; x.fillRect(0, 0, W, H);
      x.fillStyle = C.leaf; x.strokeStyle = C.gold; x.lineWidth = 3; x.fillRect(40, 40, W - 80, H - 80); x.strokeRect(40, 40, W - 80, H - 80);
      x.lineWidth = 1; x.strokeRect(56, 56, W - 112, H - 112);
      x.fillStyle = C.gold; x.font = '700 40px "El Messiri"'; x.fillText("بصمتي المعرفية", W / 2, 170);
      var fs = 92; x.font = '700 ' + fs + 'px "El Messiri"';
      while (x.measureText(title).width > W - 220 && fs > 50) { fs -= 6; x.font = '700 ' + fs + 'px "El Messiri"'; }
      x.fillStyle = C.ink; x.fillText(title, W / 2, 290);
      var cx = W / 2, cy = 720, R = 290, n = AX.length;
      function pt(k, f) { var a = -Math.PI / 2 + k * 2 * Math.PI / n; return [cx + Math.cos(a) * R * f, cy + Math.sin(a) * R * f]; }
      function path(f) { x.beginPath(); AX.forEach(function (a, k) { var p = pt(k, f(a)); if (k) x.lineTo(p[0], p[1]); else x.moveTo(p[0], p[1]); }); x.closePath(); }
      x.strokeStyle = C.rule; x.lineWidth = 2;
      [1, 2 / 3, 1 / 3].forEach(function (f) { path(function () { return f; }); x.stroke(); });
      AX.forEach(function (a, k) { var p = pt(k, 1); x.beginPath(); x.moveTo(cx, cy); x.lineTo(p[0], p[1]); x.stroke(); });
      path(function (a) { return Math.max(0.04, r.pct[a.key] / 100); });
      x.fillStyle = "rgba(164,126,46,.35)"; x.fill(); x.strokeStyle = C.gold; x.lineWidth = 5; x.stroke();
      x.fillStyle = C.lapis; x.font = '700 36px "El Messiri"';
      AX.forEach(function (a, k) { var p = pt(k, 1.22); x.fillText(a.label, p[0], p[1]); x.fillStyle = C.muted; x.font = '400 32px Amiri'; x.fillText(r.pct[a.key] + "%", p[0], p[1] + 42); x.fillStyle = C.lapis; x.font = '700 36px "El Messiri"'; });
      x.fillStyle = C.ink; x.font = '700 38px "El Messiri"'; x.fillText("ميزان — اعرف بصمتك إنت", W / 2, 1210);
      x.fillStyle = C.gold; x.font = '400 26px Amiri'; x.direction = "ltr"; x.fillText("tahawi0.github.io/mizan/games/profile", W / 2, 1258);
      cv.toBlob(function (blob) {
        var url = URL.createObjectURL(blob); out.innerHTML = "";
        var img = new Image(); img.src = url; img.alt = "كارت بصمتك المعرفية"; img.className = "cert-img"; out.appendChild(img);
        var p = el("p"), a = el("a", "btn", "نزّل الكارت"); a.href = url; a.download = "mizan-profile.png"; p.appendChild(a);
        var file = new File([blob], "mizan-profile.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          var s = el("button", "btn ghost", "شاركه"); s.style.marginInlineStart = "8px";
          s.onclick = function () { navigator.share({ files: [file], text: "بصمتي المعرفية في ميزان ⚖️ " + location.href.split("?")[0] }).catch(function () {}); };
          p.appendChild(s);
        }
        out.appendChild(p); btn.disabled = false;
      }, "image/png");
    });
  }

  var saved = load();
  if (saved && saved.pct) result(saved); else intro();
})();
