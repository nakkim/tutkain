
<<<<<<< HEAD
var version = 'v0.17'
=======
var version = 'v0.22'
>>>>>>> quickfix

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(registration) {
      // Registration was successful
      // console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      // registration failed :(
      // console.log('ServiceWorker registration failed: ', err);
    })
  })
}

var CACHE_NAME = 'tutkain-cache-';
var urlsToCache = [
  '/',
  '/style.css'
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
  )
})

self.addEventListener('fetch', function(event) {

  if ( event.request.url.indexOf( '/php/' ) !== -1 ) {
    // console.log(event.request.url)
    // console.log(event)
    return false
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {

        if (response) {
          return response
        }

        // console.log(event.request)

        return fetch(event.request).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            var responseToCache = response.clone()

            caches.open(CACHE_NAME + version)
              .then(function(cache) {
                cache.put(event.request, responseToCache)
              })

            return response;
          }
        )
      })
    )
})

caches.keys().then(function(names) {
  for (let name of names)
    if(name !== CACHE_NAME + version)
      caches.delete(name);
});

