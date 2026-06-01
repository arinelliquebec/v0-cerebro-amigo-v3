// Service worker do portal do paciente (Cérebro Amigo).
// Responsável por: receber Web Push e abrir a tela certa no clique.
// Payload enviado pelo notifier-py: { titulo, corpo, url }.

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("push", (event) => {
  let data = { titulo: "Cérebro Amigo", corpo: "", url: "/p" }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch {
    if (event.data) data.corpo = event.data.text()
  }

  const options = {
    body: data.corpo,
    icon: "/icon-light-32x32.png",
    badge: "/icon-light-32x32.png",
    data: { url: data.url || "/p" },
    tag: data.tag || undefined,
    renotify: false,
  }

  event.waitUntil(self.registration.showNotification(data.titulo, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || "/p"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Se já tem aba do portal aberta, foca nela e navega.
      for (const client of clients) {
        if (client.url.includes("/p") && "focus" in client) {
          client.focus()
          if ("navigate" in client) client.navigate(url)
          return
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    }),
  )
})
