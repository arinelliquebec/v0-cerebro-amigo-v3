import { Inter, Playfair_Display } from "next/font/google";

export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

// LCP: o <h1> da home (Playfair 600) é o maior elemento. Declarar só os pesos
// realmente usados (500 = font-medium 1x, 600 = font-semibold 15x) e só latin
// (pt-BR cabe em Latin-1; não usa italic) reduz 8 arquivos → 2. Menos arquivos
// no preload = o peso 600 chega antes → swap perto do FCP → LCP cai ~2s.
export const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["500", "600"],
});
