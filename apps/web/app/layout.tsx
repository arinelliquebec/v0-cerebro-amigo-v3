import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { inter, playfair, jetbrainsMono } from '@/lib/fonts'
import './globals.css'

const SITE_URL = 'https://www.cerebroamigo.com.br'
const SITE_NAME = 'Cérebro Amigo'
const DEFAULT_DESCRIPTION =
  'Plataforma de psiquiatria para acompanhamento entre consultas: paciente registra humor e diário por voz; antes do retorno a IA entrega briefing completo com evolução, aderência e sinais de risco.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Acompanhamento entre consultas para psiquiatria`,
    template: `%s — ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    'psiquiatria digital', 'acompanhamento entre consultas', 'prontuário eletrônico psiquiatria',
    'check-in de humor', 'diário por voz', 'briefing pré-consulta', 'LGPD saúde mental',
    'software psiquiatria', 'telepsiquiatria', 'saúde mental tecnologia',
  ],
  authors: [{ name: 'Rafael Arinelli', url: SITE_URL }],
  creator: 'Rafael Arinelli',
  publisher: SITE_NAME,
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
    ],
    shortcut: '/favicon-32.png',
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Acompanhamento entre consultas para psiquiatria`,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Acompanhamento entre consultas`,
    description: DEFAULT_DESCRIPTION,
    images: ['/og-image.png'],
  },
  alternates: { canonical: SITE_URL },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable}`}>
      <head>
      </head>
      <body className={`${inter.className} bg-background antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(r => console.log('SW registered:', r.scope))
                    .catch(e => console.error('SW registration failed:', e));
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
