"use client";

import { useState, useCallback, useId } from "react";
import { useRouter } from "next/navigation";
import type { Scale, ScaleResult } from "@/lib/scales/types";
import { scorePhq9 } from "@/lib/scales/phq9";
import { scoreGad7 } from "@/lib/scales/gad7";
import { cn } from "@/lib/utils";

function getScoreFn(scaleId: string) {
  if (scaleId === "phq9") return scorePhq9;
  if (scaleId === "gad7") return scoreGad7;
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
  const sessionId = useId().replace(/:/g, "").slice(0, 32).padEnd(32, "0");
  // stable session per mount: generated once via useId
  const [stableSessionId] = useState(() => crypto.randomUUID());

  const [step, setStep] = useState(-1); // -1 = intro
  const [answers, setAnswers] = useState<number[]>(new Array(scale.items.length).fill(-1));
  const [selected, setSelected] = useState<number | null>(null);
  const [started, setStarted] = useState(false);

  const totalItems = scale.items.length;
  const currentItem = scale.items[step];
  const isLastStep = step === totalItems - 1;
  const progress = step < 0 ? 0 : Math.round(((step + 1) / totalItems) * 100);

  const handleStart = useCallback(() => {
    fireEvent("test_started", stableSessionId, scale.id);
    setStarted(true);
    setStep(0);
    setSelected(null);
  }, [stableSessionId, scale.id]);

  const handleNext = useCallback(() => {
    if (selected === null) return;

    const newAnswers = [...answers];
    newAnswers[step] = selected;

    // Check crisis on item 9 (PHQ-9, index 8) — BEFORE anything else
    if (currentItem?.isCrisisItem && selected > 0) {
      fireEvent("crisis_routed", stableSessionId, scale.id);
      // Store partial result in query for "Continuar" path
      const partialScore = newAnswers
        .slice(0, step)
        .reduce((sum, a) => sum + (a >= 0 ? a : 0), 0) + selected;
      router.push(
        `/crise?sid=${stableSessionId}&scale=${scale.id}&score=${partialScore}&band=crisis`
      );
      return;
    }

    setAnswers(newAnswers);

    if (isLastStep) {
      const scoreFn = getScoreFn(scale.id);
      const result: ScaleResult = scoreFn(newAnswers);
      fireEvent("test_completed", stableSessionId, scale.id);
      router.push(
        `/resultado?sid=${stableSessionId}&scale=${scale.id}&score=${result.totalScore}&band=${result.band}&label=${encodeURIComponent(result.bandLabel)}`
      );
      return;
    }

    setAnswers(newAnswers);
    setStep((s) => s + 1);
    setSelected(null);
  }, [selected, answers, step, currentItem, isLastStep, stableSessionId, scale.id, router]);

  // Intro screen
  if (step < 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <p className="text-sm font-medium text-[--purple] uppercase tracking-widest mb-3">
            {scale.name}
          </p>
          <h1 className="font-[--font-playfair] text-3xl font-semibold text-[--navy] mb-4">
            {scale.name === "PHQ-9" ? "Como você tem se sentido?" : "Como você tem se sentido?"}
          </h1>
          <p className="text-[--muted-foreground] mb-2">{scale.instructions}</p>
          <p className="text-sm text-[--muted-foreground] mb-8">
            {totalItems} {totalItems === 1 ? "pergunta" : "perguntas"} · {scale.timeframe}
          </p>
          <div className="bg-[--muted] rounded-xl p-4 mb-8 text-sm text-[--muted-foreground]">
            <p className="font-medium text-[--foreground] mb-1">Antes de começar</p>
            <p>
              Responda com sinceridade sobre como você tem se sentido. Não há respostas certas ou
              erradas — o que importa é o que você realmente está experienciando.
            </p>
          </div>
          <button
            onClick={handleStart}
            className="w-full py-4 bg-[--purple] text-white rounded-xl font-medium text-lg hover:bg-[--purple-dark] transition-colors focus-visible:outline-2 focus-visible:outline-[--purple] focus-visible:outline-offset-2 min-h-[44px]"
          >
            Começar triagem
          </button>
          <p className="text-center text-xs text-[--muted-foreground] mt-4">
            Gratuito · Anônimo · Sem cadastro
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col px-4 py-8 max-w-md mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-[--muted-foreground] mb-2">
          <span>
            {step + 1} de {totalItems}
          </span>
          <span>{progress}%</span>
        </div>
        <div
          className="w-full h-1.5 bg-[--muted] rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-[--purple] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col">
        <p className="text-xs text-[--muted-foreground] uppercase tracking-widest mb-3">
          {scale.timeframe}
        </p>
        <h2 className="text-xl font-semibold text-[--navy] leading-snug mb-8">
          {currentItem.text}
        </h2>

        {/* Options */}
        <div className="space-y-3" role="radiogroup" aria-label="Selecione uma opção">
          {scale.options.map((opt) => (
            <button
              key={opt.value}
              role="radio"
              aria-checked={selected === opt.value}
              onClick={() => setSelected(opt.value)}
              className={cn(
                "w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-150 min-h-[44px] focus-visible:outline-2 focus-visible:outline-[--purple] focus-visible:outline-offset-2",
                selected === opt.value
                  ? "border-[--purple] bg-[--secondary] text-[--purple-dark] font-medium"
                  : "border-[--border] bg-white text-[--foreground] hover:border-[--purple-light]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Next button */}
        <div className="mt-auto pt-8">
          <button
            onClick={handleNext}
            disabled={selected === null}
            className={cn(
              "w-full py-4 rounded-xl font-medium text-lg transition-all min-h-[44px] focus-visible:outline-2 focus-visible:outline-[--purple] focus-visible:outline-offset-2",
              selected !== null
                ? "bg-[--purple] text-white hover:bg-[--purple-dark]"
                : "bg-[--muted] text-[--muted-foreground] cursor-not-allowed"
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
