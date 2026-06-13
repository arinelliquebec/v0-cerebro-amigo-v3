/**
 * Rate limiting do checkup (CK-5).
 *
 * Padrão: fixed-window atômico no Postgres (checkup.rate_limits) — sobrevive a
 * restart e funciona com múltiplas instâncias. Se não houver DB (dev/CI) ou o DB
 * falhar, cai no limitador in-memory (instância única) — fail-soft, nunca derruba
 * o produto.
 *
 * Limites:
 *  - devolutiva: 3/sessão (janela 24h) + 20/IP/h
 *  - pdf/e-mail: 30/IP/h
 */
import { getSql } from "./db";

const SESSION_DEVOLUTIVA_LIMIT = 3;
const IP_DEVOLUTIVA_LIMIT = 20;
const IP_PDF_LIMIT = 30;
const WINDOW_MS = 60 * 60 * 1000; // 1 hora
const SESSION_WINDOW_MS = 24 * 60 * 60 * 1000; // cap por sessão: janela de 1 dia

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: "session_exceeded" | "ip_exceeded"; retryAfterMs?: number };

// ─── Caminho Postgres (atômico) ─────────────────────────────────────────────
// Retorna null se não há DB ou se a query falhou → o caller usa o fallback.
async function dbHit(
  bucket: string,
  windowMs: number,
  limit: number,
  reason: "session_exceeded" | "ip_exceeded"
): Promise<RateLimitResult | null> {
  const sql = getSql();
  if (!sql) return null;
  const windowSec = Math.ceil(windowMs / 1000);
  try {
    const rows = await sql<{ hits: number; retry_ms: string }[]>`
      INSERT INTO checkup.rate_limits (bucket, hits, window_start)
      VALUES (${bucket}, 1, now())
      ON CONFLICT (bucket) DO UPDATE SET
        hits = CASE
          WHEN checkup.rate_limits.window_start < now() - make_interval(secs => ${windowSec})
          THEN 1 ELSE checkup.rate_limits.hits + 1 END,
        window_start = CASE
          WHEN checkup.rate_limits.window_start < now() - make_interval(secs => ${windowSec})
          THEN now() ELSE checkup.rate_limits.window_start END
      RETURNING
        hits,
        ceil(extract(epoch from (window_start + make_interval(secs => ${windowSec}) - now())) * 1000)::bigint AS retry_ms
    `;
    const row = rows[0];
    if (Number(row.hits) > limit) {
      return { allowed: false, reason, retryAfterMs: Math.max(0, Number(row.retry_ms)) };
    }
    return { allowed: true };
  } catch (err: unknown) {
    // fail-soft: erro de DB no rate limit não pode quebrar o produto. Loga (CK-1/CK-2).
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error: rate_limit DB falhou (${bucket}): ${msg}`);
    return null;
  }
}

// ─── Fallback in-memory (instância única) ───────────────────────────────────
const ipDevolutivaWindows = new Map<string, number[]>();
const ipPdfWindows = new Map<string, number[]>();
const sessionDevolutivaCounts = new Map<string, number>();

function pruneWindow(timestamps: number[], now: number): number[] {
  return timestamps.filter((t) => now - t < WINDOW_MS);
}

function memDevolutiva(ip: string, sessionId: string): RateLimitResult {
  const now = Date.now();
  const sessionCount = sessionDevolutivaCounts.get(sessionId) ?? 0;
  if (sessionCount >= SESSION_DEVOLUTIVA_LIMIT) {
    return { allowed: false, reason: "session_exceeded" };
  }
  const ipWindow = pruneWindow(ipDevolutivaWindows.get(ip) ?? [], now);
  if (ipWindow.length >= IP_DEVOLUTIVA_LIMIT) {
    const retryAfterMs = WINDOW_MS - (now - Math.min(...ipWindow));
    return { allowed: false, reason: "ip_exceeded", retryAfterMs };
  }
  sessionDevolutivaCounts.set(sessionId, sessionCount + 1);
  ipWindow.push(now);
  ipDevolutivaWindows.set(ip, ipWindow);
  return { allowed: true };
}

function memPdf(ip: string): RateLimitResult {
  const now = Date.now();
  const ipWindow = pruneWindow(ipPdfWindows.get(ip) ?? [], now);
  if (ipWindow.length >= IP_PDF_LIMIT) {
    const retryAfterMs = WINDOW_MS - (now - Math.min(...ipWindow));
    return { allowed: false, reason: "ip_exceeded", retryAfterMs };
  }
  ipWindow.push(now);
  ipPdfWindows.set(ip, ipWindow);
  return { allowed: true };
}

// ─── API pública (async) ────────────────────────────────────────────────────
export async function checkDevolutivaLimit(ip: string, sessionId: string): Promise<RateLimitResult> {
  const sess = await dbHit(`dev:sess:${sessionId}`, SESSION_WINDOW_MS, SESSION_DEVOLUTIVA_LIMIT, "session_exceeded");
  if (sess === null) return memDevolutiva(ip, sessionId); // sem DB / erro → in-memory
  if (!sess.allowed) return sess;
  const ipr = await dbHit(`dev:ip:${ip}`, WINDOW_MS, IP_DEVOLUTIVA_LIMIT, "ip_exceeded");
  return ipr ?? memDevolutiva(ip, sessionId);
}

export async function checkPdfLimit(ip: string): Promise<RateLimitResult> {
  const r = await dbHit(`pdf:ip:${ip}`, WINDOW_MS, IP_PDF_LIMIT, "ip_exceeded");
  return r ?? memPdf(ip);
}

// Opt-in do acompanhamento longitudinal (ADR-050 Parte 2): escrita por sessão na
// superfície pública → mesmo perfil da devolutiva (3/sessão/24h + 20/IP/h). Baldes
// próprios no DB (`trk:*`); sem DB (dev/CI) cai no balde in-memory da devolutiva.
export async function checkTrackingLimit(ip: string, sessionId: string): Promise<RateLimitResult> {
  const sess = await dbHit(`trk:sess:${sessionId}`, SESSION_WINDOW_MS, SESSION_DEVOLUTIVA_LIMIT, "session_exceeded");
  if (sess === null) return memDevolutiva(ip, sessionId);
  if (!sess.allowed) return sess;
  const ipr = await dbHit(`trk:ip:${ip}`, WINDOW_MS, IP_DEVOLUTIVA_LIMIT, "ip_exceeded");
  return ipr ?? memDevolutiva(ip, sessionId);
}

// Expõe o caminho in-memory para teste (vitest roda sem DB → usa o fallback).
export const _testOnly = {
  resetAll() {
    ipDevolutivaWindows.clear();
    ipPdfWindows.clear();
    sessionDevolutivaCounts.clear();
  },
  setSessionCount(sessionId: string, count: number) {
    sessionDevolutivaCounts.set(sessionId, count);
  },
  fillIpWindow(ip: string, count: number, nowFn = Date.now) {
    const ts = nowFn();
    ipDevolutivaWindows.set(ip, Array.from({ length: count }, () => ts));
  },
};
