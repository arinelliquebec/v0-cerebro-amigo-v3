import type { MetadataRoute } from 'next'

/**
 * Manifest do Cérebro Amigo (PWA).
 *
 * Servido em /manifest.webmanifest automaticamente pelo Next.js.
 * Quando o paciente abre o site no Chrome/Safari, o navegador detecta
 * e oferece "Adicionar à tela inicial".
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cérebro Amigo',
    short_name: 'Cérebro Amigo',
    description: 'Seu espaço de cuidado psiquiátrico',
    start_url: '/p',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#090c12',  // dark navy (splash)
    theme_color: '#090c12',       // dark navy (status bar)
    lang: 'pt-BR',
    categories: ['health', 'medical', 'lifestyle'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Registrar humor',
        short_name: 'Humor',
        url: '/p/humor',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Escrever no diário',
        short_name: 'Diário',
        url: '/p/diario/nova',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  }
}
