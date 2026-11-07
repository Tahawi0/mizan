// هوية ميزان المتحركة: الميزان الحي، والحبر، وردود الفعل، والأصوات (مقفولة افتراضياً).
(function () {
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var html = document.documentElement;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ───── الأصوات: بتتولد بالكود، من غير ملفات ───── */
  var ctx = null, on = ls("mizan-sound") === "1";
  function ac() { if (!ctx) { var A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ctx = new A(); } if (ctx.state === "suspended") ctx.resume(); return ctx; }
  function tone(f, t, d, type, vol, slide) {
    var c = ac(); if (!c) return; var o = c.createOscillator(), g = c.createGain(), s = c.currentTime + (t || 0);
    o.type = type || "sine"; o.frequency.setValueAtTime(f, s); if (slide) o.frequency.exponentialRampToValueAtTime(slide, s + d);
    g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(vol || 0.12, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s + d);
    o.connect(g); g.connect(c.destination); o.start(s); o.stop(s + d + 0.02);
  }
  function noise(d, freq, vol, t) {
    var c = ac(); if (!c) return; var n = Math.floor(c.sampleRate * d), b = c.createBuffer(1, n, c.sampleRate), x = b.getChannelData(0);
    for (var i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), s = c.currentTime + (t || 0);
    src.buffer = b; f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 0.8; g.gain.value = vol || 0.15;
    src.connect(f); f.connect(g); g.connect(c.destination); src.start(s);
  }
  var SFX = {
    right: function () { tone(660, 0, 0.18, "triangle", 0.1); tone(990, 0.09, 0.3, "triangle", 0.09); },
    wrong: function () { tone(220, 0, 0.28, "sine", 0.12, 150); },
    tap: function () { noise(0.04, 2400, 0.08); },
    page: function () { noise(0.22, 1400, 0.1); },
    gavel: function () { tone(140, 0, 0.18, "square", 0.08, 70); noise(0.08, 600, 0.2); },
    win: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.1, 0.35, "triangle", 0.08); }); }
  };
  function play(name) { if (on && SFX[name]) try { SFX[name](); } catch (e) {} }
  window.MizanFX = { play: play, tilt: tilt, confetti: confetti };

  var sb = document.getElementById("snd-btn");
  function paint() { if (!sb) return; sb.hidden = false; sb.classList.toggle("on", on); sb.setAttribute("aria-pressed", on); sb.setAttribute("aria-label", on ? "اقفل الأصوات" : "شغّل الأصوات"); }
  if (sb) { paint(); sb.onclick = function () { on = !on; ls("mizan-sound", on ? "1" : "0"); paint(); if (on) play("right"); }; }

  /* ───── الميزان الحي في الشعار ───── */
  var logo = document.querySelector("header .logo"), tt = null;
  function tilt(dir) {
    if (!logo || reduce) return;
    logo.classList.remove("tilt-r", "tilt-w"); void logo.offsetWidth;
    logo.classList.add(dir === "w" ? "tilt-w" : "tilt-r");
    clearTimeout(tt); tt = setTimeout(function () { logo.classList.remove("tilt-r", "tilt-w"); }, 1600);
  }

  /* ───── قصاصات دهب للحظات الفوز ───── */
  function confetti() {
    if (reduce) return;
    var box = document.createElement("div"); box.className = "confetti"; box.setAttribute("aria-hidden", "true");
    for (var i = 0; i < 36; i++) {
      var p = document.createElement("i");
      p.style.setProperty("--x", (Math.random() * 100) + "vw"); p.style.setProperty("--d", (1.4 + Math.random() * 1.4) + "s");
      p.style.setProperty("--r", (Math.random() * 720 - 360) + "deg"); p.style.setProperty("--delay", (Math.random() * 0.3) + "s");
      if (i % 3 === 0) p.className = "b";
      box.appendChild(p);
    }
    document.body.appendChild(box); setTimeout(function () { box.remove(); }, 3200);
  }

  /* ───── ردود الفعل: أي إجابة صح أو غلط في أي لعبة ───── */
  var last = 0;
  function verdict(el, ok) {
    var now = Date.now(); if (now - last < 120) return; last = now;
    tilt(ok ? "r" : "w"); play(ok ? "right" : "wrong");
    if (!reduce && el) { el.classList.add(ok ? "fx-glow" : "fx-shake"); setTimeout(function () { el.classList.remove("fx-glow", "fx-shake"); }, 700); }
  }
  new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      var t = m.target; if (m.type !== "attributes" || !t.classList) return;
      var had = (m.oldValue || "").split(" ");
      if (t.classList.contains("right") && had.indexOf("right") < 0 && t.tagName === "BUTTON") verdict(t, true);
      else if (t.classList.contains("wrong") && had.indexOf("wrong") < 0 && t.tagName === "BUTTON") verdict(t, false);
      else if (t.classList.contains("valid") && had.indexOf("valid") < 0) verdict(t, true);
      else if (t.classList.contains("open") && had.indexOf("open") < 0 && t.classList.contains("door")) { play("page"); }
    });
    // النتايج الكبيرة (درجة أو وقت)
    ms.forEach(function (m) { m.addedNodes && [].forEach.call(m.addedNodes, function (n) {
      if (n.nodeType !== 1) return;
      var big = n.classList.contains("big-score") ? n : n.querySelector && n.querySelector(".big-score, .prof-title");
      if (big && !big.dataset.fx) { big.dataset.fx = 1; big.classList.add("fx-pop"); play("win"); if (/^(10|9)\b|سفير|1 \/|^0:[0-5]/.test(big.textContent) || big.classList.contains("prof-title")) confetti(); }
    }); });
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"], attributeOldValue: true, childList: true });

  /* ───── صوت خفيف للضغط على الأزرار ───── */
  document.addEventListener("pointerdown", function (e) { if (e.target.closest(".btn, .opts button, .pcard, .slot, .case-tile")) play("tap"); });

  /* ───── الظهور مع النزول في الصفحة ───── */
  if (!reduce && "IntersectionObserver" in window) {
    html.classList.add("rv-ready");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    function scan() { document.querySelectorAll("main .tile, main .doors li, main .index li, main .arena-sec, main .sheet, main .today, main .split, main .orn, main h2").forEach(function (x, i) { if (!x.dataset.rv) { x.dataset.rv = 1; x.style.setProperty("--i", i % 6); io.observe(x); } }); }
    scan(); new MutationObserver(function () { scan(); }).observe(document.querySelector("main") || document.body, { childList: true, subtree: true });
  }

  /* ───── تقليب الصفحة بصوت ───── */
  document.addEventListener("click", function (e) { var a = e.target.closest("a[href]"); if (a && a.origin === location.origin && !a.hasAttribute("download")) play("page"); });
})();
