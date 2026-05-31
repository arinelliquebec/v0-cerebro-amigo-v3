import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { inter, playfair } from '@/lib/fonts'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cérebro Amigo - CRM Médico',
  description: 'O CRM que trabalha entre consultas. Acompanhe pacientes, organize condutas e fortaleça a continuidade do cuidado.',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable}`}>
      <head>
      </head>
      <body className={`${inter.className} bg-background antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
