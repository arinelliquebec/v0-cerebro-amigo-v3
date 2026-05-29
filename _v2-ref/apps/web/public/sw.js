// Service Worker — Cérebro Amigo
// Estratégia: network-first com fallback de cache pra páginas críticas.
//
// O que cacheia:
//  - Shell do app (HTML das rotas /p/*)
//  - Ícones e CSS
//  - Última versão das telas que o paciente abriu
//
// O que NUNCA cacheia:
//  - APIs (/api/*) — sempre rede, falha se offline
//  - Tokens de auth — segurança

const CACHE_VERSION = 'cerebro-amigo-v1'
const SHELL_CACHE = `${CACHE_VERSION}-shell`
const PAGES_CACHE = `${CACHE_VERSION}-pages`

// Recursos do shell (sempre cacheados na instalação)
const SHELL_ASSETS = [
  '/p/entrar',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/apple-touch-icon.png',
  '/manifest.webmanifest',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch((err) => {
        console.warn('[SW] falha cacheando shell:', err)
      })
    })
  )
  // Ativa imediatamente, sem esperar reload
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Mesma origem apenas
  if (url.origin !== self.location.origin) return

  // NUNCA cachear APIs
  if (url.pathname.startsWith('/api/')) return

  // Páginas do paciente: network-first com fallback de cache
  if (url.pathname.startsWith('/p/') || url.pathname === '/p') {
    event.respondWith(networkFirst(request))
    return
  }

  // Assets estáticos: cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/apple-touch-icon.png'
  ) {
    event.respondWith(cacheFirst(request))
    return
  }
})

async function networkFirst(request) {
  try {
    const fresh = await fetch(request)
    if (fresh.ok) {
      const cache = await caches.open(PAGES_CACHE)
      cache.put(request, fresh.clone())
    }
    return fresh
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    // Fallback final: tela de offline simples
    return new Response(
      `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Sem conexão</title>
       <meta name="viewport" content="width=device-width,initial-scale=1">
       <style>body{font-family:system-ui;background:#1a0d2e;color:#fff;display:flex;
       align-items:center;justify-content:center;height:100vh;margin:0;padding:24px;text-align:center}
       h1{color:#a78bfa}</style></head>
       <body><div><h1>Sem conexão</h1>
       <p>Você está offline. Tente novamente quando voltar à internet.</p></div></body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 200 }
    )
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const fresh = await fetch(request)
    if (fresh.ok) {
      const cache = await caches.open(SHELL_CACHE)
      cache.put(request, fresh.clone())
    }
    return fresh
  } catch {
    return new Response('', { status: 504 })
  }
}

// Push notifications (para futuro: lembrete de medicação via push)
self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Cérebro Amigo', {
      body: data.body ?? '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag ?? 'cerebro-amigo',
      data: { url: data.url ?? '/p' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/p'
  event.waitUntil(self.clients.openWindow(url))
})
