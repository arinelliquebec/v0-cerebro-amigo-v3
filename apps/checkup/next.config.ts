// next.config.ts — espelhar a config de apps/web (PPR/cacheComponents + React Compiler).
// Se as flags em apps/web estiverem em outro formato/posição, copiar de lá: a
// fonte de verdade é o app web, não este stub.

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactCompiler: true,
  output: process.env.VERCEL ? undefined : "standalone",
  // @react-pdf/renderer quebra quando empacotado pelo Turbopack — o reconciler estoura
  // "Cannot read properties of undefined (reading 'S')" em runtime (appendChild). Externalizar
  // carrega o pacote nativo de node_modules no servidor, sem bundlar. NÃO usar transpilePackages.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
