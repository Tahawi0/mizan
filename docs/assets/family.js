// جروب العيلة: ترد إزاي على الكلام الغلط من غير ما تخسر حد؟
(function () {
  var G = window.MIZAN_GAME || {}, root = document.body.getAttribute("data-root") || "./";
  var NAMES = window.MIZAN_NAMES || {};
  var box = document.getElementById("game"), KEY = "mizan-family";
  var KIND = { attack: "رد هجومي", quiet: "سكوت", smart: "رد هادي وذكي" };
  var fast = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function clamp(v) { return Math.max(0, Math.min(10, v)); }

  function start() {
    box.innerHTML = "";
    var warm = 5, conv = 0, r = 0;
    var phone = el("div", "chat");
    var top = el("div", "chat-top"); top.appendChild(el("b", null, G.group));
    top.appendChild(el("span", null, Object.keys(G.people).map(function (k) { return G.people[k]; }).join("، ") + "، وإنت"));
    phone.appendChild(top);
    var meters = el("div", "meters");
    var mw = meter("الود"), mc = meter("الإقناع"); meters.appendChild(mw.w); meters.appendChild(mc.w);
    var feed = el("div", "chat-feed"); phone.appendChild(feed);
    var act = el("div", "chat-act");
    box.appendChild(meters); box.appendChild(phone); box.appendChild(act);
    function meter(name) { var w = el("div", "meter"), l = el("span", null, name), b = el("div", "bar"), i = el("i"); b.appendChild(i); w.appendChild(l); w.appendChild(b); return { w: w, i: i }; }
    function upd() { mw.i.style.width = clamp(warm) * 10 + "%"; mc.i.style.width = clamp(conv) * 10 + "%"; }
    upd();
    function bubble(who, text, mine) {
      var b = el("div", "msg" + (mine ? " me" : ""));
      if (!mine) b.appendChild(el("small", null, G.people[who]));
      b.appendChild(el("p", null, text)); feed.appendChild(b); feed.scrollTop = feed.scrollHeight;
    }
    function say(list, then) {
      var k = 0;
      (function next() {
        if (k >= list.length) return then();
        var m = list[k++], typing = el("div", "typing", G.people[m.who] + " بيكتب…"); feed.appendChild(typing); feed.scrollTop = feed.scrollHeight;
        setTimeout(function () { typing.remove(); bubble(m.who, m.text); next(); }, fast ? 150 : 900);
      })();
    }
    function round() {
      act.innerHTML = "";
      if (r >= G.rounds.length) return end();
      var R = G.rounds[r];
      say(R.msgs, function () {
        act.appendChild(el("p", "kicker", "هترد تقول إيه؟"));
        var o = el("div", "opts");
        shuffle(R.replies).forEach(function (rep) {
          var b = el("button", null, rep.text);
          b.onclick = function () {
            act.innerHTML = ""; bubble(null, rep.text, true);
            warm += rep.warm; conv += rep.conv; upd();
            say(rep.back, function () {
              var fb = el("div", "chat-fb " + rep.kind);
              fb.appendChild(el("b", null, KIND[rep.kind]));
              var p = el("p", null, R.lesson + " "); var a = el("a", null, "اقرا عن «" + (NAMES[R.f] || R.f) + "»"); a.href = root + "atlas/" + R.f + "/"; p.appendChild(a);
              fb.appendChild(p); act.appendChild(fb);
              var go = el("button", "btn", r === G.rounds.length - 1 ? "شوف النتيجة" : "الرسالة اللي بعدها");
              go.onclick = function () { r++; round(); }; act.appendChild(go); go.focus();
            });
          };
          o.appendChild(b);
        });
        act.appendChild(o);
      });
    }
    function end() {
      var W = clamp(warm), C = clamp(conv), rank = G.ranks[G.ranks.length - 1];
      for (var i = 0; i < G.ranks.length; i++) if (W >= G.ranks[i].warm && C >= G.ranks[i].conv) { rank = G.ranks[i]; break; }
      try { localStorage.setItem(KEY, JSON.stringify({ warm: W, conv: C, title: rank.title })); } catch (e) {}
      var s = el("div", "today");
      s.appendChild(el("p", "kicker", "نتيجتك في الجروب"));
      s.appendChild(el("h2", "prof-title", rank.title));
      s.appendChild(el("p", "stats-line", "الود " + W + " من 10 · الإقناع " + C + " من 10"));
      s.appendChild(el("p", null, rank.desc));
      s.appendChild(el("p", "note", "القاعدة الذهبية: ابدأ باللي متفقين عليه، واسأل بدل ما تتهم، وخلي هدفك إن الحقيقة توصل مش إنك تكسب."));
      var p = el("p"), again = el("button", "btn", "العب تاني"), sh = el("button", "btn ghost", "شارك");
      again.onclick = start;
      sh.onclick = function () {
        var t = "لعبت «جروب العيلة» في ميزان ⚖️ وطلعت «" + rank.title + "».\nإنت هترد إزاي على خالك؟ " + location.href.split("?")[0];
        if (navigator.share) navigator.share({ text: t }).catch(function () {});
        else if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { sh.textContent = "اتنسخ ✓"; });
      };
      p.appendChild(again); p.appendChild(document.createTextNode(" ")); p.appendChild(sh); s.appendChild(p);
      act.appendChild(s);
    }
    round();
  }

  box.appendChild(el("p", "scene", "جروب العيلة اتفتح، والرسايل بدأت تنزل. هدفك: الكلام الغلط ميعدّيش، والعيلة متزعلش."));
  box.appendChild(el("p", "lead", "قدامك عدّادين: الود والإقناع. كل رد بيأثر على الاتنين."));
  var b = el("button", "btn", "افتح الجروب"); b.onclick = start; box.appendChild(b);
})();
