import type { Metadata } from "next";
import { inter, playfair } from "@/lib/fonts";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://checkup.cerebroamigo.com.br";
const SITE_NAME = "Check-up Mental";

// Linguagem: triagem, nunca diagnóstico (regra inegociável #1 do CLAUDE.md).
const DEFAULT_DESCRIPTION =
  "Triagem gratuita de saúde mental com instrumentos validados (PHQ-9, GAD-7, ASRS-18). " +
  "Um ponto de partida para uma conversa com um profissional — não é diagnóstico.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — triagem gratuita de saúde mental`,
    template: `%s — ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — triagem gratuita de saúde mental`,
    description: DEFAULT_DESCRIPTION,
  },
  alternates: { canonical: SITE_URL },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
