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
    unoptimized: !process.env.VERCEL,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  /* Redirects de SEO: o segmento /medicos não tem page.tsx no nível pai
     (só /medicos/cadastro existe) → 404 sinalizado pelo Google Search Console.
     A landing real do médico é /medico (singular). 308 permanente leva o link
     morto à página certa e tira o 404 do índice. O `source` casa só o caminho
     exato; /medicos/cadastro (rota real) não é afetado. */
  async redirects() {
    return [
      {
        source: "/medicos",
        destination: "/medico",
        permanent: true,
      },
    ]
  },

  /* Headers de cache e segurança para rotas estáticas */
  async headers() {
    return [
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
