import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderToBuffer } = require("@react-pdf/renderer") as typeof import("@react-pdf/renderer");
import { createElement } from "react";
import { CheckupPDF } from "@/components/CheckupPDF";

export async function GET(req: NextRequest) {
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
