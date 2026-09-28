/* FASE · service worker
   Vive en la raíz del sitio, no dentro de /app/, a propósito: un service worker
   sólo intercepta lo que cae bajo su propio directorio. Puesto en /app/ jamás
   habría podido servir ../base.css desde la cache y el portal, sin red, habría
   abierto sin estilos. Desde acá el scope cubre todo el sitio.

   Estrategia:
   - navegación -> red primero, cache de respaldo (nunca servir HTML viejo si hay red)
   - estáticos  -> cache primero y refresco en segundo plano                     */
var V = 'fase-v1';

/* Sólo el armazón del portal. La landing no se precachea: se guarda sola a
   medida que se visita. */
var SHELL = [
  'app/', 'app/index.html', 'app/app.css', 'app/app.js',
  'base.css',
  'assets/icon-192.png', 'assets/icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(V).then(function (c) {
    return Promise.all(SHELL.map(function (u) {
      // Un 404 suelto no debe tumbar toda la instalación.
      return c.add(new Request(u, { cache: 'reload' })).catch(function () {});
    }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== V; })
                         .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  if (new URL(r.url).origin !== location.origin) return;   // fuentes de Google, etc.

  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r).catch(function () {
        return caches.match(r).then(function (hit) { return hit || caches.match('app/index.html'); });
      })
    );
    return;
  }

  e.respondWith(caches.match(r).then(function (hit) {
    var net = fetch(r).then(function (res) {
      if (res && res.ok && res.type === 'basic') {
        var copy = res.clone();
        caches.open(V).then(function (c) { c.put(r, copy); });
      }
      return res;
    }).catch(function () { return hit; });
    return hit || net;
  }));
});
