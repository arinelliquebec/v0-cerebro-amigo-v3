"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { AlertTriangle, Plus, Loader2, Key, Shield, Users, RefreshCw, Trash2 } from "lucide-react"

interface Usuario {
  id: string
  nome: string
  email: string
  role: string
  ultimoLogin: string | null
  medicoId: string | null
  crm: string | null
  especialidade: string | null
  planoAssinatura: string | null
  statusAssinatura: string | null
}

const ROLE_BADGE: Record<string, string> = {
  owner: "bg-accent/20 text-accent border-accent/30",
  admin: "bg-primary/20 text-primary border-primary/30",
  medico: "bg-muted/50 text-muted-foreground border-border",
}
const ROLE_LABEL: Record<string, string> = {
  owner: "Owner (master)",
  admin: "Admin geral",
  medico: "Médico",
}

function NovoUsuarioDialog({ onCriado }: { onCriado: () => void }) {
  const [open, setOpen] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [role, setRole] = useState("medico")

  async function submeter(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    if (senha.length < 8) return setErro("Senha mínima: 8 caracteres")
    setEnviando(true)
    try {
      const r = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha, role }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) return setErro(d?.error === "email_em_uso" ? "E-mail já cadastrado." : "Erro ao criar usuário.")
      onCriado()
      setOpen(false)
      setNome(""); setEmail(""); setSenha(""); setRole("medico")
    } catch { setErro("Erro de conexão.") }
    finally { setEnviando(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); setErro(null) }}>
      <DialogTrigger asChild>
        <Button variant="coral" className="gap-2">
          <Plus className="h-4 w-4" /> Novo usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={submeter} className="space-y-4">
          {erro && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {erro}
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Senha (mín. 8 chars)</Label>
            <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="medico">Médico</SelectItem>
                <SelectItem value="admin">Admin geral</SelectItem>
                <SelectItem value="owner">Owner (master)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="coral" disabled={enviando}>
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RoleDialog({ u, onSalvo }: { u: Usuario; onSalvo: () => void }) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState(u.role)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar() {
    setErro(null)
    setEnviando(true)
    try {
      const r = await fetch(`/api/admin/usuarios/${u.id}?action=role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) return setErro(d?.error ?? "Erro ao atualizar.")
      onSalvo(); setOpen(false)
    } catch { setErro("Erro de conexão.") }
    finally { setEnviando(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); setErro(null); setRole(u.role) }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" title="Mudar role">
          <Shield className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader><DialogTitle>Mudar role — {u.nome}</DialogTitle></DialogHeader>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="medico">Médico</SelectItem>
            <SelectItem value="admin">Admin geral</SelectItem>
            <SelectItem value="owner">Owner (master)</SelectItem>
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="coral" onClick={salvar} disabled={enviando}>
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ExcluirDialog({ u, onExcluido }: { u: Usuario; onExcluido: () => void }) {
  const [open, setOpen] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function excluir() {
    setErro(null)
    setExcluindo(true)
    try {
      const r = await fetch(`/api/admin/usuarios/${u.id}`, { method: "DELETE" })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        return setErro(d?.error ?? "Erro ao excluir.")
      }
      onExcluido()
      setOpen(false)
    } catch { setErro("Erro de conexão.") }
    finally { setExcluindo(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); setErro(null) }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="Excluir usuário">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" /> Excluir usuário
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Confirma exclusão de <span className="font-semibold text-foreground">{u.nome}</span>?
          Esta ação é irreversível.
        </p>
        {erro && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {erro}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={excluir} disabled={excluindo}>
            {excluindo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SenhaDialog({ u, onSalvo }: { u: Usuario; onSalvo: () => void }) {
  const [open, setOpen] = useState(false)
  const [senha, setSenha] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  async function salvar() {
    setErro(null)
    if (senha.length < 8) return setErro("Mínimo 8 caracteres")
    setEnviando(true)
    try {
      const r = await fetch(`/api/admin/usuarios/${u.id}?action=senha`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ novaSenha: senha }),
      })
      if (!r.ok) return setErro("Erro ao atualizar.")
      setOk(true); setSenha("")
      setTimeout(() => { setOpen(false); setOk(false) }, 1500)
    } catch { setErro("Erro de conexão.") }
    finally { setEnviando(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); setErro(null); setSenha(""); setOk(false) }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" title="Trocar senha">
          <Key className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader><DialogTitle>Nova senha — {u.nome}</DialogTitle></DialogHeader>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        {ok && <p className="text-sm text-success">Senha atualizada!</p>}
        <Input type="password" placeholder="Nova senha (mín. 8 chars)" value={senha} onChange={(e) => setSenha(e.target.value)} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="coral" onClick={salvar} disabled={enviando}>
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [meId, setMeId] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)

  const carregar = useCallback(async () => {
    const r = await fetch("/api/admin/usuarios")
    if (r.ok) setUsuarios(await r.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
    fetch("/api/me").then(r => r.ok ? r.json() : null).then(d => {
      if (d) { setMeId(d.id); setIsOwner(d.role === "owner") }
    })
  }, [carregar])

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-5 w-5 text-primary" />
            <p className="font-mono text-xs uppercase tracking-widest text-primary">Gestão</p>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Usuários</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{usuarios.length} usuário(s) cadastrado(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="glass" size="sm" onClick={carregar} className="gap-1.5">
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
          <NovoUsuarioDialog onCriado={carregar} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="rounded-2xl border border-noir-line bg-noir-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-noir-line bg-noir-surface-raised">
                {["Nome", "E-mail", "Role", "CRM", "Plano", "Último login", "Ações"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-noir-line">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-noir-surface-raised/40 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground">{u.nome}</td>
                  <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3">
                    <Badge className={`border font-mono text-[10px] uppercase ${ROLE_BADGE[u.role] ?? ""}`}>
                      {ROLE_LABEL[u.role] ?? u.role}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{u.crm ?? "—"}</td>
                  <td className="px-5 py-3">
                    {u.planoAssinatura ? (
                      <span className={`text-xs font-medium ${u.statusAssinatura === "ativa" ? "text-success" : "text-muted-foreground"}`}>
                        {u.planoAssinatura} · {u.statusAssinatura}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">sem assinatura</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">
                    {u.ultimoLogin ? new Date(u.ultimoLogin).toLocaleDateString("pt-BR") : "nunca"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <RoleDialog u={u} onSalvo={carregar} />
                      <SenhaDialog u={u} onSalvo={carregar} />
                      {isOwner && u.id !== meId && (
                        <ExcluirDialog u={u} onExcluido={carregar} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
