import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { phq9, gad7, asrs18 } from "@/lib/scales";
import { isScaleAvailable } from "@/lib/scales/gate";
import { QuizFlow } from "./QuizFlow";

export function generateStaticParams() {
  return [{ scaleId: "phq9" }, { scaleId: "gad7" }, { scaleId: "asrs18" }];
}

interface Props {
  params: Promise<{ scaleId: string }>;
}

const SCALES = { phq9, gad7, asrs18 };
const SCALE_METADATA: Record<string, { title: string; description: string }> = {
  phq9: {
    title: "Triagem de Depressão — PHQ-9",
    description: "Responda 9 perguntas sobre como você tem se sentido nas últimas 2 semanas.",
  },
  gad7: {
    title: "Triagem de Ansiedade — GAD-7",
    description: "Responda 7 perguntas sobre como você tem se sentido nas últimas 2 semanas.",
  },
  asrs18: {
    title: "Triagem de TDAH Adulto — ASRS-18",
    description: "Responda 18 perguntas sobre como você se sentiu nos últimos 6 meses.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { scaleId } = await params;
  const meta = SCALE_METADATA[scaleId];
  if (!meta) return {};
  return { title: meta.title, description: meta.description, robots: { index: false } };
}

export default async function TestePage({ params }: Props) {
  const { scaleId } = await params;
  const scale = SCALES[scaleId as keyof typeof SCALES];

  if (!scale) notFound();

  if (!isScaleAvailable(scale)) {
    return (
      <main className="flex min-h-[72vh] items-center justify-center px-4">
        <div className="glass-noir max-w-sm rounded-3xl p-8 text-center">
          <p className="mb-4 text-4xl">🔬</p>
          <h1 className="mb-2 font-display text-2xl font-semibold text-foreground">Em breve</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A triagem de {scale.name} está em fase de validação e será disponibilizada em breve.
          </p>
        </div>
      </main>
    );
  }

  return <QuizFlow scale={scale} />;
}
