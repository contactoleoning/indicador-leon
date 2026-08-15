// Service worker — Indicador León
// Estrategia: red primero (para recibir siempre la última versión publicada),
// con caché de respaldo para abrir la app sin conexión.
var CACHE = "indicador-leon-v31";
var ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  // Solo manejar archivos propios; Firebase y otras APIs van directo a la red
  if (url.origin !== self.location.origin) return;
  // "Red primero" no alcanzaba: entre este fetch y el servidor esta la cache
  // HTTP del navegador, y GitHub Pages manda el HTML con max-age. Resultado:
  // se publicaba una version nueva, el servidor ya la tenia, y la app seguia
  // abriendo la vieja sin ningun aviso. Para el HTML se salta esa cache; el
  // resto de los archivos (iconos, manifest) puede seguir usandola.
  var esDocumento = e.request.mode === "navigate" ||
                    (e.request.headers.get("accept") || "").indexOf("text/html") >= 0;
  e.respondWith(
    fetch(e.request, esDocumento ? { cache: "reload" } : undefined)
      .then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      })
      .catch(function () { return caches.match(e.request); })
  );
});

// Al tocar la notificación de recordatorios, enfocar la app si ya está
// abierta en una pestaña, o abrir una nueva si no.
self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        if ("focus" in clientList[i]) return clientList[i].focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("./");
    })
  );
});
