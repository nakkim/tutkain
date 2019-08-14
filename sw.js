
var version = 'v0.05'

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

// self.addEventListener('beforeinstallprompt', (e) => {
//   // Prevent Chrome 67 and earlier from automatically showing the prompt
//   e.preventDefault();
//   deferredPrompt = e;
//   addBtn.style.display = 'block';

//   addBtn.addEventListener('click', (e) => {
//     addBtn.style.display = 'none';
//     deferredPrompt.prompt();
//     deferredPrompt.userChoice.then((choiceResult) => {
//         if (choiceResult.outcome === 'accepted') {
//           console.log('User accepted the A2HS prompt');
//         } else {
//           console.log('User dismissed the A2HS prompt');
//         }
//         deferredPrompt = null;
//       });
//   });
// });

var CACHE_NAME = 'tutkain-cache-';
var urlsToCache = [
  '/',
  '/index.html',
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