/**
 * Derivação confiável do IP do cliente atrás de CloudFront + ALB.
 *
 * PORQUÊ: a versão antiga (`x-forwarded-for.split(",")[0]`) lia o PRIMEIRO
 * elemento do XFF — que é exatamente o valor que o viewer pode FORJAR. Como
 * CloudFront e ALB apenas *anexam* o IP real à direita (nunca sobrescrevem),
 * o atacante injetava `X-Forwarded-For: <aleatório>` e ganhava um "IP novo" a
 * cada request, zerando o rate limit por IP (denial-of-wallet — ver ADR de
 * hardening anti-abuso do checkup).
 *
 * ESTRATÉGIA (em ordem de robustez):
 *  1. `CloudFront-Viewer-Address` — header que o CloudFront injeta a partir da
 *     conexão TCP do viewer. Não é spoofável pelo cliente (o CloudFront
 *     sobrescreve qualquer valor que o viewer mande). Formato "ip:porta".
 *     Só chega à origem se incluído no Origin Request Policy do CloudFront
 *     (follow-up de infra); ler defensivamente já deixa o caminho pronto.
 *  2. `X-Forwarded-For` descartando N hops confiáveis da DIREITA. Topologia:
 *     viewer → CloudFront (anexa IP do viewer) → ALB (anexa IP do CloudFront)
 *     → Next. O IP real do viewer fica em `len - 1 - HOPS`. Por mais entradas
 *     forjadas que o atacante prepende à ESQUERDA, o índice contado da direita
 *     não se move. HOPS=1 (só o ALB anexa entre o Next e o edge que registrou
 *     o viewer); ajustável por env se a topologia mudar.
 *  3. `x-real-ip` / "unknown" como último recurso.
 *
 * Sem PII persistida: o IP é usado só como chave efêmera de rate limit.
 */

// Nº de proxies confiáveis que anexam ao XFF entre o Next e o edge que viu o
// viewer real. CloudFront→ALB→Next ⇒ 1 (o ALB). Configurável p/ topologias futuras.
const TRUSTED_PROXY_HOPS = Math.max(0, Number(process.env.CHECKUP_TRUSTED_PROXY_HOPS ?? "1"));

function stripPort(addr: string): string {
  const v = addr.trim();
  if (!v) return "";
  // IPv6 entre colchetes: "[2001:db8::1]:443"
  if (v.startsWith("[")) {
    const end = v.indexOf("]");
    return end > 0 ? v.slice(1, end) : v;
  }
  // IPv4 "1.2.3.4:567" → corta a porta. IPv6 cru (vários ":") fica intacto.
  const firstColon = v.indexOf(":");
  if (firstColon !== -1 && v.indexOf(":", firstColon + 1) === -1) {
    return v.slice(0, firstColon);
  }
  return v;
}

interface HeaderGetter {
  headers: { get(name: string): string | null };
}

export function getClientIp(req: HeaderGetter): string {
  // 1) Header gerenciado do CloudFront — não-spoofável.
  const cfViewer = req.headers.get("cloudfront-viewer-address");
  if (cfViewer) {
    const ip = stripPort(cfViewer);
    if (ip) return ip;
  }

  // 2) XFF descartando os hops confiáveis da direita.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      const idx = parts.length - 1 - TRUSTED_PROXY_HOPS;
      // Cadeia menor que o esperado (ex.: request interno sem passar pelo edge):
      // cai para a entrada mais à esquerda em vez de estourar índice negativo.
      return parts[idx >= 0 ? idx : 0];
    }
  }

  // 3) Último recurso.
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
