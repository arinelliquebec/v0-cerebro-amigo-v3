/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

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

export default nextConfig
