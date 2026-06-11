/**
 * Rate limiting in-memory com janela deslizante.
 * Adequado para MVP com instância única. Para múltiplas instâncias, migrar para Redis.
 *
 * Dois limitadores independentes:
 *  - Por sessão: conta total de chamadas (sem janela de tempo — cap por sessão)
 *  - Por IP: janela deslizante de 1 hora
 */

const SESSION_DEVOLUTIVA_LIMIT = 3;
const IP_DEVOLUTIVA_LIMIT = 20;
const IP_PDF_LIMIT = 30;
const WINDOW_MS = 60 * 60 * 1000; // 1 hora

// Map<ip, timestamps[]>
const ipDevolutivaWindows = new Map<string, number[]>();
const ipPdfWindows = new Map<string, number[]>();

// Map<sessionId, count>
const sessionDevolutivaCounts = new Map<string, number>();

function pruneWindow(timestamps: number[], now: number): number[] {
  return timestamps.filter((t) => now - t < WINDOW_MS);
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: "session_exceeded" | "ip_exceeded"; retryAfterMs?: number };

export function checkDevolutivaLimit(ip: string, sessionId: string): RateLimitResult {
  const now = Date.now();

  // Limite por sessão (sem janela de tempo — total por UUID de sessão)
  const sessionCount = sessionDevolutivaCounts.get(sessionId) ?? 0;
  if (sessionCount >= SESSION_DEVOLUTIVA_LIMIT) {
    return { allowed: false, reason: "session_exceeded" };
  }

  // Limite por IP (janela deslizante 1h)
  const ipWindow = pruneWindow(ipDevolutivaWindows.get(ip) ?? [], now);
  if (ipWindow.length >= IP_DEVOLUTIVA_LIMIT) {
    const oldestInWindow = Math.min(...ipWindow);
    const retryAfterMs = WINDOW_MS - (now - oldestInWindow);
    return { allowed: false, reason: "ip_exceeded", retryAfterMs };
  }

  // Aprovado — registra
  sessionDevolutivaCounts.set(sessionId, sessionCount + 1);
  ipWindow.push(now);
  ipDevolutivaWindows.set(ip, ipWindow);

  return { allowed: true };
}

export function checkPdfLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const ipWindow = pruneWindow(ipPdfWindows.get(ip) ?? [], now);
  if (ipWindow.length >= IP_PDF_LIMIT) {
    const oldestInWindow = Math.min(...ipWindow);
    const retryAfterMs = WINDOW_MS - (now - oldestInWindow);
    return { allowed: false, reason: "ip_exceeded", retryAfterMs };
  }
  ipWindow.push(now);
  ipPdfWindows.set(ip, ipWindow);
  return { allowed: true };
}

// Expõe as maps para teste (só para vitest)
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
