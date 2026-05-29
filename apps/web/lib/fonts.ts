import { Inter } from "next/font/google"

export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
})

/** Playfair via <link> no layout — evita conflito com utilitários Tailwind. */
export const PLAYFAIR_DISPLAY =
  '"Playfair Display", Georgia, "Times New Roman", serif' as const
