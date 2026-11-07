// ميزان: يشتغل من غير نت. HTML بيتجاب من الشبكة الأول، والملفات الثابتة من الكاش.
const CACHE = "mizan-324a037f";
const PRE = ["./", "offline.html", "daily/", "atlas/", "philosophy/", "quiz/", "search/", "search.json", "manifest.webmanifest", "assets/style.css?v=324a037f", "assets/app.js?v=324a037f", "assets/daily.js?v=324a037f", "assets/quiz.js?v=324a037f", "assets/search.js?v=324a037f"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("mizan-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  if (url.hostname.endsWith("workers.dev") || url.hostname.includes("cloudflareinsights")) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match("offline.html"))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok && (url.origin === location.origin || url.hostname.includes("gstatic") || url.hostname.includes("googleapis"))) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
    return r;
  })));
});
