"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { FileDown, Info } from "lucide-react";
import type { Devolutiva } from "@/lib/ai/types";
import { getFallback } from "@/lib/ai/fallbacks";
import { decodeAssistResult } from "@/lib/scales/assist";

const SCALE_NAMES: Record<string, string> = {
  phq9: "PHQ-9 — Depressão",
  gad7: "GAD-7 — Ansiedade",
  asrs18: "ASRS-18 — TDAH",
  audit: "AUDIT — Uso de Álcool",
  mdq: "MDQ — Bipolaridade",
  fagerstrom: "Fagerström — Nicotina",
  msi_bpd: "MSI-BPD — Traços Borderline",
  assist: "ASSIST — Uso de Substâncias (OMS)",
};

// Escore máximo por escala (p/ o medidor). ASRS-18 e MSI-BPD são qualitativos
// (sem gauge); MDQ mostra chip de triagem, sem gauge.
const SCALE_MAX: Record<string, number> = {
  phq9: 27,
  gad7: 21,
  audit: 40,
  fagerstrom: 10,
};

// Chips de faixa sobre o noir: tinta translúcida + texto claro (AA no fundo escuro).
const BAND_CHIP: Record<string, string> = {
  minimal: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  mild: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  moderate: "border-orange-400/30 bg-orange-400/10 text-orange-300",
  moderately_severe: "border-red-400/30 bg-red-400/10 text-red-300",
  severe: "border-red-400/40 bg-red-400/15 text-red-200",
  crisis: "border-slate-400/30 bg-slate-400/10 text-slate-300",
  informative: "border-slate-400/30 bg-slate-400/10 text-slate-300",
  // AUDIT (zonas OMS)
  low_risk: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  risky_use: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  harmful_use: "border-orange-400/30 bg-orange-400/10 text-orange-300",
  probable_dependence: "border-red-400/40 bg-red-400/15 text-red-200",
  // Fagerström (graus de dependência)
  very_low: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  low: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  medium: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  high: "border-orange-400/30 bg-orange-400/10 text-orange-300",
  very_high: "border-red-400/40 bg-red-400/15 text-red-200",
  // MDQ (triagem)
  negative: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  positive: "border-orange-400/30 bg-orange-400/10 text-orange-300",
  // ASSIST (risco por substância)
  moderate_risk: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  high_risk: "border-red-400/40 bg-red-400/15 text-red-200",
};

const BAND_RING: Record<string, string> = {
  minimal: "#34D399",
  mild: "#FBBF24",
  moderate: "#FB923C",
  moderately_severe: "#F87171",
  severe: "#F87171",
  low_risk: "#34D399",
  risky_use: "#FBBF24",
  harmful_use: "#FB923C",
  probable_dependence: "#F87171",
  very_low: "#34D399",
  low: "#34D399",
  medium: "#FBBF24",
  high: "#FB923C",
  very_high: "#F87171",
};

// Medidor circular do escore (SVG puro, determinístico — a IA nunca calcula escore).
// Circunferência r=52 ≈ 326.7 — casa com o keyframe gauge-in do globals.css.
function ScoreGauge({ score, max, band }: { score: number; max: number; band: string }) {
  const C = 2 * Math.PI * 52;
  const frac = max > 0 ? Math.min(Math.max(score / max, 0), 1) : 0;
  const color = BAND_RING[band] ?? "#9486C9";
  return (
    <div className="relative h-[124px] w-[124px] shrink-0" aria-hidden>
      <svg viewBox="0 0 120 120" className="h-full w-full">
        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--noir-line)" strokeWidth="7" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - frac)}
          transform="rotate(-90 60 60)"
          className="gauge-arc"
          style={{ filter: `drop-shadow(0 0 8px ${color}55)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold leading-none text-foreground">{score}</span>
        <span className="mt-1 text-[0.68rem] text-muted-foreground">de {max}</span>
      </div>
    </div>
  );
}

// Ilha CLARA deliberada (clinical-safety): canais de crise sempre em fundo claro
// com texto escuro literal — máxima legibilidade p/ quem está em sofrimento.
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
  const [consented, setConsented] = useState(false);
  const [consentSaved, setConsentSaved] = useState(false);

  // Consentimento LGPD: grava test_results SÓ quando o usuário marca (default off).
  // Anônimo — só escala/escore/faixa, sem PII. Não-bloqueante.
  const handleConsent = (checked: boolean) => {
    setConsented(checked);
    if (!checked || consentSaved || !sid || !scale || !band) return;
    fetch("/api/result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sid,
        scaleId: scale,
        totalScore: score,
        band,
        crisisFlag: isCrisis,
        consented: true,
      }),
    })
      .then((r) => {
        if (r.ok) setConsentSaved(true);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!scale || !band) {
      setLoading(false);
      return;
    }

    const input = {
      scaleId: scale as import("@/lib/scales/types").ScaleId,
      totalScore: score,
      band,
      bandLabel: label,
    };

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

  // ASSIST: resultado é POR substância (ADR-049) — decodificado e recomputado
  // deterministicamente do query param (sem PII; faixas vêm do motor).
  const assistSub = scale === "assist" ? decodeAssistResult(searchParams.get("sub") ?? "") : [];
  const assistInj = scale === "assist" && searchParams.get("inj") === "1";

  const pdfHref = `/api/pdf?scale=${scale}&score=${score}&band=${band}&label=${encodeURIComponent(label)}&crisis=${isCrisis}&rid=${sid.slice(0, 8)}${scale === "assist" ? `&sub=${encodeURIComponent(searchParams.get("sub") ?? "")}&inj=${assistInj ? "1" : "0"}` : ""}`;
  const max = SCALE_MAX[scale];

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg px-4 py-12 sm:px-6">
      {/* Crisis resources — top, always visible when crisis */}
      {isCrisis && <CrisisResources />}

      {/* Cartão do escore — escala com verdict (PHQ-9/GAD-7) mostra medidor + faixa.
          Band "informative" (ASRS-18) é qualitativa: sem número, só rótulo neutro. */}
      <section className="glass-noir-deep reveal mb-8 rounded-3xl p-6 sm:p-7">
        <p className="eyebrow mb-4">Seu resultado · {SCALE_NAMES[scale] ?? scale}</p>
        {scale === "assist" ? (
          <div>
            {assistSub.length === 0 ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Você não relatou uso de substâncias ao longo da vida — risco baixo neste
                momento.
              </p>
            ) : (
              <div className="space-y-2.5">
                {assistSub.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/60 px-4 py-3"
                  >
                    <span className="text-sm font-medium capitalize text-foreground">
                      {s.short}
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground">{s.score}</span>
                      <span
                        className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${BAND_CHIP[s.band] ?? "border-slate-400/30 bg-slate-400/10 text-slate-300"}`}
                      >
                        {s.bandLabel}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
            {assistInj && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm leading-relaxed text-amber-800">
                  Você relatou uso de drogas injetáveis. Esse padrão merece uma conversa com
                  um profissional de saúde o quanto antes — o CAPS AD atende gratuitamente
                  pelo SUS, sem julgamento.
                </p>
              </div>
            )}
          </div>
        ) : band === "informative" || max === undefined ? (
          <span
            className={`inline-block rounded-full border px-3.5 py-1.5 text-sm font-medium ${BAND_CHIP[band] ?? "border-slate-400/30 bg-slate-400/10 text-slate-300"}`}
          >
            {label}
          </span>
        ) : (
          <div className="flex items-center gap-6">
            <ScoreGauge score={score} max={max} band={band} />
            <div className="space-y-2">
              <span
                className={`inline-block rounded-full border px-3.5 py-1.5 text-sm font-medium ${BAND_CHIP[band] ?? "border-slate-400/30 bg-slate-400/10 text-slate-300"}`}
              >
                {label}
              </span>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Faixa do seu escore neste instrumento de triagem.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Devolutiva */}
      {loading ? (
        <div className="animate-pulse space-y-3" aria-label="Preparando sua devolutiva">
          <div className="h-5 w-3/4 rounded-lg bg-muted" />
          <div className="h-4 w-full rounded-lg bg-muted" />
          <div className="h-4 w-full rounded-lg bg-muted" />
          <div className="h-4 w-2/3 rounded-lg bg-muted" />
        </div>
      ) : devolutiva ? (
        <div className="reveal reveal-1 space-y-7">
          <p className="text-lg leading-relaxed text-foreground">{devolutiva.acolhimento}</p>

          <div className="space-y-3">
            {devolutiva.leitura.map((l, i) => (
              <p key={i} className="leading-relaxed text-muted-foreground">{l}</p>
            ))}
          </div>

          <div className="glass-noir flex gap-3 rounded-2xl p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-purple-light" aria-hidden />
            <p className="text-sm leading-relaxed text-muted-foreground">{devolutiva.limites}</p>
          </div>

          <div>
            <p className="mb-3 font-display text-xl font-semibold text-foreground">
              Próximos passos
            </p>
            <ul className="space-y-3">
              {devolutiva.proximos_passos.map((p, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span
                    className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple/15 font-mono text-[0.65rem] font-semibold text-purple-light"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {/* PDF download — omitido em modo crise. Marca em evidência: o relatório
          é o vetor de aquisição de médicos (QR do Cérebro Amigo no PDF).
          Renderiza só após o loading p/ a página não "pular" quando a
          devolutiva chega (blocos aparecem juntos, com reveal). */}
      {!loading && !isCrisis && (
        <section className="glass-noir-deep reveal reveal-2 relative mt-10 overflow-hidden rounded-3xl p-6 sm:p-7">
          <div className="aurora pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative">
            <div className="mb-4 flex items-start gap-4">
              <span
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-purple/25 bg-purple/10 text-purple-light"
                aria-hidden
              >
                <FileDown className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-xl font-semibold leading-snug text-foreground">
                  Leve este resultado ao seu médico
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Relatório em PDF com seu escore e a faixa, gerado pelo{" "}
                  <strong className="text-foreground">Cérebro Amigo</strong>.
                </p>
              </div>
            </div>
            <a
              href={pdfHref}
              onClick={() =>
                fetch("/api/events", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ event: "report_generated", sessionId: sid, scaleId: scale }),
                }).catch(() => {})
              }
              className="btn-noir w-full"
            >
              Baixar relatório PDF
            </a>
            <p className="mt-2.5 text-center text-xs text-muted-foreground">
              Para levar ao seu médico ou psicólogo.
            </p>
          </div>
        </section>
      )}

      {/* Consentimento (LGPD) — default desmarcado; só grava se marcar */}
      {!loading && scale && band && (
        <div className="reveal reveal-3 mt-8">
          <label className="glass-noir flex cursor-pointer items-start gap-3 rounded-2xl p-4">
            <input
              type="checkbox"
              checked={consented}
              onChange={(e) => handleConsent(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-(--purple)"
            />
            <span className="text-sm leading-relaxed text-muted-foreground">
              Guardar meu resultado de forma anônima para ajudar a melhorar o Check-up.
              Nada que te identifique é salvo — só a escala, o escore e a faixa.
            </span>
          </label>
          {consentSaved && (
            <p className="mt-2 text-xs text-purple-light">✓ Resultado guardado anonimamente. Obrigado.</p>
          )}
        </div>
      )}

      {/* Crisis resources at bottom (crisis mode: already at top; non-crisis: subtle) */}
      {!isCrisis && (
        <p className="mt-7 text-center text-xs text-muted-foreground">
          Se precisar de apoio: <a href="tel:188" className="underline underline-offset-2">CVV 188</a> · 24h
        </p>
      )}

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          ← Fazer outro teste
        </Link>
      </div>
    </main>
  );
}

export default function ResultadoPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Carregando resultado...</p></div>}>
      <ResultContent />
    </Suspense>
  );
}
