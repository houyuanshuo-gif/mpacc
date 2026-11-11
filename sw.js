// MPAcc 作战台 · Service Worker
// 策略：stale-while-revalidate（先秒开缓存，再后台更新）
// 每次发版记得把 C 的版本号 +1，否则手机不会更新
const C = 'mpacc-v6';
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
  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) {
        // 命中缓存：立即返回，后台顺手更新
        fetch(e.request)
          .then(r => { if (r && r.ok) caches.open(C).then(c => c.put(e.request, r.clone())); })
          .catch(() => {});
        return hit;
      }
      // 没命中：走网络，成功后写入缓存；失败回退首页
      return fetch(e.request)
        .then(r => {
          if (r && r.ok) caches.open(C).then(c => c.put(e.request, r.clone()));
          return r;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
