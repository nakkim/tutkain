
var version = 'v0.1'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(registration) {
      // Registration was successful
      // console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      // registration failed :(
      // console.log('ServiceWorker registration failed: ', err);
    });
  });
}

var CACHE_NAME = 'tutkain-cache-';
var urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/node_modules/leaflet/dist/leaflet.css',
  '/node_modules/leaflet/dist/leaflet.js',
  '/node_modules/leaflet-search/dist/leaflet-search.src.js',
  '/node_modules/moment/moment.js',
  '/node_modules/iso8601-js-period/iso8601.js',
  '/node_modules/leaflet-timedimension/dist/leaflet.timedimension.src.js',
  '/node_modules/jquery/dist/jquery.min.js',
];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches
      .open(CACHE_NAME + version)
      .then(function(cache) {
        // console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});