// next.config.ts — espelha as flags de apps/web (PPR/cacheComponents + React Compiler).
// Diferenças deliberadas vs apps/web: sem Sentry (isolamento do checkup; avaliar na
// Fase 2 se entra) e output "standalone" incondicional (deploy é só Docker/EC2).

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Standalone: imagem Docker enxuta para a t3.small */
  output: "standalone",

  /* React Compiler: memoização automática de componentes (React 19) */
  reactCompiler: true,

  /* Cache Components: explicit caching model (Next.js 16) */
  cacheComponents: true,

  /* Segurança: remove header X-Powered-By */
  poweredByHeader: false,

  compress: true,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
