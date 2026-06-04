import { withSentryConfig } from "@sentry/nextjs";

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

  /* Imagens: em deploy Docker standalone o optimizer nativo requer configuração
     adicional de loader. Mantemos unoptimized até infraestrutura de imagem estar
     provisionada (ex.: CloudFront/ImageKit). Quando migrar, remover esta linha. */
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
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

export default withSentryConfig(nextConfig, {
  // Source map upload
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Só envia source maps em build de produção
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Create a proxy API route to bypass ad-blockers
  tunnelRoute: "/monitoring",

  // Oculta código-fonte nos bundles do cliente
  hideSourceMaps: true,

  // Turbopack: removeDebugLogging não é suportado;
  // deixamos logs do SDK ativos para debug.
});
