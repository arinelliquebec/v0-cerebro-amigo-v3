"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import type { Devolutiva } from "@/lib/ai/types";
import { getFallback } from "@/lib/ai/fallbacks";

const SCALE_NAMES: Record<string, string> = {
  phq9: "PHQ-9 — Depressão",
  gad7: "GAD-7 — Ansiedade",
  asrs18: "ASRS-18 — TDAH",
};

const BAND_COLORS: Record<string, string> = {
  minimal: "bg-emerald-50 text-emerald-800 border-emerald-200",
  mild: "bg-amber-50 text-amber-800 border-amber-200",
  moderate: "bg-orange-50 text-orange-800 border-orange-200",
  moderately_severe: "bg-red-50 text-red-800 border-red-200",
  severe: "bg-red-100 text-red-900 border-red-300",
  crisis: "bg-slate-100 text-slate-700 border-slate-300",
};

function CrisisResources() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-6">
      <p className="font-medium text-slate-700 mb-2 text-sm">Canais de apoio disponíveis 24h</p>
      <div className="space-y-1 text-sm text-slate-600">
        <p>
          <a href="tel:188" className="underline font-medium">CVV — 188</a> · Ligação gratuita
        </p>
        <p>
          <a href="https://cvv.org.br" target="_blank" rel="noopener noreferrer" className="underline">cvv.org.br</a> · Chat 24h
        </p>
        <p>
          <a href="tel:192" className="underline font-medium">SAMU — 192</a> · Emergência
        </p>
      </div>
    </div>
  );
}

function ResultContent() {
  const searchParams = useSearchParams();
  const sid = searchParams.get("sid") ?? "";
  const scale = searchParams.get("scale") ?? "";
  const score = parseInt(searchParams.get("score") ?? "0", 10);
  const band = searchParams.get("band") ?? "";
  const label = searchParams.get("label") ?? band;
  const isCrisis = searchParams.get("crisis") === "true";

  const [devolutiva, setDevolutiva] = useState<Devolutiva | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!scale || !band) {
      setLoading(false);
      return;
    }

    const input = { scaleId: scale as "phq9" | "gad7" | "asrs18", totalScore: score, band, bandLabel: label };

    fetch("/api/devolutiva", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, sessionId: sid || undefined }),
    })
      .then((r) => {
        // 429 → fallback estático (não quebra o fluxo)
        if (r.status === 429 || !r.ok) return null;
        return r.json();
      })
      .then((data) => {
        setDevolutiva(data ?? getFallback(input));
      })
      .catch(() => {
        setDevolutiva(getFallback(input));
      })
      .finally(() => setLoading(false));
  }, [scale, band, score, label]);

  const pdfHref = `/api/pdf?scale=${scale}&score=${score}&band=${band}&label=${encodeURIComponent(label)}&crisis=${isCrisis}&rid=${sid.slice(0, 8)}`;

  return (
    <main className="min-h-screen px-4 py-10 max-w-lg mx-auto">
      {/* Crisis resources — top, always visible when crisis */}
      {isCrisis && <CrisisResources />}

      {/* Score chip */}
      <div className="mb-6">
        <p className="text-sm text-[--muted-foreground] mb-1">{SCALE_NAMES[scale] ?? scale}</p>
        <div className="flex items-center gap-3">
          <span className="text-4xl font-bold text-[--navy]">{score}</span>
          <span
            className={`text-sm px-3 py-1 rounded-full border font-medium ${BAND_COLORS[band] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}
          >
            {label}
          </span>
        </div>
      </div>

      {/* Devolutiva */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-[--muted] rounded w-full" />
          ))}
        </div>
      ) : devolutiva ? (
        <div className="space-y-6">
          <p className="text-[--foreground] text-lg leading-relaxed">{devolutiva.acolhimento}</p>

          <div className="space-y-2">
            {devolutiva.leitura.map((l, i) => (
              <p key={i} className="text-[--muted-foreground] leading-relaxed">{l}</p>
            ))}
          </div>

          <div className="bg-[--muted] rounded-xl p-4">
            <p className="text-sm text-[--muted-foreground]">{devolutiva.limites}</p>
          </div>

          <div>
            <p className="font-medium text-[--navy] mb-3">Próximos passos</p>
            <ul className="space-y-2">
              {devolutiva.proximos_passos.map((p, i) => (
                <li key={i} className="flex gap-2 text-[--muted-foreground] text-sm leading-relaxed">
                  <span className="text-[--purple] mt-0.5">•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {/* PDF download — omitido em modo crise */}
      {!isCrisis && (
        <div className="mt-8 pt-6 border-t border-[--border]">
          <a
            href={pdfHref}
            onClick={() =>
              fetch("/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "report_generated", sessionId: sid, scaleId: scale }),
              }).catch(() => {})
            }
            className="block w-full text-center py-4 bg-[--purple] text-white rounded-xl font-medium hover:bg-[--purple-dark] transition-colors min-h-[44px]"
          >
            Baixar relatório PDF
          </a>
          <p className="text-xs text-[--muted-foreground] text-center mt-2">
            Para levar ao seu médico ou psicólogo.
          </p>
        </div>
      )}

      {/* Crisis resources at bottom (crisis mode: already at top; non-crisis: subtle) */}
      {!isCrisis && (
        <p className="text-xs text-[--muted-foreground] text-center mt-6">
          Se precisar de apoio: <a href="tel:188" className="underline">CVV 188</a> · 24h
        </p>
      )}

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-[--muted-foreground] hover:text-[--foreground]">
          ← Fazer outro teste
        </Link>
      </div>
    </main>
  );
}

export default function ResultadoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-[--muted-foreground]">Carregando resultado...</p></div>}>
      <ResultContent />
    </Suspense>
  );
}
