"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pill, ClipboardList, Smile, BellRing, Loader2, Check } from "lucide-react"

interface Conduta {
  id: string
  pacienteId: string
  tipo: string
  config: string // JSON string (config::text do gateway)
  ativa: boolean
  atualizadoEm: string
}

const WEEKDAYS = [
  { v: "0", label: "Segunda" },
  { v: "1", label: "Terça" },
  { v: "2", label: "Quarta" },
  { v: "3", label: "Quinta" },
  { v: "4", label: "Sexta" },
  { v: "5", label: "Sábado" },
  { v: "6", label: "Domingo" },
]

function parseConfig(c?: Conduta): Record<string, unknown> {
  if (!c) return {}
  try {
    return (JSON.parse(c.config) as Record<string, unknown>) || {}
  } catch {
    return {}
  }
}

export function CondutaEditor({ pacienteId }: { pacienteId: string }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  const [medAtivo, setMedAtivo] = useState(true)
  const [medExpira, setMedExpira] = useState(4)
  const [qAtivo, setQAtivo] = useState(true)
  const [qPhq, setQPhq] = useState("0")
  const [qGad, setQGad] = useState("3")
  const [qHora, setQHora] = useState(9)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/pacientes/${pacienteId}/condutas`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Conduta[]) => {
        const map: Record<string, Conduta> = {}
        for (const c of Array.isArray(rows) ? rows : []) map[c.tipo] = c
        const med = parseConfig(map["lembrete_medicacao"])
        setMedAtivo(med.ativo !== false)
        setMedExpira(Number(med.expira_horas ?? 4))
        const q = parseConfig(map["questionario"])
        setQAtivo(q.ativo !== false)
        setQPhq(String(q.phq9_weekday ?? 0))
        setQGad(String(q.gad7_weekday ?? 3))
        setQHora(Number(q.hora_utc ?? 9))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [pacienteId])

  async function salvar(tipo: string, config: Record<string, unknown>) {
    setSaving(tipo)
    setSaved(null)
    try {
      const r = await fetch(`/api/pacientes/${pacienteId}/condutas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, config }),
      })
      if (r.ok) {
        setSaved(tipo)
        setTimeout(() => setSaved(null), 2500)
      }
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Regras operacionais de acompanhamento entre consultas. Sobrescrevem o
        padrão global para este paciente e respeitam a pausa por crise.
      </p>

      {/* Lembrete de medicação */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Pill className="h-4 w-4 text-primary" /> Lembrete de medicação
          </CardTitle>
          <Switch checked={medAtivo} onCheckedChange={setMedAtivo} />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Label className="w-48 text-sm text-muted-foreground">
              Janela de resposta (horas)
            </Label>
            <Input
              type="number"
              min={1}
              max={24}
              value={medExpira}
              onChange={(e) => setMedExpira(Number(e.target.value))}
              className="w-24"
              disabled={!medAtivo}
            />
          </div>
          <SaveRow
            tipo="lembrete_medicacao"
            saving={saving}
            saved={saved}
            onSave={() =>
              salvar("lembrete_medicacao", { ativo: medAtivo, expira_horas: medExpira })
            }
          />
        </CardContent>
      </Card>

      {/* Questionários */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <ClipboardList className="h-4 w-4 text-primary" /> Questionários (PHQ-9 / GAD-7)
          </CardTitle>
          <Switch checked={qAtivo} onCheckedChange={setQAtivo} />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <WeekdayField label="PHQ-9 (depressão)" value={qPhq} onChange={setQPhq} disabled={!qAtivo} />
            <WeekdayField label="GAD-7 (ansiedade)" value={qGad} onChange={setQGad} disabled={!qAtivo} />
          </div>
          <div className="flex items-center gap-3">
            <Label className="w-48 text-sm text-muted-foreground">Horário (UTC)</Label>
            <Input
              type="number"
              min={0}
              max={23}
              value={qHora}
              onChange={(e) => setQHora(Number(e.target.value))}
              className="w-24"
              disabled={!qAtivo}
            />
          </div>
          <SaveRow
            tipo="questionario"
            saving={saving}
            saved={saved}
            onSave={() =>
              salvar("questionario", {
                ativo: qAtivo,
                phq9_weekday: Number(qPhq),
                gad7_weekday: Number(qGad),
                hora_utc: qHora,
              })
            }
          />
        </CardContent>
      </Card>

      {/* Tipos ainda não consumidos pelo agents-py */}
      <div className="grid gap-4 sm:grid-cols-2">
        <EmBreve icon={Smile} titulo="Check-in de humor" />
        <EmBreve icon={BellRing} titulo="Alerta de não-adesão" />
      </div>
    </div>
  )
}

function SaveRow({
  tipo,
  saving,
  saved,
  onSave,
}: {
  tipo: string
  saving: string | null
  saved: string | null
  onSave: () => void
}) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <Button size="sm" onClick={onSave} disabled={saving === tipo} className="h-8">
        {saving === tipo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
      </Button>
      {saved === tipo && (
        <span className="flex items-center gap-1 text-xs text-success">
          <Check className="h-3.5 w-3.5" /> Salvo
        </span>
      )}
    </div>
  )
}

function WeekdayField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {WEEKDAYS.map((d) => (
            <SelectItem key={d.v} value={d.v}>
              {d.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function EmBreve({ icon: Icon, titulo }: { icon: typeof Smile; titulo: string }) {
  return (
    <Card className="border-dashed border-border/60 opacity-70">
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium text-foreground">{titulo}</p>
          <p className="text-xs text-muted-foreground">Em breve</p>
        </div>
      </CardContent>
    </Card>
  )
}
