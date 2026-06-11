import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateDevolutiva } from "@/lib/ai/devolutiva";

const BodySchema = z.object({
  scaleId: z.enum(["phq9", "gad7", "asrs18"]),
  totalScore: z.number().int().min(0).max(50),
  band: z.string().min(1),
  bandLabel: z.string().min(1),
  partAPositives: z.number().int().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const devolutiva = await generateDevolutiva(parsed.data);
  return NextResponse.json(devolutiva);
}
