/* CSP em Report-Only (hardening LGPD). DELIBERADAMENTE não-enforcing: o dashboard usa
   React Compiler + bootstrap inline do Next (script e style inline) e o `eval` que alguns
   chunks do Next/Turbopack ainda emitem — uma CSP enforcing com nonce exigiria render
   dinâmico e quebraria o modelo SSG/PPR + cacheComponents. Report-Only NÃO bloqueia nada,
   só mede violações; usamos p/ apertar depois (mover de Report-Only p/ enforcing + nonce
   quando o inventário de inline/eval estiver fechado). Espelha a policy do checkup
   (apps/checkup/next.config.ts), adaptada às chamadas reais do front web:
     - script-src: 'unsafe-inline'/'unsafe-eval' p/ Next/React Compiler + Turnstile (ADR-055,
       script de challenges.cloudflare.com).
     - frame-src: Turnstile renderiza o desafio num iframe de challenges.cloudflare.com.
     - connect-src: 'self' + viacep.com.br (busca de CEP no /p/perfil, fetch client-side).
     - img-src data:/blob: p/ ícones inline, QR e previews.
   Sem report-uri por ora (sem coletor de relatórios); adicionar ao apertar. */
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://viacep.com.br",
  "frame-src https://challenges.cloudflare.com",
].join("; ");

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
          {
            /* HSTS: força HTTPS no browser (prod serve atrás do ALB com TLS).
               2 anos + includeSubDomains; sem `preload` (não submetido à lista). */
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          {
            /* Permissions-Policy: trava recursos não usados. ATENÇÃO: câmera e
               microfone ficam liberados p/ `self` — a teleconsulta (WebRTC, ADR-026)
               depende deles; lockar quebraria o vídeo. Geolocalização e FLoC off. */
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=(), interest-cohort=()",
          },
          {
            /* CSP em Report-Only: mede violações sem bloquear (ver CSP_REPORT_ONLY acima).
               Não usar a versão enforcing aqui sem antes fechar o inventário de inline/eval
               do dashboard — caso contrário quebra React Compiler + bootstrap do Next. */
            key: "Content-Security-Policy-Report-Only",
            value: CSP_REPORT_ONLY,
          },
        ],
      },
    ]
  },
}

export default nextConfig;
