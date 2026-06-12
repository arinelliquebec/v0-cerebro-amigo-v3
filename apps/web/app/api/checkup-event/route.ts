import { NextRequest, NextResponse } from "next/server"

// BFF que repassa eventos do funil do lado MÉDICO (qr_scanned, doctor_signup_started)
// para a API PÚBLICA do Check-up (ADR-046). Isolamento: o web NUNCA escreve o schema
// `checkup` — chama a API pública dele server-side (sem CORS). Só event + rid; analytics
// não bloqueia a UI (best-effort).
const CHECKUP_EVENTS_URL =
  process.env.CHECKUP_EVENTS_URL ?? "https://checkup.cerebroamigo.com.br/api/events"

const ALLOWED = new Set(["qr_scanned", "doctor_signup_started"])

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const event = body?.event
  const rid = body?.rid
  if (!ALLOWED.has(event) || typeof rid !== "string" || !/^[A-Za-z0-9-]{4,32}$/.test(rid)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  try {
    await fetch(CHECKUP_EVENTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, rid }),
      cache: "no-store",
    })
  } catch {
    // analytics não bloqueia o funil
  }
  return NextResponse.json({ ok: true })
}
