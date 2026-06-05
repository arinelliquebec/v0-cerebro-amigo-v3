"use client"

import { useEffect } from "react"

// Marca o médico como online enquanto a rede está aberta: ping a cada 30s
// (e ao voltar o foco da aba). Sem UI. Presença = ping nos últimos 60s.
export function PresencaHeartbeat() {
  useEffect(() => {
    const ping = () => {
      fetch("/api/rede/presenca/ping", { method: "POST" }).catch(() => {})
    }
    ping()
    const id = setInterval(ping, 30_000)
    const onVis = () => {
      if (document.visibilityState === "visible") ping()
    }
    document.addEventListener("visibilitychange", onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [])
  return null
}
