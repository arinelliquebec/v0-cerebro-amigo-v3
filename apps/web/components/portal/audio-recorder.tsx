"use client"

import { useEffect, useRef, useState } from "react"
import { Mic, Square, Send, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

type Fase = "verificando" | "consent" | "idle" | "gravando" | "enviando" | "ok" | "erro"

function fmtSegundos(s: number) {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, "0")}`
}

export function AudioRecorder() {
  const [fase, setFase] = useState<Fase>("verificando")
  const [segundos, setSegundos] = useState(0)
  const mediaRef  = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch("/api/paciente/audio/consent")
      .then((r) => r.json())
      .then((d) => setFase(d.consentimento ? "idle" : "consent"))
      .catch(() => setFase("idle"))
  }, [])

  async function darConsent() {
    await fetch("/api/paciente/audio/consent", { method: "POST" })
    setFase("idle")
  }

  async function iniciarGravacao() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mr = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" })
    chunksRef.current = []
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.start(250)
    mediaRef.current = mr
    setSegundos(0)
    setFase("gravando")
    timerRef.current = setInterval(() => setSegundos((s) => s + 1), 1000)
  }

  async function pararEEnviar() {
    if (timerRef.current) clearInterval(timerRef.current)
    const mr = mediaRef.current
    if (!mr) return
    setFase("enviando")

    await new Promise<void>((res) => { mr.onstop = () => res(); mr.stop() })
    mr.stream.getTracks().forEach((t) => t.stop())

    const blob = new Blob(chunksRef.current, { type: "audio/webm" })
    const duracaoS = segundos

    try {
      // 1. Presigned URL
      const urlRes = await fetch("/api/paciente/audio/upload-url", { method: "POST" })
      if (!urlRes.ok) throw new Error("upload-url falhou")
      const { uploadUrl, s3Key } = await urlRes.json()

      // 2. PUT direto no S3
      const put = await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": "audio/webm" },
      })
      if (!put.ok) throw new Error("PUT S3 falhou")

      // 3. Registrar no DB
      const reg = await fetch("/api/paciente/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ s3Key, duracaoS }),
      })
      if (!reg.ok) throw new Error("registro falhou")

      setFase("ok")
      setTimeout(() => setFase("idle"), 3000)
    } catch {
      setFase("erro")
      setTimeout(() => setFase("idle"), 3000)
    }
  }

  if (fase === "verificando") return null

  if (fase === "consent") {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">Mensagens de áudio para sua psiquiatra</p>
        <p className="text-xs text-muted-foreground">
          Grave e envie áudios curtos entre as consultas. Os áudios ficam disponíveis por 60 dias
          e só sua psiquiatra pode ouvir.
        </p>
        <Button size="sm" className="w-full" onClick={darConsent}>
          Entendi e quero usar
        </Button>
      </div>
    )
  }

  if (fase === "ok") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success/5 p-4">
        <CheckCircle className="h-5 w-5 text-success shrink-0" />
        <p className="text-sm text-foreground">Áudio enviado para sua psiquiatra.</p>
      </div>
    )
  }

  if (fase === "erro") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
        <p className="text-sm text-foreground">Não consegui enviar. Tente de novo.</p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${fase === "gravando" ? "bg-destructive/10 text-destructive animate-pulse" : "bg-secondary text-primary"}`}>
          <Mic className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {fase === "gravando" ? `Gravando… ${fmtSegundos(segundos)}` : "Mensagem de áudio"}
          </p>
          <p className="text-xs text-muted-foreground">
            {fase === "gravando" ? "Toque em enviar quando terminar" : "Grave um recado para sua psiquiatra"}
          </p>
        </div>
      </div>

      {fase === "enviando" ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : fase === "gravando" ? (
        <Button size="sm" onClick={pararEEnviar} className="gap-1">
          <Send className="h-4 w-4" /> Enviar
        </Button>
      ) : (
        <Button size="icon" variant="ghost" onClick={iniciarGravacao} aria-label="Gravar">
          <Mic className="h-5 w-5 text-primary" />
        </Button>
      )}
    </div>
  )
}
