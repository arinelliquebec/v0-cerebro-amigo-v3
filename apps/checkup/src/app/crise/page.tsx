"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CriseContent() {
  const searchParams = useSearchParams();
  const sid = searchParams.get("sid");
  const scale = searchParams.get("scale");
  const score = searchParams.get("score") ?? "0";
  const band = searchParams.get("band") ?? "severe";

  const continueHref =
    sid && scale
      ? `/resultado?sid=${sid}&scale=${scale}&score=${score}&band=${band}&label=${encodeURIComponent("sintomas graves")}&crisis=true`
      : null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[#F8FAFC]">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[#1E293B] mb-3 leading-snug">
            Você não precisa passar por isso sozinho
          </h1>
          <p className="text-[#475569] leading-relaxed">
            Responder essa pergunta com honestidade exige coragem. Há pessoas disponíveis
            agora para conversar, sem julgamento.
          </p>
        </div>

        <div className="space-y-3 mb-8">
          <a
            href="tel:188"
            className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#94A3B8] transition-colors min-h-[44px]"
          >
            <span className="text-2xl">📞</span>
            <div>
              <p className="font-semibold text-[#1E293B]">CVV — 188</p>
              <p className="text-sm text-[#64748B]">Ligação gratuita, 24 horas por dia</p>
            </div>
          </a>

          <a
            href="https://cvv.org.br"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#94A3B8] transition-colors min-h-[44px]"
          >
            <span className="text-2xl">💬</span>
            <div>
              <p className="font-semibold text-[#1E293B]">Chat CVV</p>
              <p className="text-sm text-[#64748B]">cvv.org.br — disponível 24h</p>
            </div>
          </a>

          <a
            href="tel:192"
            className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#94A3B8] transition-colors min-h-[44px]"
          >
            <span className="text-2xl">🚑</span>
            <div>
              <p className="font-semibold text-[#1E293B]">SAMU — 192</p>
              <p className="text-sm text-[#64748B]">Emergência médica, 24 horas</p>
            </div>
          </a>

          <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-[#E2E8F0]">
            <span className="text-2xl">🏥</span>
            <div>
              <p className="font-semibold text-[#1E293B]">CAPS ou pronto-socorro</p>
              <p className="text-sm text-[#64748B]">
                Se você estiver em perigo imediato, vá ao pronto-socorro mais próximo
                ou peça para alguém de confiança te acompanhar agora.
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-[#64748B] text-center mb-6">
          Contar para alguém de confiança o que você está sentindo também pode ajudar.
        </p>

        {continueHref && (
          <div className="border-t border-[#E2E8F0] pt-6">
            <p className="text-xs text-[#94A3B8] text-center mb-4">
              Quando você quiser, pode ver o restante do seu resultado.
            </p>
            <Link
              href={continueHref}
              className="block text-center py-3 px-6 text-sm text-[#64748B] hover:text-[#1E293B] rounded-xl border border-[#E2E8F0] transition-colors"
            >
              Continuar quando você quiser
            </Link>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/" className="text-xs text-[#94A3B8] hover:text-[#64748B]">
            ← Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function CrisePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center px-4 bg-[#F8FAFC]">
        <p className="text-[#64748B]">Carregando...</p>
      </main>
    }>
      <CriseContent />
    </Suspense>
  );
}
