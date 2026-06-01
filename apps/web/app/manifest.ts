import type { MetadataRoute } from "next"

// Manifest PWA — foco no portal do paciente (/p/*), instalável no celular.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cérebro Amigo",
    short_name: "Cérebro Amigo",
    description: "Seu acompanhamento entre as consultas.",
    start_url: "/p",
    scope: "/",
    display: "standalone",
    background_color: "#F8FAFB",
    theme_color: "#5E4B8B",
    lang: "pt-BR",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
      { src: "/icon-light-32x32.png", type: "image/png", sizes: "32x32" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180", purpose: "maskable" },
    ],
  }
}
