// ألعاب ميزان: المعمل، اكشف الحيلة، أنهي فيلسوف، ميزان الثقة، صلّح الحجة.
(function () {
  var G = window.MIZAN_GAME || {}, root = document.body.getAttribute("data-root") || "./";
  var NAMES = window.MIZAN_NAMES || {};
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, txt) { var x = document.createElement(tag); if (cls) x.className = cls; if (txt != null) x.textContent = txt; return x; }
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function link(slug) { var a = el("a", null, NAMES[slug] || slug); a.href = root + "atlas/" + slug + "/"; return a; }
  function shareBtn(getText) {
    var b = el("button", "btn ghost", "شارك");
    b.onclick = function () {
      var t = getText();
      if (navigator.share) navigator.share({ text: t }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { b.textContent = "اتنسخ ✓"; });
    };
    return b;
  }
  function bar(label, pct, mine, txt) {
    var w = el("div", "res" + (mine ? " mine" : ""));
    var top = el("div", "res-top"); top.appendChild(el("span", null, label + (mine ? " (مجموعتك)" : ""))); top.appendChild(el("b", null, txt));
    var t = el("div", "bar"), i = el("i"); i.style.width = Math.max(2, Math.min(100, pct)) + "%"; t.appendChild(i);
    w.appendChild(top); w.appendChild(t); return w;
  }

  /* ───── المعمل ───── */
  function lab(box) {
    var API = window.MIZAN_API;
    G.lab.forEach(function (x) {
      var card = el("section", "sheet lab"); card.id = "exp-" + x.id;
      card.appendChild(el("h2", null, x.title));
      var body = el("div"); card.appendChild(body); box.appendChild(card);
      var key = "mizan-lab-" + x.id, st = load(key, null);
      var g = st ? st.g : Math.floor(Math.random() * x.groups.length);
      var grp = x.groups[g];
      if (st && st.done) return results(x, body, st);
      body.appendChild(el("p", "lead", x.intro));
      function main() {
        body.innerHTML = "";
        body.appendChild(el("p", "scene", grp.q));
        if (grp.num) {
          var f = el("form", "num-form"), inp = el("input"); inp.type = "number"; inp.min = 0; inp.max = 300; inp.required = true; inp.inputMode = "numeric"; inp.placeholder = "رقم";
          var b = el("button", "btn", "ثبّت إجابتك"); b.type = "submit"; f.appendChild(inp); f.appendChild(b); body.appendChild(f); inp.focus();
          f.onsubmit = function (e) { e.preventDefault(); var v = parseInt(inp.value, 10); if (isNaN(v) || v < 0 || v > 300) return; finish(v, v); };
        } else {
          var o = el("div", "opts");
          grp.opts.forEach(function (t, k) { var b = el("button", null, t); b.onclick = function () { finish(grp.map[k], t); }; o.appendChild(b); });
          body.appendChild(o);
        }
      }
      if (grp.pre) {
        body.appendChild(el("p", "scene", grp.pre));
        var o = el("div", "opts");
        grp.preOpts.forEach(function (t) { var b = el("button", null, t); b.onclick = main; o.appendChild(b); });
        body.appendChild(o);
      } else main();
      function finish(v, label) {
        st = { g: g, v: v, label: String(label), done: true }; save(key, st);
        body.innerHTML = ""; body.appendChild(el("p", "lead", "بنجيب نتايج الناس…"));
        fetch(API + "/lab", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exp: x.id, group: g, value: v }) })
          .catch(function () {}).then(function () { results(x, body, st); });
      }
    });
    function results(x, body, st) {
      body.innerHTML = "";
      body.appendChild(el("p", "kicker", "إجابتك: " + st.label));
      var area = el("div"); body.appendChild(area); area.appendChild(el("p", "lead", "بنجيب نتايج الناس…"));
      var rev = el("div", "note"); rev.textContent = x.reveal; body.appendChild(rev);
      if (x.entry) { var p = el("p"); p.appendChild(document.createTextNode("اقرا أكتر: ")); p.appendChild(link(x.entry)); body.appendChild(p); }
      fetch(window.MIZAN_API + "/lab?exp=" + x.id).then(function (r) { return r.json(); }).then(function (d) {
        area.innerHTML = "";
        var total = 0, rows = [];
        x.groupNames.forEach(function (name, k) {
          var s = d[k] || { n: 0, sum: 0, c: [0, 0, 0] }; total += s.n;
          if (x.groups[0].num) { var m = s.n ? Math.round(s.sum / s.n) : 0; rows.push(bar(name, m / 1.2, k === st.g, s.n ? "متوسط " + m + " (" + s.n + " واحد)" : "لسه محدش")); }
          else { var pc = s.n ? Math.round(100 * (s.c[x.metric] || 0) / s.n) : 0; rows.push(bar(name, pc, k === st.g, s.n ? pc + "% " + x.metricLabel + " (" + s.n + ")" : "لسه محدش")); }
        });
        area.appendChild(el("h3", null, "الناس جاوبت إزاي؟"));
        rows.forEach(function (r) { area.appendChild(r); });
        if (total < 20) area.appendChild(el("p", "lead small", "النتايج لسه قليلة، وهتبقى أوضح كل ما الناس تجرب أكتر."));
      }).catch(function () { area.innerHTML = ""; area.appendChild(el("p", "lead", "مش قادرين نجيب النتايج دلوقتي. جرب بعد شوية.")); });
    }
  }

  /* ───── اكشف الحيلة ───── */
  function spot(box) {
    var S = window.MizanStages, SKEY = "mizan-spot-stages", i = 0;
    function map() {
      S.render(box, { key: SKEY, bossLabel: "إعلان الزعيم: 6 حيل",
        intro: "10 إعلانات لماركات خيالية، كل واحد حيله مستخبية أكتر من اللي قبله. دوس على كل جملة فيها حيلة. لو لقيتهم كلهم من غير غلط تاخد 3 نجوم.",
        items: G.spot.map(function (ad, k) { return { id: "s" + k, title: ad.brand, sub: ad.lines.filter(function (l) { return l.e; }).length + " حيل" }; }),
        onPlay: function (k) { i = k; show(); } });
    }
    function show() {
      box.innerHTML = "";
      var ad = G.spot[i], picked = {};
      box.appendChild(el("p", "kicker", "إعلان " + (i + 1) + " من " + G.spot.length));
      var card = el("div", "ad"); card.appendChild(el("h2", null, ad.brand));
      var para = el("p", "ad-text");
      ad.lines.forEach(function (l, k) {
        var s = el("span", "line", l.t); s.tabIndex = 0; s.setAttribute("role", "button");
        s.onclick = s.onkeydown = function (e) { if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return; if (e.preventDefault) e.preventDefault(); if (card.classList.contains("done")) return; picked[k] = !picked[k]; s.classList.toggle("picked", !!picked[k]); };
        para.appendChild(s); para.appendChild(document.createTextNode(" "));
      });
      card.appendChild(para); box.appendChild(card);
      var n = ad.lines.filter(function (l) { return l.e; }).length;
      box.appendChild(el("p", "lead small", "في الإعلان ده " + n + " حيل. دوس على كل جملة فيها حيلة."));
      var go = el("button", "btn", "خلصت، وريني"); box.appendChild(go);
      go.onclick = function () {
        card.classList.add("done"); go.remove();
        var spans = para.querySelectorAll(".line"), found = 0, wrong = 0, out = el("div", "spot-out");
        ad.lines.forEach(function (l, k) {
          var s = spans[k];
          if (l.e && picked[k]) { s.classList.add("ok"); found++; }
          else if (l.e) s.classList.add("miss");
          else if (picked[k]) { s.classList.add("bad"); wrong++; }
          if (l.e) { var d = el("div", "ex"), sm = el("small"); sm.appendChild(link(l.e)); d.appendChild(sm); d.appendChild(el("div", null, "«" + l.t + "» " + l.why)); out.appendChild(d); }
        });
        var score = Math.max(0, Math.round(10 * found / n) - wrong * 2);
        S.record(SKEY, "s" + i, score);
        var h = el("h2", null, "لقيت " + found + " من " + n + (wrong ? "، وعلّمت " + wrong + " جملة سليمة" : ""));
        box.appendChild(h); box.appendChild(el("p", "lead small", "الأخضر لقيته، والأصفر فاتك، والأحمر جملة سليمة.")); box.appendChild(out);
        var nx = el("div", "court-end"); nx.appendChild(el("p", "big-stars", S.stars(S.starsFor(score))));
        nx.appendChild(S.endBar({ k: i, count: G.spot.length, map: map, play: function (k) { i = k; show(); },
          share: "لقيت " + found + " من " + n + " حيل في إعلان «" + ad.brand + "» على ميزان ⚖️\nجرّب إنت: " + location.href.split("?")[0] }));
        box.appendChild(nx);
        h.scrollIntoView({ behavior: "smooth", block: "start" });
      };
    }
    map();
  }

  /* ───── أنهي فيلسوف إنت؟ ───── */
  function phil(box) {
    var P = G.phil, i = 0, score = {};
    var order = shuffle(P.qs);
    function q() {
      box.innerHTML = "";
      box.appendChild(el("p", "kicker", "سؤال " + (i + 1) + " من " + order.length));
      var b = el("div", "bar"), bi = el("i"); bi.style.width = (i / order.length * 100) + "%"; b.appendChild(bi); box.appendChild(b);
      box.appendChild(el("p", "scene", order[i].q));
      var o = el("div", "opts");
      shuffle(order[i].a).forEach(function (a) { var bt = el("button", null, a[0]); bt.onclick = function () { score[a[1]] = (score[a[1]] || 0) + 1; i++; i < order.length ? q() : res(); }; o.appendChild(bt); });
      box.appendChild(o);
    }
    function res() {
      var best = Object.keys(score).sort(function (a, b) { return score[b] - score[a]; })[0], info = G.philNames[best];
      box.innerHTML = "";
      var w = el("div", "center"); w.appendChild(el("p", "kicker", "إنت أقرب لـ"));
      w.appendChild(el("p", "big", info.name)); w.appendChild(el("p", "scene", P.results[best])); box.appendChild(w);
      var p = el("p", "center"); var a = el("a", "btn", "اقرا عن " + info.name); a.href = root + "philosophy/" + best + "/"; p.appendChild(a); p.appendChild(document.createTextNode(" "));
      p.appendChild(shareBtn(function () { return "ميزان — أنهي فيلسوف إنت؟\nطلعت أقرب لـ" + info.name + " 🏛️\nاعرف إنت: " + location.href; })); box.appendChild(p);
      var rev = el("div", "today");
      rev.appendChild(el("h2", null, "اعتراف صغير"));
      rev.appendChild(el("p", null, "اقرا الوصف بتاعك تاني. هتلاقيه ممكن ينطبق على أي حد تقريباً. إحنا كاتبينه كده بالقصد."));
      rev.appendChild(el("p", null, "ده اسمه «تأثير بارنوم». سنة 1949، عالم النفس برترام فورر إدّى طلابه «تحليل شخصية» قال إنه معمول مخصوص لكل واحد. الحقيقة إن كلهم خدوا نفس الورقة بالظبط، وقيّموا دقتها في المتوسط 4.26 من 5."));
      rev.appendChild(el("p", null, "نفس الحيلة دي ورا الأبراج وكتير من اختبارات الشخصية على النت. اللعبة دي للتسلية، مش تحليل علمي."));
      box.appendChild(rev);
      var r = el("button", "btn ghost", "العب تاني"); r.onclick = function () { i = 0; score = {}; order = shuffle(P.qs); q(); }; box.appendChild(r);
    }
    q();
  }

  /* ───── ميزان الثقة ───── */
  function calib(box) {
    var S = window.MizanStages, KEY = "mizan-calib-stages", st, i, ans;
    function map() {
      S.render(box, { key: KEY, bossLabel: "الزعيم: أرقام وخرافات",
        intro: "10 مراحل، كل مرحلة 5 جمل. قول صح ولا غلط، وبعدين متأكد بنسبة قد إيه. النجوم مش بتيجي من الإجابة الصح بس: بتيجي لما ثقتك تبقى قد معلوماتك.",
        items: G.calib.map(function (x, k) { return { id: "c" + k, title: x.title, sub: "5 جمل" }; }),
        onPlay: function (k) { st = k; i = 0; ans = []; q(); } });
    }
    function q() {
      box.innerHTML = "";
      var qs = G.calib[st].items, c = qs[i], pick = null;
      box.appendChild(el("p", "kicker", G.calib[st].title + " · جملة " + (i + 1) + " من " + qs.length));
      var b = el("div", "bar"), bi = el("i"); bi.style.width = (i / qs.length * 100) + "%"; b.appendChild(bi); box.appendChild(b);
      box.appendChild(el("p", "scene", c.s));
      var o = el("div", "tf"), conf = el("div", "conf"); conf.hidden = true;
      [["صح", true], ["غلط", false]].forEach(function (x) { var bt = el("button", "btn ghost", x[0]); bt.onclick = function () { pick = x[1]; o.querySelectorAll("button").forEach(function (y) { y.classList.remove("on"); }); bt.classList.add("on"); conf.hidden = false; }; o.appendChild(bt); });
      box.appendChild(o);
      conf.appendChild(el("p", "lead small", "متأكد بنسبة قد إيه؟"));
      var row = el("div", "conf-row");
      [50, 60, 70, 80, 90, 100].forEach(function (p) { var bt = el("button", null, p + "%"); bt.onclick = function () { ans.push({ c: c, pick: pick, p: p, ok: pick === c.a }); i++; i < qs.length ? q() : end(); }; row.appendChild(bt); });
      conf.appendChild(row); conf.appendChild(el("p", "lead small", "50% يعني «بخمّن»، و100% يعني «متأكد جداً».")); box.appendChild(conf);
    }
    function end() {
      var n = ans.length, right = ans.filter(function (a) { return a.ok; }).length, acc = Math.round(right / n * 100);
      var avg = Math.round(ans.reduce(function (s, a) { return s + a.p; }, 0) / n), gap = avg - acc;
      // درجة المعايرة (Brier): الثقة العالية في إجابة غلط بتخصم كتير
      var brier = ans.reduce(function (s, a) { var pr = a.ok ? a.p / 100 : 1 - a.p / 100; return s + (1 - pr) * (1 - pr); }, 0) / n;
      var score = Math.max(0, Math.min(10, Math.round(10 * (1 - 2 * brier))));
      S.record(KEY, "c" + st, score);
      var verdict = gap > 10 ? "ثقتك أعلى من معلوماتك" : gap < -10 ? "إنت بتعرف أكتر ما إنت فاكر" : "ميزانك مظبوط";
      var tip = gap > 10 ? "ده طبيعي جداً، وأغلب الناس كده. ده اسمه «الثقة الزايدة». الحل إنك تقول «مش متأكد» أكتر." : gap < -10 ? "إنت جاوبت صح أكتر من ثقتك. متخافش تقول رأيك." : "ثقتك قريبة من دقتك. ده بالظبط معنى إن ميزانك مظبوط.";
      box.innerHTML = "";
      var w = el("div", "center court-end"); w.appendChild(el("p", "kicker", G.calib[st].title));
      var pair = el("div", "stats");
      [["إجابات صح", acc + "%"], ["متوسط ثقتك", avg + "%"]].forEach(function (x) { var d = el("div"); d.appendChild(el("b", null, x[1])); d.appendChild(document.createTextNode(x[0])); pair.appendChild(d); });
      w.appendChild(pair); w.appendChild(el("p", "big-stars", S.stars(S.starsFor(score)))); w.appendChild(el("h2", null, verdict)); w.appendChild(el("p", "lead", tip));
      w.appendChild(S.endBar({ k: st, count: G.calib.length, map: map, play: function (k) { st = k; i = 0; ans = []; q(); },
        share: "ميزان الثقة ⚖️ مرحلة «" + G.calib[st].title + "»: جاوبت صح " + acc + "% وكنت واثق " + avg + "%.\n" + verdict + ". جرّب إنت: " + location.href.split("?")[0] }));
      box.appendChild(w);
      var p = el("p", "center"); var a = el("a", "btn ghost", "اقرا عن الثقة الزايدة"); a.href = root + "atlas/overconfidence/"; p.appendChild(a); box.appendChild(p);
      box.appendChild(el("h2", null, "الإجابات"));
      ans.forEach(function (x) { var d = el("div", "ex"); d.appendChild(el("small", null, (x.ok ? "✅ " : "❌ ") + (x.c.a ? "صح" : "غلط") + " · ثقتك " + x.p + "%")); d.appendChild(el("div", null, x.c.s + " " + x.c.n)); box.appendChild(d); });
    }
    map();
  }

  /* ───── صلّح الحجة ───── */
  function fix(box) {
    var S = window.MizanStages, KEY = "mizan-fix-stages", st, qs, i, score;
    function map() {
      S.render(box, { key: KEY, bossLabel: "الزعيم: 3 حجج",
        intro: "10 مراحل. كل جملة فيها غلط، واختار الصياغة اللي بتقول نفس الفكرة من غير الغلط. خلي بالك: الصياغات الغلط فيها مغالطات تانية مستخبية.",
        items: G.fix.map(function (x, k) { return { id: "x" + k, title: x.title, sub: x.items.length + " جمل" }; }),
        onPlay: play });
    }
    function play(k) { st = k; qs = shuffle(G.fix[k].items); i = 0; score = 0; q(); }
    function q() {
      box.innerHTML = "";
      var c = qs[i];
      box.appendChild(el("p", "kicker", G.fix[st].title + " · جملة " + (i + 1) + " من " + qs.length));
      var b = el("div", "bar"), bi = el("i"); bi.style.width = (i / qs.length * 100) + "%"; b.appendChild(bi); box.appendChild(b);
      box.appendChild(el("p", "claim", c.bad));
      var hint = el("p", "lead small"); hint.appendChild(document.createTextNode("الجملة دي فيها: ")); hint.appendChild(link(c.e)); hint.appendChild(document.createTextNode(". أنهي صياغة هي الأحسن؟")); box.appendChild(hint);
      var opts = shuffle([[c.good, null]].concat(c.wrong)), o = el("div", "opts");
      opts.forEach(function (x) {
        var bt = el("button", null, x[0]);
        bt.onclick = function () {
          o.querySelectorAll("button").forEach(function (y, k) { y.disabled = true; if (opts[k][1] === null) y.classList.add("right"); });
          var why = el("div", "note");
          if (x[1] === null) { score++; why.appendChild(document.createTextNode("صح! " + c.why)); }
          else { bt.classList.add("wrong"); why.appendChild(document.createTextNode("الصياغة دي لسه فيها: ")); why.appendChild(link(x[1])); why.appendChild(document.createTextNode(". " + c.why)); }
          box.appendChild(why);
          var nx = el("button", "btn", i < qs.length - 1 ? "اللي بعدها" : "النتيجة"); nx.onclick = function () { i++; i < qs.length ? q() : end(); }; box.appendChild(nx);
        };
        o.appendChild(bt);
      });
      box.appendChild(o);
    }
    function end() {
      var sc = Math.round(10 * score / qs.length);
      S.record(KEY, "x" + st, sc);
      box.innerHTML = "";
      var w = el("div", "center court-end"); w.appendChild(el("p", "kicker", G.fix[st].title));
      var big = el("p", "big"); big.textContent = score; big.appendChild(el("small", null, " من " + qs.length)); w.appendChild(big);
      w.appendChild(el("p", "big-stars", S.stars(S.starsFor(sc))));
      w.appendChild(el("h2", null, score === qs.length ? "إنت مش بس بتكشف الغلط، إنت بتصلّحه." : "تصليح الحجة أصعب من كشفها. جرّب المرحلة تاني."));
      w.appendChild(S.endBar({ k: st, count: G.fix.length, map: map, play: play,
        share: "صلّحت " + score + " من " + qs.length + " حجج في «صلّح الحجة» على ميزان ✍️⚖️\nجرّب إنت: " + location.href.split("?")[0] }));
      box.appendChild(w);
    }
    map();
  }

  var box = $("game");
  if (!box) return;
  ({ lab: lab, spot: spot, phil: phil, calib: calib, fix: fix })[box.getAttribute("data-game")](box);
})();
