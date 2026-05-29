import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Cérebro Amigo',
    template: '%s · Cérebro Amigo',
  },
  description:
    'Cuidado psiquiátrico contínuo entre as consultas — diário, humor, medicação e timeline clínica.',
  applicationName: 'Cérebro Amigo',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Cérebro Amigo',
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: 'Cérebro Amigo',
    description: 'Cuidado psiquiátrico contínuo entre as consultas — diário, humor, medicação e timeline clínica.',
    url: 'https://www.cerebroamigo.com.br',
    siteName: 'Cérebro Amigo',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cérebro Amigo',
    description: 'Cuidado psiquiátrico contínuo entre as consultas.',
  },
}

export const viewport: Viewport = {
  themeColor: '#090c12',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${spaceGrotesk.variable} ${jetbrains.variable} h-full bg-[#0A0E0E]`}
    >
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="h-full antialiased font-sans text-[#F5F7F7] bg-[#0A0E0E]">
        {children}
      </body>
    </html>
  )
}
