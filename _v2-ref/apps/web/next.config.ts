import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // standalone needed for Docker/Azure; skip on Vercel
  ...(process.env.BUILD_STANDALONE === '1' && { output: 'standalone' }),

  // React 19.2 + Next.js 16: React Compiler estável
  reactCompiler: true,

  // Cache Components (use cache directive)
  experimental: {
    useCache: true,
    // View Transitions (React 19.2)
    viewTransition: true,
  },

  // Imagens vindas do storage da Azure
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.blob.core.windows.net' },
      { protocol: 'https', hostname: 'lookaside.fbsbx.com' },
    ],
  },

  // Headers de segurança (LGPD-friendly)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
