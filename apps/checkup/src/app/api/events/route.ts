import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { funnelEvents } from "@/lib/db/schema";

const EVENT_TYPES = [
  "test_started",
  "crisis_routed",
  "test_completed",
  "report_generated",
  "qr_scanned",
  "doctor_signup_started",
] as const;

const BodySchema = z.object({
  event: z.enum(EVENT_TYPES),
  sessionId: z.string().uuid(),
  scaleId: z.enum(["phq9", "gad7", "asrs18"]).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const db = getDb();
  if (db) {
    await db
      .insert(funnelEvents)
      .values({
        sessionId: parsed.data.sessionId,
        eventType: parsed.data.event,
        scaleId: parsed.data.scaleId ?? null,
      })
      .catch(() => {
        // silently fail — eventos são analytics, não bloqueia fluxo
      });
  }

  return NextResponse.json({ ok: true });
}
