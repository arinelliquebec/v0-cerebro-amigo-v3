import { Bell } from 'lucide-react'

const PACIENTES = [
  { nome: 'Ana Beatriz', cor: '#00D9C0', ativo: true },
  { nome: 'Carlos Mendes', cor: '#a855f7', ativo: false },
  { nome: 'Juliana Rocha', cor: '#f59e0b', ativo: false },
  { nome: 'Pedro Almeida', cor: '#60a5fa', ativo: false },
  { nome: 'Mariana Lima', cor: '#f87171', ativo: false },
  { nome: 'Rafael Souza', cor: '#34d399', ativo: false },
]

const DIAS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']
const R = 32
const C = 2 * Math.PI * R

/** Mockup do dashboard médico (Hero da landing). React/SVG, PT-BR, nítido em qualquer tela. */
export function DashboardMockupHero() {
  return (
    <div className="w-full select-none bg-[#0A0E0E] p-2.5 text-left">
      {/* Topbar */}
      <div className="mb-2.5 flex items-center justify-between rounded-xl border border-[#00D9C0]/10 bg-[#111818] px-3 py-2">
        <div className="flex items-center gap-1.5">
          <svg width="16" height="16" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2L3 9V19L14 26L25 19V9L14 2Z" stroke="#00D9C0" strokeWidth="1.5" fill="rgba(0,217,192,0.08)" />
          </svg>
          <span className="text-[12px] font-semibold tracking-tight text-[#F5F7F7]">
            Cérebro<span className="text-[#00D9C0]"> Amigo</span>
          </span>
        </div>
        <div className="relative">
          <Bell size={15} className="text-[#9AA8A8]" />
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#00D9C0]" />
        </div>
      </div>

      <div className="grid grid-cols-[0.85fr_1.7fr_1.05fr] gap-2.5">
        {/* Lista de pacientes */}
        <div className="space-y-1 rounded-xl border border-[#00D9C0]/10 bg-[#111818] p-2">
          {PACIENTES.map((p) => (
            <div
              key={p.nome}
              className={`flex items-center gap-1.5 rounded-lg px-1.5 py-1 ${p.ativo ? 'border-l-2 border-[#00D9C0] bg-[#00D9C0]/10' : ''}`}
            >
              <span
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[9px] font-bold"
                style={{ background: p.cor + '22', color: p.cor, border: `1px solid ${p.cor}55` }}
              >
                {p.nome.split(' ').map((n) => n[0]).join('')}
              </span>
              <span className={`truncate text-[11px] ${p.ativo ? 'font-medium text-[#F5F7F7]' : 'text-[#9AA8A8]'}`}>
                {p.nome}
              </span>
            </div>
          ))}
        </div>

        {/* Gráfico de humor */}
        <div className="rounded-xl border border-[#00D9C0]/10 bg-[#111818] p-2.5">
          <div className="mb-2 text-[13px] font-semibold tracking-tight text-[#F5F7F7]">
            Humor — últimos 7 dias
          </div>
          <div className="mb-2 flex gap-1">
            {['Neutro', 'Bom', 'Ótimo'].map((l) => (
              <span key={l} className="rounded border border-[#00D9C0]/[0.08] bg-[#0A0E0E] px-1.5 py-0.5 text-[9px] text-[#9AA8A8]">
                {l}
              </span>
            ))}
          </div>
          <svg viewBox="0 0 300 120" className="w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="moodFillHero" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00D9C0" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#00D9C0" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="0" y1="30" x2="300" y2="30" stroke="#00D9C0" strokeOpacity="0.05" />
            <line x1="0" y1="60" x2="300" y2="60" stroke="#00D9C0" strokeOpacity="0.05" />
            <line x1="0" y1="90" x2="300" y2="90" stroke="#00D9C0" strokeOpacity="0.05" />
            <path
              d="M0,95 C25,92 40,80 60,80 C85,80 95,62 120,64 C145,66 150,40 180,48 C205,54 215,52 240,40 C265,30 285,22 300,18 L300,120 L0,120 Z"
              fill="url(#moodFillHero)"
            />
            <path
              d="M0,95 C25,92 40,80 60,80 C85,80 95,62 120,64 C145,66 150,40 180,48 C205,54 215,52 240,40 C265,30 285,22 300,18"
              fill="none"
              stroke="#00D9C0"
              strokeWidth="2.5"
            />
          </svg>
          <div className="mt-1 flex justify-between text-[9px] text-[#9AA8A8]">
            {DIAS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </div>

        {/* Painel direito */}
        <div className="space-y-2.5">
          <div className="rounded-xl border border-[#00D9C0]/10 bg-[#111818] p-2">
            <div className="mb-1.5 text-[11px] font-semibold text-[#F5F7F7]">
              Entradas recentes do diário
            </div>
            <div className="space-y-1.5">
              <div>
                <div className="text-[9px] font-medium text-[#00D9C0]">Ana Beatriz</div>
                <div className="text-[9px] leading-snug text-[#9AA8A8]">
                  &ldquo;Me senti melhor hoje depois da meditação. Menos ansiosa.&rdquo;
                </div>
              </div>
              <div>
                <div className="text-[9px] font-medium text-[#00D9C0]">Carlos Mendes</div>
                <div className="text-[9px] leading-snug text-[#9AA8A8]">
                  &ldquo;Dificuldade pra dormir. Comecei rotina nova, mais energia.&rdquo;
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-[#00D9C0]/10 bg-[#111818] p-2">
            <div className="mb-1 self-start text-[11px] font-semibold text-[#F5F7F7]">
              Adesão à medicação
            </div>
            <svg viewBox="0 0 80 80" className="h-20 w-20">
              <circle cx="40" cy="40" r={R} fill="none" stroke="#00D9C0" strokeOpacity="0.12" strokeWidth="7" />
              <circle
                cx="40"
                cy="40"
                r={R}
                fill="none"
                stroke="#00D9C0"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${C * 0.92} ${C}`}
                transform="rotate(-90 40 40)"
              />
              <text x="40" y="45" textAnchor="middle" fill="#00D9C0" fontSize="17" fontWeight="700" fontFamily="Inter, sans-serif">
                92%
              </text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
