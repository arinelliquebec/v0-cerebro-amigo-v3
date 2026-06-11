import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { CheckupPDF } from "@/components/CheckupPDF";
import { checkPdfLimit } from "@/lib/ratelimit";

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function GET(req: NextRequest) {
  const ip = getClientIP(req);
  const limit = await checkPdfLimit(ip);
  if (!limit.allowed) {
    const retryAfter = Math.ceil((limit.retryAfterMs ?? 3600000) / 1000);
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const { searchParams } = new URL(req.url);
  const scale = searchParams.get("scale") ?? "";
  const scoreStr = searchParams.get("score") ?? "0";
  const band = searchParams.get("band") ?? "";
  const label = searchParams.get("label") ?? "";
  const crisis = searchParams.get("crisis") === "true";
  const rid = searchParams.get("rid") ?? "";

  const score = parseInt(scoreStr, 10);
  if (!scale || !band) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(createElement(CheckupPDF, { scale, score, band, label, crisis, rid }) as any);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="checkup-${scale}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
