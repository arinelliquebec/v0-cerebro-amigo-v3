"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Smile, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

const EMOJIS = ["😣", "😟", "😕", "😐", "🙂", "😌", "😊", "😄", "😁", "🤩"]

export default function HumorPage() {
  const router = useRouter()
  const [humor, setHumor] = useState<number | null>(null)
  const [ansiedade, setAnsiedade] = useState<number | null>(null)
  const [nota, setNota] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [feito, setFeito] = useState(false)
  const [erro, setErro] = useState(false)

  async function registrar() {
    if (humor == null) return
    setEnviando(true)
    setErro(false)
    try {
      const r = await fetch("/api/paciente/humor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ humor, ansiedade, nota: nota || null }),
      })
      if (r.ok) {
        setFeito(true)
        setTimeout(() => router.push("/p"), 1200)
      } else {
        setErro(true)
      }
    } catch {
      setErro(true)
    } finally {
      setEnviando(false)
    }
  }

  if (feito) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8 pt-20 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-success/10 text-success">
          <Check className="h-8 w-8" />
        </div>
        <p className="text-lg font-semibold text-foreground">Humor registrado!</p>
        <p className="text-sm text-muted-foreground">Obrigado por compartilhar.</p>
      </div>
    )
  }

  return (
    <div className="p-4 pt-8 space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
          <Smile className="h-6 w-6 text-primary" /> Como está seu humor?
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">De 1 (muito ruim) a 10 (ótimo)</p>
      </div>

      <div>
        <div className="grid grid-cols-5 gap-2">
          {EMOJIS.map((e, i) => {
            const v = i + 1
            const sel = humor === v
            return (
              <button
                key={v}
                onClick={() => setHumor(v)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition-all ${
                  sel ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <span className="text-2xl">{e}</span>
                <span className={`text-xs font-medium ${sel ? "text-primary" : "text-muted-foreground"}`}>{v}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Ansiedade hoje? (opcional)</p>
        <div className="flex flex-wrap gap-2">
          {[2, 4, 6, 8, 10].map((v) => (
            <button
              key={v}
              onClick={() => setAnsiedade(ansiedade === v ? null : v)}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                ansiedade === v ? "border-primary bg-secondary text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {v <= 2 ? "Baixa" : v <= 6 ? "Média" : "Alta"} ({v})
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="nota" className="text-sm font-medium text-foreground">
          Quer escrever algo? (opcional)
        </label>
        <textarea
          id="nota"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          rows={3}
          placeholder="Como foi seu dia…"
          className="w-full resize-none rounded-xl border border-border bg-card p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />
      </div>

      {erro && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          Não conseguimos salvar seu humor agora. Verifique sua conexão e tente novamente em instantes.
        </p>
      )}

      <Button
        onClick={registrar}
        disabled={humor == null || enviando}
        className="w-full bg-primary hover:bg-purple-dark text-primary-foreground"
      >
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar humor"}
      </Button>
    </div>
  )
}
