// دوري ميزان: ترتيب أسبوعي بلقب يختاره اللاعب.
(function () {
  var G = window.MIZAN_GAME || {}, root = document.body.getAttribute("data-root") || "./";
  var box = document.getElementById("game"), API = window.MIZAN_API;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function signedFlag() { try { return localStorage.getItem("mizan-signed-in") === "1"; } catch (e) { return false; } }
  function token() {
    if (!signedFlag() || !window.MizanAuth) return Promise.resolve(null);
    return MizanAuth.ready().then(function () { return MizanAuth.token(); }).catch(function () { return null; });
  }
  function call(method, path, body) {
    return token().then(function (t) {
      var h = { "Content-Type": "application/json" }; if (t) h.Authorization = "Bearer " + t;
      return fetch(API + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined }).then(function (r) { return r.json().then(function (j) { j._status = r.status; return j; }); });
    });
  }
  var MEDAL = ["١", "٢", "٣"];

  function render(d) {
    box.innerHTML = "";
    var me = d.me, myNick = me && me.member ? me.nick : null;
    // صندوقي
    var mine = el("div", "today league-me");
    if (!me) {
      mine.appendChild(el("h2", null, "اشترك في الدوري"));
      mine.appendChild(el("p", null, "الدوري لأصحاب الحسابات بس، عشان النقط تتحسب صح. سجّل دخول بجوجل أو بالإيميل، واختار لقب."));
      var a = el("a", "btn", "سجّل دخول"); a.href = root + "account/"; mine.appendChild(a);
    } else if (!me.member) {
      mine.appendChild(el("h2", null, "اختار لقبك"));
      mine.appendChild(el("p", null, "اللقب هو اللي هيظهر في الترتيب. اسمك الحقيقي وإيميلك عمرهم ما هيظهروا لحد."));
      mine.appendChild(nickForm("اشترك في الدوري"));
    } else {
      mine.appendChild(el("p", "kicker", "لقبك في الدوري"));
      mine.appendChild(el("h2", "prof-title", me.nick));
      var s = el("div", "mstats");
      [[me.pts, "نقطة الأسبوع ده"], [me.rank, "ترتيبك"]].forEach(function (x) { var dv = el("div", "mstat"); dv.appendChild(el("b", null, String(x[0]))); dv.appendChild(el("span", null, x[1])); s.appendChild(dv); });
      mine.appendChild(s);
      var played = {}; (me.today || []).forEach(function (r) { played[r.game] = r.pts; });
      var ul = el("ul", "league-today");
      G.games.forEach(function (g) {
        var li = el("li", played[g.id] != null ? "done" : ""), a2 = el("a", null, g.name); a2.href = root + g.url;
        li.appendChild(a2); li.appendChild(el("span", null, played[g.id] != null ? played[g.id] + " / 10 النهارده" : "لسه"));
        ul.appendChild(li);
      });
      mine.appendChild(el("h3", "sub", "ألعاب النهارده"));
      mine.appendChild(ul);
      var tools = el("p", "league-tools"), ch = el("button", "btn ghost", "غيّر لقبك"), lv = el("button", "btn ghost", "اخرج من الدوري");
      ch.onclick = function () { ch.replaceWith(nickForm("احفظ اللقب الجديد", me.nick)); };
      lv.onclick = function () {
        if (lv.dataset.sure !== "1") { lv.dataset.sure = "1"; lv.textContent = "متأكد؟ نقطك هتتمسح. دوس تاني"; return; }
        lv.disabled = true; call("DELETE", "/league/join").then(refresh);
      };
      tools.appendChild(ch); tools.appendChild(document.createTextNode(" ")); tools.appendChild(lv); mine.appendChild(tools);
    }
    box.appendChild(mine);

    // الترتيب
    box.appendChild(el("h2", null, "ترتيب الأسبوع"));
    box.appendChild(el("p", "lead", "الأسبوع بيبدأ السبت وبيقفل الجمعة 12 بالليل بتوقيت القاهرة. " + d.members + " مشترك لحد دلوقتي."));
    if (!d.top.length) box.appendChild(el("p", "note", "لسه محدش جاب نقط الأسبوع ده. العب أي لعبة من اللي تحت، واطلع الأول."));
    else {
      var ol = el("ol", "board");
      d.top.forEach(function (r, i) {
        var li = el("li", (i < 3 ? "top top" + (i + 1) : "") + (r.nick === myNick ? " mine" : ""));
        li.appendChild(el("span", "pos", i < 3 ? MEDAL[i] : String(i + 1)));
        li.appendChild(el("b", null, r.nick)); li.appendChild(el("span", "pts", r.pts + " نقطة"));
        ol.appendChild(li);
      });
      box.appendChild(ol);
    }
    if (d.last && d.last.length) {
      box.appendChild(el("h2", null, "أبطال الأسبوع اللي فات"));
      var p = el("div", "champs");
      d.last.forEach(function (r, i) { var c = el("div", "champ c" + (i + 1)); c.appendChild(el("span", null, MEDAL[i])); c.appendChild(el("b", null, r.nick)); c.appendChild(el("small", null, r.pts + " نقطة")); p.appendChild(c); });
      box.appendChild(p);
    }
    // القواعد
    box.appendChild(el("h2", null, "إزاي تجمع نقط؟"));
    var rl = el("ul", "index");
    G.games.forEach(function (g) { var li = el("li"), a3 = el("a"); a3.href = root + g.url; a3.appendChild(el("b", null, g.name)); a3.appendChild(el("em", null, "لحد 10 نقط")); a3.appendChild(el("span", null, g.rule)); li.appendChild(a3); rl.appendChild(li); });
    box.appendChild(rl);
    box.appendChild(el("p", "note", "كل لعبة بتتحسب مرة واحدة في اليوم، وبناخد أحسن نتيجة ليك فيها. يعني أقصى حاجة 60 نقطة في اليوم. الدوري للمتعة، والهدف إنك تلعب كل يوم وتتعلم حاجة."));
  }

  function nickForm(label, val) {
    var f = el("form", "num-form nick-form"), inp = el("input"); inp.type = "text"; inp.maxLength = 20; inp.placeholder = "لقبك"; inp.required = true; inp.value = val || ""; inp.setAttribute("aria-label", "لقبك في الدوري");
    var b = el("button", "btn", label); b.type = "submit";
    var msg = el("p", "esc-msg bad");
    f.appendChild(inp); f.appendChild(b);
    var w = el("div"); w.appendChild(f); w.appendChild(msg);
    f.onsubmit = function (e) {
      e.preventDefault(); b.disabled = true; msg.textContent = "";
      call("POST", "/league/join", { nick: inp.value }).then(function (j) {
        if (j.ok) refresh(); else { msg.textContent = j.error || "حصلت مشكلة، جرّب تاني."; b.disabled = false; }
      }).catch(function () { msg.textContent = "حصلت مشكلة في الاتصال."; b.disabled = false; });
    };
    return w;
  }

  function refresh() {
    call("GET", "/league").then(render).catch(function () { box.innerHTML = ""; box.appendChild(el("p", "lead", "مش قادرين نجيب الترتيب دلوقتي. جرب بعد شوية.")); });
  }
  box.appendChild(el("p", "lead", "بنجيب الترتيب…"));
  refresh();
})();
