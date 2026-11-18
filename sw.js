// Zulora service worker. Keeps the last opened page so the app still opens without internet.
// It never touches the database. Besides files from this site (GET only) it keeps one outside file: the sign-in library, so the app can open offline.
const V = 'zulora-v2';
const LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.78.0/dist/umd/supabase.js';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(['./', 'manifest.webmanifest', 'icon-192.png']).then(() => c.add(LIB)).catch(() => {})));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || r.headers.has('range')) return;
  if (r.url === LIB) {
    e.respondWith(caches.match(r).then(hit => {
      const net = fetch(r).then(res => { if (res.status === 200) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  if (r.mode === 'navigate') {
    // newest page first, last saved copy only when offline, so updates always show
    e.respondWith(fetch(r).then(res => { if (res.status === 200) { const cp = res.clone(); caches.open(V).then(c => c.put('./', cp)); } return res; })
      .catch(() => caches.match('./')));
    return;
  }
  e.respondWith(caches.match(r).then(hit => {
    const net = fetch(r).then(res => {
      const t = res.headers.get('content-type') || '';
      if (res.status === 200 && !/^(video|audio)\//.test(t)) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
