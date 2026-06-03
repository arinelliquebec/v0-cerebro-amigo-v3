"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Loader2, Check } from "lucide-react"

interface Config {
  timezone: string
  horarioTrabalho: string // JSON string
  notifPrefs: string // JSON string
}

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [timezone, setTimezone] = useState("America/Sao_Paulo")
  const [inicio, setInicio] = useState("08:00")
  const [fim, setFim] = useState("18:00")
  const [criseEmail, setCriseEmail] = useState(false)

  useEffect(() => {
    fetch("/api/configuracoes")
      .then((r) => (r.ok ? r.json() : null))
      .then((c: Config | null) => {
        if (!c) return
        setTimezone(c.timezone || "America/Sao_Paulo")
        try {
          const h = JSON.parse(c.horarioTrabalho || "{}")
          if (h.inicio) setInicio(h.inicio)
          if (h.fim) setFim(h.fim)
        } catch {}
        try {
          const p = JSON.parse(c.notifPrefs || "{}")
          setCriseEmail(Boolean(p.crise_email))
        } catch {}
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function salvar() {
    setSaving(true)
    setSaved(false)
    try {
      const r = await fetch("/api/configuracoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timezone,
          horarioTrabalho: { inicio, fim },
          notifPrefs: { crise_email: criseEmail },
        }),
      })
      if (r.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header title="Configurações" subtitle="Preferências da sua conta" />

      <div className="max-w-2xl p-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Geral</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Fuso horário</Label>
                  <Input
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    placeholder="America/Sao_Paulo"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Início do expediente</Label>
                    <Input type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Fim do expediente</Label>
                    <Input type="time" value={fim} onChange={(e) => setFim(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Notificações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Receber e-mail em crise</p>
                    <p className="text-xs text-muted-foreground">
                      Aviso fora do app quando um paciente entra em protocolo de crise.
                    </p>
                  </div>
                  <Switch checked={criseEmail} onCheckedChange={setCriseEmail} />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3">
              <Button onClick={salvar} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar alterações"}
              </Button>
              {saved && (
                <span className="flex items-center gap-1 text-sm text-success">
                  <Check className="h-4 w-4" /> Salvo
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
