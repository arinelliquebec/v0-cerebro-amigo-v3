import { z } from "zod";
import type { ScaleId } from "@/lib/scales/types";

export const DevolutivaSchema = z.object({
  acolhimento: z.string().min(10).max(400),
  leitura: z.array(z.string().min(5)).min(1).max(5),
  limites: z.string().min(10).max(300),
  proximos_passos: z.array(z.string().min(5)).min(1).max(5),
});

export type Devolutiva = z.infer<typeof DevolutivaSchema>;

export interface DevolutivaInput {
  scaleId: ScaleId;
  totalScore: number;
  band: string;
  bandLabel: string;
  partAPositives?: number;
}

// Palavras proibidas na saída — fallback imediato se aparecerem
const PROHIBITED = [
  /você tem\s+\w/i,
  /você sofre de/i,
  /diagnóstico/i,
  /doença confirmada/i,
  /comprimido|dosage|remédio\s+\w/i,
];

export function containsProhibitedContent(text: string): boolean {
  return PROHIBITED.some((re) => re.test(text));
}

export function devolutivaHasProhibitedContent(d: Devolutiva): boolean {
  const all = [d.acolhimento, d.limites, ...d.leitura, ...d.proximos_passos].join(" ");
  return containsProhibitedContent(all);
}
