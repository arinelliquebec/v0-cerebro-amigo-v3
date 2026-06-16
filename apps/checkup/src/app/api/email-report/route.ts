import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email/resend";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { CheckupPDF } from "@/components/CheckupPDF";
import { getDb } from "@/lib/db";
import { reportEmails } from "@/lib/db/schema";
import { checkPdfLimit } from "@/lib/ratelimit";

// Envio do relatório PDF por e-mail via Resend (ADR-061). LGPD: o e-mail bruto NUNCA é
// gravado — só o hash bcrypt em report_emails (tabela separada, sem FK com test_results).
// O dado do checkup segue no RDS sa-east-1; muda só o transporte do e-mail (mesmo
// provider do lado clínico). FROM/key vêm de env (EMAIL_FROM/RESEND_API_KEY).

const BodySchema = z.object({
  sessionId: z.string().uuid(),
  email: z.string().email(),
  scale: z.enum(["phq9", "gad7", "asrs18"]),
  score: z.number().int().min(0).max(100),
  band: z.string().min(1),
  label: z.string().min(1),
  crisis: z.boolean().default(false),
});

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// Corpo fixo do e-mail (texto). O PDF vai como anexo — o Resend monta o MIME.
const REPORT_TEXT =
  "Olá!\n\n" +
  "Segue em anexo o relatório da sua triagem no Check-up Mental.\n" +
  "É um instrumento de triagem — não é diagnóstico. Leve este PDF ao seu médico " +
  "ou psicólogo para uma avaliação completa.\n\n" +
  "Se precisar de apoio agora: CVV 188 (24h) · cvv.org.br\n\n" +
  "— Check-up Mental · Cérebro Amigo\n";

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const limit = await checkPdfLimit(ip); // mesmo teto do PDF (envio gera 1 PDF; anti-spam por IP)
  if (!limit.allowed) {
    const retryAfter = Math.ceil((limit.retryAfterMs ?? 3600000) / 1000);
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { sessionId, email, scale, score, band, label, crisis } = parsed.data;

  // gera o PDF (mesmo componente do /api/pdf)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdf = (await renderToBuffer(
    createElement(CheckupPDF, { scale, score, band, label, crisis, rid: sessionId.slice(0, 8) }) as any
  )) as Buffer;

  // envia via Resend (PDF como anexo base64)
  try {
    await sendEmail({
      to: email,
      subject: "Seu relatório do Check-up Mental",
      text: REPORT_TEXT,
      attachments: [{ filename: `checkup-${scale}.pdf`, contentBase64: pdf.toString("base64") }],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error: falha ao enviar relatório por e-mail (${scale}): ${msg}`);
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }

  // grava report_emails só após envio OK — hash bcrypt, nunca o e-mail bruto
  const db = getDb();
  if (db) {
    const emailHash = await bcrypt.hash(email, 10);
    await db
      .insert(reportEmails)
      .values({ sessionId, emailHash })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Error: falha ao gravar report_email: ${msg}`);
      });
  }

  return NextResponse.json({ ok: true });
}
