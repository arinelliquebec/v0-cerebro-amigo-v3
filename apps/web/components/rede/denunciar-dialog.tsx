"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const MOTIVOS = [
  { value: "spam", label: "Spam" },
  { value: "assedio", label: "Assédio ou ofensa" },
  { value: "pii_paciente", label: "Dados de paciente expostos" },
  { value: "conduta_cfm", label: "Violação de conduta (CFM)" },
  { value: "outro", label: "Outro" },
]

interface Props {
  alvoTipo: "post" | "comentario" | "mensagem" | "perfil"
  alvoId: string
  trigger: React.ReactNode
}

export function DenunciarDialog({ alvoTipo, alvoId, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [motivo, setMotivo] = useState("")
  const [detalhes, setDetalhes] = useState("")
  const [enviando, setEnviando] = useState(false)

  async function enviar() {
    if (!motivo) { toast.error("Selecione um motivo."); return }
    setEnviando(true)
    try {
      const res = await fetch("/api/rede/moderacao/denuncias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alvoTipo, alvoId, motivo, detalhes: detalhes.trim() || null }),
      })
      if (res.status === 201) {
        toast.success("Denúncia registrada. Obrigado por ajudar a manter a comunidade segura.")
        setOpen(false)
        setMotivo("")
        setDetalhes("")
      } else {
        const data = await res.json().catch(() => null)
        if (data?.error === "crm_nao_verificado") toast.error("Verifique seu CRM para denunciar.")
        else toast.error("Não foi possível registrar a denúncia.")
      }
    } catch {
      toast.error("Erro de conexão.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Denunciar conteúdo</DialogTitle>
          <DialogDescription>
            Sua denúncia será analisada por nossa equipe de moderação.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Motivo</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Detalhes (opcional)</Label>
            <Textarea
              value={detalhes}
              onChange={(e) => setDetalhes(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Descreva o que há de errado com este conteúdo…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={enviar} disabled={enviando}>
            {enviando ? "Enviando…" : "Denunciar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
