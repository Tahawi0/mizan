// مراجعة اليوم: كروت من أمثلة الأطلس، والمنطق كله في srs-core.js
(function () {
  var R = window.MIZAN_REVIEW, S = window.MizanSRS;
  var root = document.body.getAttribute("data-root") || "./";
  if (!R || !S) return;
  function $(id) { return document.getElementById(id); }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  var day = S.today();
  // ترتيب الكروت الجديدة بيتغير كل يوم، بس بيفضل ثابت طول اليوم
  var seed = day * 2654435761 >>> 0;
  function rnd() { seed = (seed + 0x6D2B79F5) >>> 0; var t = seed; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  var pool = shuffle(Object.keys(R.e).sort());
  var name = function (s) { return R.e[s] ? R.e[s][0] : s; };

  var queue = [], qi = 0, started = false;
  function start(n, fresh) {
    var st = S.parse(get(S.KEY));
    var empty = !Object.keys(st).length;
    queue = S.pick(st, pool, day, n, fresh != null ? fresh : empty ? 3 : 2).slugs;
    qi = 0;
    if (!queue.length) return finish(true);
    $("rv-play").hidden = false; $("rv-done").hidden = true;
    ask();
  }

  function options(slug, card) {
    var wrong = card[2] ? card[2].slice() : [];
    if (!wrong.length) {
      var nc = R.e[slug][2];
      if (nc) wrong.push(nc);
      var same = shuffle(pool.filter(function (k) { return k !== slug && k !== nc && R.e[k][1] === R.e[slug][1]; }));
      while (wrong.length < 3 && same.length) wrong.push(same.pop());
    }
    return shuffle([slug].concat(wrong.slice(0, 3)));
  }

  function ask() {
    var slug = queue[qi], cards = R.c[slug], card = cards[Math.floor(rnd() * cards.length)];
    $("rv-count").textContent = (qi + 1) + " من " + queue.length;
    $("rv-where").hidden = !card[0]; $("rv-where").textContent = card[0];
    $("rv-scene").textContent = card[1];
    $("rv-reveal").classList.remove("show");
    var box = $("rv-opts"); box.innerHTML = "";
    options(slug, card).forEach(function (o) {
      var b = el("button", null, name(o)); b.type = "button";
      b.onclick = function () { answer(slug, o, b); };
      box.appendChild(b);
    });
  }

  function answer(slug, chosen, btn) {
    if (!started) { started = true; window.MizanTrack && MizanTrack("review", "start"); }
    var ok = chosen === slug;
    $("rv-opts").querySelectorAll("button").forEach(function (b) { b.disabled = true; if (b.textContent === name(slug)) b.classList.add("right"); });
    if (!ok) btn.classList.add("wrong");
    S.record(localStorage, slug, ok, ok ? null : chosen, day);
    var c = S.parse(get(S.KEY))[slug], gap = c ? c.due - day : 1;
    $("rv-verdict").textContent = ok ? "صح عليك." : "دي كانت: " + name(slug);
    $("rv-when").textContent = "هترجعلك " + S.days(gap) + ".";
    $("rv-more").href = root + "atlas/" + slug + "/";
    $("rv-next").textContent = qi === queue.length - 1 ? "خلّصت" : "اللي بعده";
    $("rv-reveal").classList.add("show");
    $("rv-next").focus();
  }

  $("rv-next").onclick = function () { qi++; if (qi < queue.length) ask(); else finish(false); };
  $("rv-more-new").onclick = function () { start(3, 3); };

  function finish(nothing) {
    if (!nothing && window.MizanTrack) MizanTrack("review", "done");
    $("rv-play").hidden = true; $("rv-done").hidden = false;
    var st = S.parse(get(S.KEY)), next = Infinity;
    for (var k in st) if (st[k].due > day) next = Math.min(next, st[k].due);
    $("rv-done-h").textContent = nothing ? "مفيش مراجعة النهارده" : "خلّصت مراجعة النهارده";
    $("rv-done-p").textContent = next < Infinity ? "الكروت الجاية هتبدأ ترجعلك " + S.days(next - day) + "." : "جرّب كام كارت جديد.";
    var fresh = pool.filter(function (k) { return !st[k]; }).length;
    $("rv-more-new").hidden = !fresh;
    weak();
  }

  function weak() {
    var w = S.weak(S.parse(get(S.KEY)), S.parseMix(get(S.MIX))), box = $("rv-weak");
    box.innerHTML = "";
    if (!w.spots.length && !w.pairs.length) {
      box.appendChild(el("p", "lead", w.seen < 10 ? "لسه بدري. بعد ما تجاوب على كام كارت هنا وفي مغالطة اليوم، هتظهر هنا المغالطات اللي بتغلط فيها." : "مفيش مغالطة بتغلط فيها أكتر من التانية دلوقتي. كمّل كده."));
      return;
    }
    if (w.spots.length) {
      var ul = el("ul", "index");
      w.spots.forEach(function (s) {
        var li = el("li"), a = el("a", null, name(s.slug)); a.href = root + "atlas/" + s.slug + "/";
        li.appendChild(a); li.appendChild(document.createTextNode(" — صح " + s.r + " من " + s.seen));
        ul.appendChild(li);
      });
      box.appendChild(ul);
    }
    if (w.pairs.length) {
      box.appendChild(el("h3", null, "بتخلط بين"));
      var ul2 = el("ul", "index");
      w.pairs.forEach(function (p) { ul2.appendChild(el("li", null, name(p.right) + " و" + name(p.chosen) + " (" + p.n + (p.n <= 10 ? " مرات" : " مرة") + ")")); });
      box.appendChild(ul2);
    }
  }

  start(5);
  weak();
})();
