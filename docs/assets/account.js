// حسابات ميزان: تسجيل دخول بجوجل أو برابط على الإيميل، ومزامنة التقدم.
// Firebase بيتحمّل بس لما الزائر يدخل صفحة الحساب، أو لو كان مسجّل قبل كده.
(function () {
  var CFG = { apiKey: "AIzaSyAi3-def6_ROFbWCfNfBjcth2Jg77dUO08", authDomain: "mizan-ef957.firebaseapp.com", projectId: "mizan-ef957", appId: "1:217446662222:web:13ef4f70d26e32e30e831f" };
  var V = "10.14.1", BASE = "https://www.gstatic.com/firebasejs/" + V + "/";
  var root = document.body.getAttribute("data-root") || "./";
  var FLAG = "mizan-signed-in", EMAIL = "mizan-email-for-link", HASH = "mizan-sync-hash";
  var A = null, F = null, readyP = null, user = null, listeners = [];

  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function load() {
    if (readyP) return readyP;
    readyP = Promise.all([import(BASE + "firebase-app.js"), import(BASE + "firebase-auth.js")]).then(function (m) {
      F = m[1];
      var app = m[0].initializeApp(CFG);
      A = F.getAuth(app); A.languageCode = "ar";
      return new Promise(function (res) {
        var first = true;
        F.onAuthStateChanged(A, function (u) {
          user = u; ls(FLAG, u ? "1" : null);
          if (u) sync(); else badge();
          listeners.forEach(function (f) { f(u); });
          if (first) { first = false; res(u); }
        });
      });
    });
    return readyP;
  }

  // كل بيانات ميزان اللي على الجهاز
  function snapshot() {
    var o = {};
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf("mizan-") === 0 && [FLAG, EMAIL, HASH].indexOf(k) < 0) o[k] = localStorage.getItem(k); } } catch (e) {}
    return o;
  }
  function merge(server) {
    var local = snapshot(), out = {}, k;
    for (k in server) out[k] = server[k];
    for (k in local) {
      if (!(k in out)) { out[k] = local[k]; continue; }
      if (k === "mizan-stats") { try { var a = JSON.parse(local[k]), b = JSON.parse(out[k]); if ((a.played || 0) > (b.played || 0)) out[k] = local[k]; } catch (e) {} }
      else if (k.indexOf("mizan-path-") === 0) { try { var x = JSON.parse(local[k]), y = JSON.parse(out[k]); out[k] = JSON.stringify(Array.from(new Set(x.concat(y))).sort()); } catch (e) {} }
      else if (k === "mizan-quiz-best") { out[k] = String(Math.max(+local[k] || 0, +out[k] || 0)); }
      else out[k] = local[k];
    }
    return out;
  }
  function api(method, body) {
    return user.getIdToken().then(function (t) {
      return fetch(window.MIZAN_API + "/me", { method: method, headers: { "Authorization": "Bearer " + t, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
        .then(function (r) { return r.json(); });
    });
  }
  var syncing = null;
  function sync() {
    if (syncing) return syncing;
    syncing = api("GET").then(function (me) {
      var merged = merge(me.progress || {});
      for (var k in merged) ls(k, merged[k]);
      var h = JSON.stringify(merged);
      if (h !== JSON.stringify(me.progress || {})) return api("PUT", { progress: merged }).then(function (m2) { ls(HASH, h); return m2; });
      ls(HASH, h); return me;
    }).then(function (me) { window.MIZAN_ME = me; badge(); return me; }).finally(function () { syncing = null; });
    return syncing;
  }
  function push() {
    if (!user) return;
    var s = snapshot(), h = JSON.stringify(s);
    if (h === ls(HASH)) return;
    ls(HASH, h);
    user.getIdToken().then(function (t) {
      fetch(window.MIZAN_API + "/me", { method: "PUT", keepalive: true, headers: { "Authorization": "Bearer " + t, "Content-Type": "application/json" }, body: JSON.stringify({ progress: s }) }).catch(function () {});
    });
  }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") push(); });
  setInterval(push, 60000);

  function badge() {
    var b = document.getElementById("acct-btn");
    if (!b) return;
    b.classList.toggle("on", !!user);
    b.setAttribute("aria-label", user ? "حسابي" : "تسجيل الدخول");
  }

  window.MizanAuth = {
    ready: load,
    user: function () { return user; },
    onChange: function (f) { listeners.push(f); },
    token: function () { return user ? user.getIdToken() : Promise.resolve(null); },
    google: function () {
      return load().then(function () {
        var p = new F.GoogleAuthProvider();
        return F.signInWithPopup(A, p).catch(function (e) {
          if (e && (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment")) return F.signInWithRedirect(A, p);
          throw e;
        });
      });
    },
    emailLink: function (email) {
      return load().then(function () {
        return F.sendSignInLinkToEmail(A, email, { url: location.origin + location.pathname.replace(/[^/]*$/, ""), handleCodeInApp: true }).then(function () { ls(EMAIL, email); });
      });
    },
    finishLink: function (email) {
      return load().then(function () {
        if (!F.isSignInWithEmailLink(A, location.href)) return null;
        email = email || ls(EMAIL);
        if (!email) return "need-email";
        return F.signInWithEmailLink(A, email, location.href).then(function (r) { ls(EMAIL, null); history.replaceState(null, "", location.pathname); return r; });
      });
    },
    isLink: function () { return /[?&]oobCode=/.test(location.search) && /mode=signIn/.test(location.search); },
    signOut: function () { push(); return load().then(function () { return F.signOut(A); }); },
    refresh: function () { return user ? sync() : Promise.resolve(null); },
    save: function (body) { return api("PUT", body); },
    remove: function () {
      return api("DELETE").then(function () {
        var s = snapshot(); for (var k in s) ls(k, null);
        return user.delete().catch(function (e) { if (e.code === "auth/requires-recent-login") return F.signOut(A); throw e; });
      });
    },
    push: push
  };

  // لو مسجّل قبل كده، نكمّل المزامنة في الخلفية
  if (ls(FLAG) === "1") setTimeout(load, 800);
})();
