// على الهوا: إنت مشرف كومنتات في بث مباشر. خبّي الكومنت اللي فيه مغالطة قبل ما يعدّي.
(function () {
  var G = window.MIZAN_GAME || {}, root = document.body.getAttribute("data-root") || "./";
  var NAMES = window.MIZAN_NAMES || {}, S = window.MizanStages;
  var box = document.getElementById("game"), KEY = "mizan-live-stages", MAXV = 6;
  var slow = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }

  function map() {
    S.render(box, { key: KEY, intro: G.intro, bossLabel: "بث الزعيم: أسرع كومنتات",
      items: G.episodes.map(function (e, k) { return { id: "l" + k, title: e.title.replace(/^.*?: /, ""), sub: (e.speed / 1000) + " ثانية للكومنت" }; }), onPlay: ready });
  }

  function ready(k) {
    var E = G.episodes[k];
    box.innerHTML = "";
    box.appendChild(el("p", "kicker", "البث " + (k + 1) + " من " + G.episodes.length));
    box.appendChild(el("h2", null, E.title));
    box.appendChild(el("p", "lead", "دوس على الكومنت اللي فيه مغالطة عشان تخفيه. كل كومنت بيعدّي بعد شوية، ولو عدّى وفيه مغالطة تبقى فاتتك. ولو خبّيت كومنت سليم، بتخسر نص نقطة."));
    var go = el("button", "btn", "🔴 ابدأ البث"); go.onclick = function () { play(k); }; box.appendChild(go);
  }

  function play(k) {
    var E = G.episodes[k], list = E.c, i = 0, hits = 0, falses = 0, missed = [], bad = list.filter(function (c) { return c.f; }).length;
    var speed = slow ? E.speed * 1.8 : E.speed, timer;
    box.innerHTML = "";
    var scr = el("div", "lv-screen");
    var top = el("div", "lv-top"); top.appendChild(el("b", null, "🔴 مباشر")); top.appendChild(el("span", null, E.title.replace(/^.*?: /, "")));
    var sc = el("span", "lv-score", "✓ 0"); top.appendChild(sc);
    scr.appendChild(top);
    var feed = el("ol", "lv-feed"); feed.setAttribute("aria-live", "polite"); scr.appendChild(feed);
    var bar = el("div", "bar"), bi = el("i"); bar.appendChild(bi); scr.appendChild(bar);
    box.appendChild(scr);
    function upd() { sc.textContent = "✓ " + hits + (falses ? "  ✗ " + falses : ""); bi.style.width = (i / list.length * 100) + "%"; }
    function push() {
      if (i >= list.length) { setTimeout(end, speed); return; }
      var c = list[i++], li = el("li", "lv-c");
      var b = el("button"); b.type = "button";
      b.appendChild(el("b", null, c.w)); b.appendChild(el("span", null, c.t));
      b.onclick = function () {
        if (li.classList.contains("hid")) return;
        li.classList.add("hid"); b.disabled = true;
        if (c.f) { hits++; li.classList.add("good"); if (window.MizanFX && MizanFX.play) MizanFX.play("right"); }
        else { falses++; li.classList.add("oops"); if (window.MizanFX && MizanFX.play) MizanFX.play("wrong"); }
        upd();
      };
      li.appendChild(b); li._c = c;
      feed.insertBefore(li, feed.firstChild);
      while (feed.children.length > MAXV) { var old = feed.lastChild; gone(old); feed.removeChild(old); }
      upd();
      timer = setTimeout(push, speed);
    }
    function gone(li) { if (li._c.f && !li.classList.contains("hid")) missed.push(li._c); }
    function end() {
      clearTimeout(timer);
      Array.prototype.slice.call(feed.children).forEach(gone);
      var score = Math.max(0, Math.min(10, Math.round(10 * (hits - falses * 0.5) / bad)));
      S.record(KEY, "l" + k, score);
      if (window.MizanAuth && MizanAuth.score) MizanAuth.score("live", score);
      box.innerHTML = "";
      var w = el("div", "today");
      w.appendChild(el("p", "kicker", "البث خلص"));
      w.appendChild(el("p", "big-score", hits + " / " + bad));
      w.appendChild(el("p", "big-stars", S.stars(S.starsFor(score))));
      w.appendChild(el("p", "lead", "مسكت " + hits + " كومنت فيهم مغالطة" + (falses ? "، وخبّيت " + falses + " كومنت سليم غلط." : ".")));
      box.appendChild(w);
      var all = list.filter(function (c) { return c.f; });
      box.appendChild(el("h2", null, "الكومنتات اللي كان فيها مغالطة"));
      var ul = el("ul", "index lv-review");
      all.forEach(function (c) {
        var li = el("li"); li.appendChild(el("span", missed.indexOf(c) >= 0 ? "lv-miss" : "lv-got", missed.indexOf(c) >= 0 ? "فاتتك" : "مسكتها"));
        li.appendChild(document.createTextNode(" «" + c.t + "» "));
        var a = el("a", null, NAMES[c.f] || c.f); a.href = root + "atlas/" + c.f + "/"; li.appendChild(a);
        ul.appendChild(li);
      });
      box.appendChild(ul);
      var p = el("p"), again = el("button", "btn ghost", "العب البث تاني"); again.onclick = function () { ready(k); }; p.appendChild(again); box.appendChild(p);
      box.appendChild(S.endBar({ k: k, count: G.episodes.length, play: ready, map: map,
        share: "خبّيت " + hits + " من " + bad + " كومنتات فيها مغالطات في بث «على الهوا» على ميزان ⚖️🔴\nتقدر تبقى أسرع؟ " + location.href.split("?")[0] }));
    }
    push();
  }
  map();
})();
