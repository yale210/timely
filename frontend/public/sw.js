self.addEventListener("push", function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.message,
      icon: "/logo192.png",
      badge: "/logo192.png",
      data: {
        url: data.url || "/notifications",
      },
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener("notificationclick", function(event) {
  event.notification.close();

  const targetUrl = new URL(
    event.notification?.data?.url || "/notifications",
    self.location.origin,
  );

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function(clientList) {
        // Reuse an open app tab when possible so notification clicks do not spawn duplicates.
        for (const client of clientList) {
          const clientUrl = new URL(client.url);
          if (clientUrl.origin === targetUrl.origin && "focus" in client) {
            return client.focus().then(function() {
              if ("navigate" in client) {
                return client.navigate(targetUrl.href);
              }
              return undefined;
            });
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl.href);
        }
        return undefined;
      })
      .catch(function(error) {
        console.error("Failed to handle notification click:", error);
      }),
  );
});
