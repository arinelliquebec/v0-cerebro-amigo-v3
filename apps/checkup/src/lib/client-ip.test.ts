import { describe, it, expect } from "vitest";
import { getClientIp } from "./client-ip";

// Monta um req falso só com headers (o helper só lê headers).
function req(headers: Record<string, string>) {
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return { headers: { get: (name: string) => lower[name.toLowerCase()] ?? null } };
}

// Default CHECKUP_TRUSTED_PROXY_HOPS=1 (topologia CloudFront→ALB→Next).
describe("getClientIp — anti XFF-spoof", () => {
  it("XFF com entradas FORJADAS à esquerda → NÃO retorna o [0] do atacante", () => {
    // Atacante injeta "evil"; CloudFront anexa o IP real; ALB anexa o egress do CF.
    const ip = getClientIp(req({ "x-forwarded-for": "9.9.9.9, 203.0.113.7, 198.51.100.2" }));
    expect(ip).toBe("203.0.113.7"); // o viewer real (penúltimo), não "9.9.9.9"
  });

  it("vários hops forjados à esquerda não movem o índice contado da direita", () => {
    const ip = getClientIp(req({ "x-forwarded-for": "a, b, c, d, 203.0.113.7, 198.51.100.2" }));
    expect(ip).toBe("203.0.113.7");
  });

  it("sem spoof (só viewer + ALB) → retorna o viewer", () => {
    expect(getClientIp(req({ "x-forwarded-for": "203.0.113.7, 198.51.100.2" }))).toBe("203.0.113.7");
  });

  it("CloudFront-Viewer-Address tem prioridade e tira a porta (IPv4)", () => {
    const ip = getClientIp(
      req({ "cloudfront-viewer-address": "203.0.113.7:53124", "x-forwarded-for": "9.9.9.9" })
    );
    expect(ip).toBe("203.0.113.7");
  });

  it("CloudFront-Viewer-Address IPv6 entre colchetes → sem porta, sem colchetes", () => {
    expect(getClientIp(req({ "cloudfront-viewer-address": "[2001:db8::1]:443" }))).toBe("2001:db8::1");
  });

  it("fallback x-real-ip quando não há XFF nem CF header", () => {
    expect(getClientIp(req({ "x-real-ip": "203.0.113.9" }))).toBe("203.0.113.9");
  });

  it("sem nenhum header → 'unknown'", () => {
    expect(getClientIp(req({}))).toBe("unknown");
  });
});
