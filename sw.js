// Handy Toot! offline support. Change VERSION when you upload a new index.html.
var VERSION = 'handy-toot-1';
var CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
var EXTRA = ['https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return c.addAll(CORE).then(function () {
      return Promise.all(EXTRA.map(function (u) { return c.add(u).catch(function () {}); }));
    });
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
// Answer from the saved copy first so the app opens with no signal, and refresh the copy in the background.
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || e.request.url.indexOf('http') !== 0) return;
  e.respondWith(caches.open(VERSION).then(function (c) {
    return c.match(e.request, { ignoreSearch: e.request.mode === 'navigate' }).then(function (hit) {
      var net = fetch(e.request).then(function (res) {
        if (res && (res.ok || res.type === 'opaque')) c.put(e.request, res.clone());
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
