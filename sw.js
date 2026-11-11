// MPAcc 作战台 · Service Worker v8
// 策略：页面导航走「网络优先」（保证更新立刻生效），静态资源走「缓存优先」（秒开）
// 每次发版把 C 的版本号 +1
const C = 'mpacc-v8';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(C)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // 页面：网络优先，断网才用缓存
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          if (r && r.ok) caches.open(C).then(c => c.put('./index.html', r.clone()));
          return r;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 静态资源：缓存优先
  e.respondWith(
    caches.match(e.request).then(hit =>
      hit || fetch(e.request).then(r => {
        if (r && r.ok) caches.open(C).then(c => c.put(e.request, r.clone()));
        return r;
      })
    )
  );
});
