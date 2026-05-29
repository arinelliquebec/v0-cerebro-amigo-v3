import { Lock, BookOpen } from 'lucide-react'

export function TabNotas() {
  return (
    <section className="rounded-2xl border border-[#00D9C0]/[0.08] bg-[#111818] p-10 text-center">
      <div
        className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#00D9C0]/30 bg-[#00D9C0]/10"
        style={{ boxShadow: '0 0 24px rgba(0, 217, 192, 0.08)' }}
      >
        <Lock size={22} strokeWidth={2} className="text-[#00D9C0]" />
      </div>
      <h2 className="mt-5 text-[24px] font-bold tracking-tight text-[#F5F7F7]">
        Notas privadas
      </h2>
      <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[#D0D5D5]/80">
        Anotações clínicas que só você vê — não vão pro paciente. Em construção
        (próxima sessão).
      </p>
      <p className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-[#00D9C0]/[0.15] bg-[#0A0E0E] px-3 py-1.5 text-[12px] font-medium text-[#9AA8A8]">
        <BookOpen size={13} strokeWidth={2} />
        Em desenvolvimento
      </p>
    </section>
  )
}
