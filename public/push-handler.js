// Imported by the Workbox-generated service worker via importScripts.
// Handles push notifications from the Netlify send-push function.

self.addEventListener('push', (event) => {
  if (!event.data) return
  const { title = '💰 BudgetIQ', body = "Don't forget to log today's expenses!" } =
    event.data.json()
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/favicon-32x32.png',
      tag: 'budgetiq-daily',
      renotify: true,
      data: { url: self.registration.scope }
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow(event.notification.data?.url || self.registration.scope)
    })
  )
})
