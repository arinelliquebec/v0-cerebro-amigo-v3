"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Scale, ScaleResult } from "@/lib/scales/types";
import { scorePhq9 } from "@/lib/scales/phq9";
import { scoreGad7 } from "@/lib/scales/gad7";
import { scoreAsrs18 } from "@/lib/scales/asrs18";
import { cn } from "@/lib/utils";

function getScoreFn(scaleId: string) {
  if (scaleId === "phq9") return scorePhq9;
  if (scaleId === "gad7") return scoreGad7;
  if (scaleId === "asrs18") return scoreAsrs18;
  throw new Error(`No score function for ${scaleId}`);
}

function fireEvent(event: string, sessionId: string, scaleId: string) {
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, sessionId, scaleId }),
  }).catch(() => {});
}

interface Props {
  scale: Scale;
}

export function QuizFlow({ scale }: Props) {
  const router = useRouter();
  // Sessão efêmera anônima: UUID gerado client-side PÓS-montagem.
  // NÃO gerar no render — crypto.randomUUID quebra o prerender PPR (sem Suspense acima).
  const [sessionId, setSessionId] = useState("");
  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  const [step, setStep] = useState(-1); // -1 = intro
  const [answers, setAnswers] = useState<number[]>(new Array(scale.items.length).fill(-1));
  const [selected, setSelected] = useState<number | null>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const totalItems = scale.items.length;
  const currentItem = scale.items[step];
  const isLastStep = step === totalItems - 1;
  const progress = step < 0 ? 0 : Math.round(((step + 1) / totalItems) * 100);

  const handleStart = useCallback(() => {
    fireEvent("test_started", sessionId, scale.id);
    setStep(0);
    setSelected(null);
  }, [sessionId, scale.id]);

  const handleNext = useCallback(() => {
    if (selected === null) return;

    const newAnswers = [...answers];
    newAnswers[step] = selected;

    // Check crisis on item 9 (PHQ-9, index 8) — BEFORE anything else
    if (currentItem?.isCrisisItem && selected > 0) {
      fireEvent("crisis_routed", sessionId, scale.id);
      // Store partial result in query for "Continuar" path
      const partialScore = newAnswers
        .slice(0, step)
        .reduce((sum, a) => sum + (a >= 0 ? a : 0), 0) + selected;
      router.push(
        `/crise?sid=${sessionId}&scale=${scale.id}&score=${partialScore}&band=crisis`
      );
      return;
    }

    setAnswers(newAnswers);

    if (isLastStep) {
      const scoreFn = getScoreFn(scale.id);
      const result: ScaleResult = scoreFn(newAnswers);
      fireEvent("test_completed", sessionId, scale.id);
      router.push(
        `/resultado?sid=${sessionId}&scale=${scale.id}&score=${result.totalScore}&band=${result.band}&label=${encodeURIComponent(result.bandLabel)}`
      );
      return;
    }

    setStep((s) => s + 1);
    setSelected(newAnswers[step + 1] >= 0 ? newAnswers[step + 1] : null);
  }, [selected, answers, step, currentItem, isLastStep, sessionId, scale.id, router]);

  // Voltar: revisita a pergunta anterior com a resposta dada (pode corrigir).
  // Não interfere no gate de crise — ele só dispara no "Próxima" do item de crise.
  const handleBack = useCallback(() => {
    if (step <= 0) return;
    const newAnswers = [...answers];
    if (selected !== null) newAnswers[step] = selected; // preserva a escolha atual
    setAnswers(newAnswers);
    setStep((s) => s - 1);
    setSelected(newAnswers[step - 1] >= 0 ? newAnswers[step - 1] : null);
  }, [step, answers, selected]);

  // Navegação por teclado no radiogroup (padrão WAI-ARIA): setas movem foco E seleção.
  const handleOptionKeyDown = useCallback(
    (e: React.KeyboardEvent, idx: number) => {
      const n = scale.options.length;
      let target = -1;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") target = (idx + 1) % n;
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") target = (idx - 1 + n) % n;
      if (target < 0) return;
      e.preventDefault();
      setSelected(scale.options[target].value);
      optionRefs.current[target]?.focus();
    },
    [scale.options]
  );

  // Intro screen
  if (step < 0) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.2em] text-[--coral]">
            {scale.name}
          </p>
          <h1 className="mb-4 font-[--font-playfair] text-3xl font-semibold text-[--foreground]">
            Como você tem se sentido?
          </h1>
          <p className="mb-6 text-[--muted-foreground]">{scale.instructions}</p>

          <ul className="mb-6 space-y-2 text-sm text-[--muted-foreground]">
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[--purple]" aria-hidden />
              {totalItems} {totalItems === 1 ? "pergunta" : "perguntas"} · {scale.timeframe}
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[--purple]" aria-hidden />
              Uma pergunta por tela — você pode voltar e revisar
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[--purple]" aria-hidden />
              Anônimo: nada é gravado sem o seu consentimento
            </li>
          </ul>

          <div className="glass-noir mb-8 rounded-xl p-4 text-sm text-[--muted-foreground]">
            <p className="mb-1 font-medium text-[--foreground]">Antes de começar</p>
            <p>
              Responda com sinceridade sobre como você tem se sentido. Não há respostas certas ou
              erradas — o que importa é o que você realmente está experienciando.
            </p>
          </div>

          <button
            onClick={handleStart}
            className="min-h-[44px] w-full rounded-xl bg-[--purple] py-4 text-lg font-medium text-[--primary-foreground] transition-all hover:bg-[--purple-dark] hover:[box-shadow:0_0_48px_-10px_var(--noir-glow-purple)] focus-visible:outline-2 focus-visible:outline-[--purple] focus-visible:outline-offset-2"
          >
            Começar triagem
          </button>
          <p className="mt-4 text-center text-xs text-[--muted-foreground]">
            Gratuito · Anônimo · Sem cadastro
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col px-4 py-8">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="mb-2 flex justify-between text-xs text-[--muted-foreground]">
          <span>
            {step + 1} de {totalItems}
          </span>
          <span>{progress}%</span>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-[--muted]"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-[--purple] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question — key={step} remonta com animação suave (reduced-motion zera via global) */}
      <div key={step} className="quiz-step-in flex flex-1 flex-col">
        <p className="mb-3 text-xs uppercase tracking-widest text-[--muted-foreground]">
          {scale.timeframe}
        </p>
        <h2 className="mb-8 text-xl font-semibold leading-snug text-[--foreground]">
          {currentItem.text}
        </h2>

        {/* Options */}
        <div className="space-y-3" role="radiogroup" aria-label="Selecione uma opção">
          {scale.options.map((opt, idx) => {
            const isSelected = selected === opt.value;
            return (
              <button
                key={opt.value}
                ref={(el) => {
                  optionRefs.current[idx] = el;
                }}
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelected(opt.value)}
                onKeyDown={(e) => handleOptionKeyDown(e, idx)}
                className={cn(
                  "flex min-h-[44px] w-full items-center gap-3 rounded-xl border-2 px-5 py-4 text-left transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[--purple] focus-visible:outline-offset-2",
                  isSelected
                    ? "border-[--purple] bg-[--secondary] font-medium text-[--purple-dark] [box-shadow:0_0_24px_-8px_var(--noir-glow-purple)]"
                    : "border-[--border] bg-[--card] text-[--foreground] hover:border-[--purple-light]"
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isSelected ? "border-[--purple]" : "border-[--border]"
                  )}
                  aria-hidden
                >
                  {isSelected && <span className="h-2 w-2 rounded-full bg-[--purple]" />}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Voltar / Próxima */}
        <div className="mt-auto flex gap-3 pt-8">
          {step > 0 && (
            <button
              onClick={handleBack}
              className="min-h-[44px] rounded-xl border border-[--border] px-5 py-4 font-medium text-[--muted-foreground] transition-colors hover:border-[--purple-light] hover:text-[--foreground] focus-visible:outline-2 focus-visible:outline-[--purple] focus-visible:outline-offset-2"
            >
              ← Voltar
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={selected === null}
            className={cn(
              "min-h-[44px] flex-1 rounded-xl py-4 text-lg font-medium transition-all focus-visible:outline-2 focus-visible:outline-[--purple] focus-visible:outline-offset-2",
              selected !== null
                ? "bg-[--purple] text-[--primary-foreground] hover:bg-[--purple-dark]"
                : "cursor-not-allowed bg-[--muted] text-[--muted-foreground]"
            )}
            aria-disabled={selected === null}
          >
            {isLastStep ? "Ver resultado" : "Próxima"}
          </button>
        </div>
      </div>
    </main>
  );
}
