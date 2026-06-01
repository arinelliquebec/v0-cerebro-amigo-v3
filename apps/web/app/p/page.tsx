import Link from "next/link"
import { redirect } from "next/navigation"
import { BookText, Pill, CalendarClock, Smile, ChevronRight, LogOut, MessageCircle } from "lucide-react"
import { gatewayPaciente, GatewayPacienteError } from "@/lib/gateway-paciente"
import { Button } from "@/components/ui/button"
import { sairPaciente } from "./entrar/actions"

interface HomeData {
  perfil: { nome: string; nomeMedico: string }
  tomadasHoje: { id: string; horarioPrevisto: string; status: string; medicamento: string; dose: string }[]
  proxConsulta: { iniciaEm: string; modalidade: string; status: string } | null
  ultimoHumor: number | null
  jaRegistrouHumorHoje: boolean
}

function horaCurta(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

export default async function PortalHome() {
  let data: HomeData
  try {
    data = await gatewayPaciente.get<HomeData>("/api/v1/portal/paciente/home")
  } catch (err) {
    if (err instanceof GatewayPacienteError && (err.status === 401 || err.status === 403)) {
      redirect("/p/entrar")
    }
    throw err
  }

  const primeiroNome = data.perfil.nome?.split(" ")[0] || "Olá"
  const pendentesHoje = data.tomadasHoje.filter((t) => t.status === "pendente")

  return (
    <div className="p-4 pt-8 space-y-5">
      {/* Saudação */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Olá, {primeiroNome}</h1>
          {data.perfil.nomeMedico && (
            <p className="text-sm text-muted-foreground mt-0.5">
              Acompanhamento com {data.perfil.nomeMedico}
            </p>
          )}
        </div>
        <form action={sairPaciente}>
          <Button variant="ghost" size="icon" className="text-muted-foreground" type="submit" aria-label="Sair">
            <LogOut className="h-5 w-5" />
          </Button>
        </form>
      </div>

      {/* Humor de hoje */}
      <Link
        href="/p/diario/nova"
        className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4"
      >
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
          <Smile className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-navy">
            {data.jaRegistrouHumorHoje ? "Humor registrado hoje" : "Como você está hoje?"}
          </p>
          <p className="text-xs text-muted-foreground">
            {data.jaRegistrouHumorHoje
              ? "Obrigado por compartilhar."
              : "Registre seu humor no diário"}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      {/* Medicações de hoje */}
      <section className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-navy">
            <Pill className="h-4 w-4 text-primary" /> Medicações de hoje
          </h2>
          <Link href="/p/medicacoes" className="text-xs text-primary">ver todas</Link>
        </div>
        {data.tomadasHoje.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma medicação para hoje.</p>
        ) : (
          <ul className="space-y-2">
            {data.tomadasHoje.slice(0, 4).map((t) => (
              <li key={t.id} className="flex items-center justify-between text-sm">
                <span className="text-navy">
                  {t.medicamento} <span className="text-muted-foreground">· {t.dose}</span>
                </span>
                <span className={t.status === "pendente" ? "text-warning" : "text-success"}>
                  {horaCurta(t.horarioPrevisto)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {pendentesHoje.length > 0 && (
          <p className="text-xs text-warning">{pendentesHoje.length} pendente(s) hoje</p>
        )}
      </section>

      {/* Próxima consulta */}
      {data.proxConsulta && (
        <section className="rounded-2xl border border-border/60 bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-navy mb-1">
            <CalendarClock className="h-4 w-4 text-primary" /> Próxima consulta
          </h2>
          <p className="text-sm text-navy">
            {new Date(data.proxConsulta.iniciaEm).toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}{" "}
            às {horaCurta(data.proxConsulta.iniciaEm)}
          </p>
          <p className="text-xs text-muted-foreground capitalize">{data.proxConsulta.modalidade}</p>
        </section>
      )}

      {/* Atalho conversa */}
      <Link
        href="/p/conversa"
        className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4"
      >
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-navy">Conversar</p>
          <p className="text-xs text-muted-foreground">Desabafe; sua psiquiatra é avisada se houver risco</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      {/* Atalho diário */}
      <Link
        href="/p/diario"
        className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4"
      >
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary">
          <BookText className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-navy">Meu diário</p>
          <p className="text-xs text-muted-foreground">Registre como foi seu dia, por texto ou voz</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </div>
  )
}
