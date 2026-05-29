'use client'

import { useEffect, useState } from 'react'

/**
 * Registra o service worker e mostra prompt de instalação quando navegador
 * detecta que pode instalar como PWA.
 */
export function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // 1. Registra service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((err) => console.warn('SW falhou:', err))
    }

    // 2. Detecta se já está instalado (rodando standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                      || (window.navigator as { standalone?: boolean }).standalone === true
    if (isStandalone) {
      setInstalled(true)
      return
    }

    // 3. Captura evento de instalação (Android/Chrome/Edge)
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)

      // Mostra banner se ainda não dispensou
      if (!localStorage.getItem('pwa_dismissed')) {
        setShowBanner(true)
      }
    }
    window.addEventListener('beforeinstallprompt', handler)

    // 4. Detecta instalação concluída
    window.addEventListener('appinstalled', () => {
      setInstalled(true)
      setShowBanner(false)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function instalar() {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setInstallPrompt(null)
  }

  function dispensar() {
    localStorage.setItem('pwa_dismissed', '1')
    setShowBanner(false)
  }

  if (installed || !showBanner) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-sm mx-auto bg-brand-700 text-white
                    rounded-2xl p-4 shadow-2xl z-50 flex gap-3 items-start">
      <div className="text-2xl">📱</div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm">Instalar Cérebro Amigo</h3>
        <p className="text-xs text-white/80 mt-1">
          Adicione à tela inicial pra acessar mais rápido, sem precisar abrir o navegador.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={instalar}
            className="px-3 py-1.5 bg-white text-brand-900 rounded text-xs font-medium"
          >
            Instalar
          </button>
          <button
            onClick={dispensar}
            className="px-3 py-1.5 text-white/80 text-xs"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  )
}

// Tipo do evento (não está no DOM lib padrão ainda)
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}
