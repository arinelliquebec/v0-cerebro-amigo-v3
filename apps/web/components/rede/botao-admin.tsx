"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

// Botão de acesso ao painel admin, exibido na lateral direita da home da rede.
// Só aparece para role >= admin (admin | owner). O role vem de /api/me (que
// resolve o cookie httpOnly no servidor — nunca exposto ao client diretamente).
// Renderiza nada até confirmar o role → sem flash do botão para não-admins.
export function BotaoAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let vivo = true
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (vivo && (d?.role === "admin" || d?.role === "owner")) setIsAdmin(true)
      })
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [])

  if (!isAdmin) return null

  return (
    <Button asChild className="w-full gap-2">
      <Link href="/admin">
        <ShieldCheck className="h-4 w-4" /> Admin
      </Link>
    </Button>
  )
}
