// next.config.ts — espelhar a config de apps/web (PPR/cacheComponents + React Compiler).
// Se as flags em apps/web estiverem em outro formato/posição, copiar de lá: a
// fonte de verdade é o app web, não este stub.

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactCompiler: true,
  output: "standalone",
  transpilePackages: ["@react-pdf/renderer"],
};

export default nextConfig;
