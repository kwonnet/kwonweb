self.addEventListener('push', function (event) {
  const data = event.data.json();
  console.log("notifications received ", data)
  navigator.serviceWorker.ready.then((registration) => {
    registration.showNotification(data.title, {
      body: data.body,
      vibrate: [200, 100, 200, 100, 200, 100, 200],
      tag: "torazon-notif",
      icon: "/android-chrome-192x192.png",
      badge: '/android-chrome-512x512.png',
      image: "/post.jpg",
      silent: false,
      requireInteraction: true,
      renotify: true
    });
  }).then((val) =>{
    console.log("Notification displayed", val)
  }).catch((reason)=>{
    console.log(`Notification error ${reason}}`)
  });
});


// self.addEventListener('push', function (event) {
//     const data = event.data.json();
//     console.log("notifications received ", data)
//     self.registration.showNotification(data.title, {
//       body: data.body,
//       badge: '/android-chrome-512x512.png', // optional
//       renotify: true,
//       icon: '/android-chrome-512x512.png',
//       tag: "torazon-notif"
//     });
//   });

  