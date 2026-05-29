import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { inter } from '@/lib/fonts'
import { MuiProvider } from '@/components/mui-provider'
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
    <html lang="pt-BR" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.className} bg-background antialiased`}>
        <MuiProvider>
          {children}
        </MuiProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
