/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Standalone output só para Docker; Vercel ignora/usa seu próprio modelo */
  output: process.env.VERCEL ? undefined : "standalone",

  /* React Compiler: memoização automática de componentes (React 19) */
  reactCompiler: true,

  /* Cache Components: explicit caching model (Next.js 16) */
  cacheComponents: true,

  /* Segurança: remove header X-Powered-By */
  poweredByHeader: false,

  /* Compressão Gzip/Brotli habilitada por padrão; deixamos explícito */
  compress: true,

  /* Imagens: Vercel tem optimizer nativo — serve WebP/AVIF automaticamente.
     Em Docker standalone (dev local) mantemos unoptimized para evitar
     dependência de loader externo sem configuração adicional. */
  images: {
    /* Otimização on-the-fly (WebP/AVIF/resize) também fora da Vercel: no EC2
       standalone o Next usa `sharp` (em dependencies) p/ servir /_next/image. */
    unoptimized: false,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  /* Redirects de SEO (404 sinalizados pelo Google Search Console em
     cerebroamigo.com.br). `source` casa só o caminho exato.

     1. /medicos: o segmento não tem page.tsx no nível pai (só /medicos/cadastro
        existe) → 404. A landing real do médico é /medico (singular). 308 leva o
        link morto à página certa; /medicos/cadastro (rota real) não é afetado.

     2. /checkup: o Check-up vive no subdomínio próprio, não em path no domínio
        principal — palpite comum de quem digita pelo nome do produto. 308 manda
        ao subdomínio em vez de 404 (destino externo, basePath:false). */
  async redirects() {
    return [
      {
        source: "/medicos",
        destination: "/medico",
        permanent: true,
      },
      {
        source: "/checkup",
        destination: "https://checkup.cerebroamigo.com.br",
        basePath: false,
        permanent: true,
      },
    ]
  },

  /* Headers de cache e segurança para rotas estáticas */
  async headers() {
    return [
      {
        /* Assets versionados (hash no nome) = imutáveis. Reforça o default do Next
           e garante o header atrás do ALB/CloudFront. */
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        /* Imagens otimizadas (/_next/image): cache + revalidação em background. */
        source: "/_next/image",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ]
  },
}

export default nextConfig;
