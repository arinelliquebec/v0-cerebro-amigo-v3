import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { CheckupPDF } from "@/components/CheckupPDF";
import { getDb } from "@/lib/db";
import { reportEmails } from "@/lib/db/schema";
import { checkPdfLimit } from "@/lib/ratelimit";

// Envio do relatório PDF por e-mail via AWS SES sa-east-1 (in-region; usa a role do
// EC2, sem credencial no env). LGPD: o e-mail bruto NUNCA é gravado — só o hash bcrypt
// em report_emails (tabela separada, sem FK com test_results). O envio só funciona com
// production access do SES (fora do sandbox); até lá só manda p/ e-mail verificado.
const FROM = "Check-up Mental <noreply@cerebroamigo.com.br>";

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

function encodeSubject(s: string): string {
  // RFC 2047 p/ assunto com acento
  return `=?UTF-8?B?${Buffer.from(s, "utf-8").toString("base64")}?=`;
}

function buildRawEmail(to: string, pdf: Buffer, scale: string): Buffer {
  const boundary = `ckm_${Date.now().toString(36)}`;
  const body =
    "Olá!\r\n\r\n" +
    "Segue em anexo o relatório da sua triagem no Check-up Mental.\r\n" +
    "É um instrumento de triagem — não é diagnóstico. Leve este PDF ao seu médico " +
    "ou psicólogo para uma avaliação completa.\r\n\r\n" +
    "Se precisar de apoio agora: CVV 188 (24h) · cvv.org.br\r\n\r\n" +
    "— Check-up Mental · Cérebro Amigo\r\n";
  const b64 = pdf.toString("base64").replace(/(.{76})/g, "$1\r\n");
  const raw = [
    `From: ${FROM}`,
    `To: ${to}`,
    `Subject: ${encodeSubject("Seu relatório do Check-up Mental")}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    body,
    `--${boundary}`,
    `Content-Type: application/pdf; name="checkup-${scale}.pdf"`,
    `Content-Disposition: attachment; filename="checkup-${scale}.pdf"`,
    "Content-Transfer-Encoding: base64",
    "",
    b64,
    `--${boundary}--`,
    "",
  ].join("\r\n");
  return Buffer.from(raw, "utf-8");
}

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

  // envia via SES (role do EC2)
  try {
    const ses = new SESv2Client({ region: process.env.AWS_REGION ?? "sa-east-1" });
    await ses.send(
      new SendEmailCommand({ Content: { Raw: { Data: buildRawEmail(email, pdf, scale) } } })
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error: falha ao enviar relatório por SES (${scale}): ${msg}`);
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
