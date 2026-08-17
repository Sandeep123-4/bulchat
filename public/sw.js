/* Mudraaa Service Worker — enables background notifications on mobile */

self.addEventListener("install", function () {
    self.skipWaiting();
});

self.addEventListener("activate", function (e) {
    e.waitUntil(clients.claim());
});

self.addEventListener("notificationclick", function (e) {
    e.notification.close();
    e.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
            for (var i = 0; i < list.length; i++) {
                var client = list[i];
                if (client.url.includes(self.location.origin) && "focus" in client) {
                    return client.focus();
                }
            }
            return clients.openWindow("/");
        })
    );
});
