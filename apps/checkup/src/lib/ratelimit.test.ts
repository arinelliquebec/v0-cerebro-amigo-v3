import { describe, it, expect, beforeEach } from "vitest";
import { checkDevolutivaLimit, checkPdfLimit, _testOnly } from "./ratelimit";

const IP = "192.0.2.1";
const SESSION = "550e8400-e29b-41d4-a716-446655440000";

beforeEach(() => {
  _testOnly.resetAll();
});

describe("checkDevolutivaLimit — por sessão", () => {
  it("primeira chamada → permitida", () => {
    expect(checkDevolutivaLimit(IP, SESSION).allowed).toBe(true);
  });

  it("até 3 chamadas → todas permitidas", () => {
    const sid = "aaaaaaaa-0000-0000-0000-000000000001";
    for (let i = 0; i < 3; i++) {
      expect(checkDevolutivaLimit(IP, sid).allowed).toBe(true);
    }
  });

  it("4ª chamada na mesma sessão → 429 session_exceeded", () => {
    const sid = "aaaaaaaa-0000-0000-0000-000000000002";
    for (let i = 0; i < 3; i++) checkDevolutivaLimit(IP, sid);
    const r = checkDevolutivaLimit(IP, sid);
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.reason).toBe("session_exceeded");
  });

  it("sessões diferentes não interferem entre si", () => {
    const sid1 = "aaaaaaaa-0000-0000-0000-000000000003";
    const sid2 = "aaaaaaaa-0000-0000-0000-000000000004";
    for (let i = 0; i < 3; i++) checkDevolutivaLimit(IP, sid1);
    // sid1 esgotada, sid2 ainda livre
    expect(checkDevolutivaLimit(IP, sid2).allowed).toBe(true);
  });
});

describe("checkDevolutivaLimit — por IP", () => {
  it("IP com 19 chamadas → 20ª permitida, 21ª bloqueada", () => {
    _testOnly.fillIpWindow(IP, 19);
    const sid20 = "bbbbbbbb-0000-0000-0000-000000000001";
    const sid21 = "bbbbbbbb-0000-0000-0000-000000000002";
    expect(checkDevolutivaLimit(IP, sid20).allowed).toBe(true);
    const r = checkDevolutivaLimit(IP, sid21);
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.reason).toBe("ip_exceeded");
  });

  it("IP bloqueado expõe retryAfterMs > 0", () => {
    _testOnly.fillIpWindow(IP, 20);
    const r = checkDevolutivaLimit(IP, SESSION);
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect((r.retryAfterMs ?? 0)).toBeGreaterThan(0);
  });

  it("sessão esgotada tem prioridade sobre IP livre", () => {
    _testOnly.setSessionCount(SESSION, 3); // sessão no limite
    const r = checkDevolutivaLimit(IP, SESSION);
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.reason).toBe("session_exceeded");
  });
});

describe("checkPdfLimit — por IP", () => {
  it("até 30 chamadas → todas permitidas", () => {
    for (let i = 0; i < 30; i++) {
      expect(checkPdfLimit(`10.0.0.${i % 254 + 1}`).allowed).toBe(true);
    }
  });

  it("31ª chamada do mesmo IP → 429 ip_exceeded", () => {
    const ip = "10.0.0.99";
    for (let i = 0; i < 30; i++) checkPdfLimit(ip);
    const r = checkPdfLimit(ip);
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.reason).toBe("ip_exceeded");
  });
});
