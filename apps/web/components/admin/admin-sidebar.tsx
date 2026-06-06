"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { LayoutDashboard, Users, CreditCard, TrendingUp, LogOut, Stethoscope, Settings, ShieldCheck, FileText, Activity, LineChart, ShieldAlert, Eye, Scale } from "lucide-react"
import { logoutAction } from "@/app/admin/actions"

const nav = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { href: "/admin/receita", label: "Receita", icon: LineChart },
  { href: "/admin/financeiro", label: "Financeiro", icon: CreditCard },
  { href: "/admin/crises", label: "Supervisão de crise", icon: ShieldAlert },
  { href: "/admin/acessos", label: "Trilha de acesso", icon: Eye },
  { href: "/admin/lgpd", label: "Direitos do titular", icon: Scale },
  { href: "/admin/custos", label: "Custos de IA", icon: TrendingUp },
  { href: "/admin/agentes", label: "Agentes", icon: Activity },
  { href: "/admin/prompts", label: "Prompts", icon: FileText },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
]

export function AdminSidebar() {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-noir-line bg-noir-surface shadow-[2px_0_16px_rgba(7,7,13,0.35)]">
      {/* Logo + badge */}
      <div className="flex h-16 items-center gap-2.5 border-b border-noir-line px-5">
        <Logo size="sm" variant="light" showText={false} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">Cérebro Amigo</p>
          <p className="flex items-center gap-1 text-[10px] font-medium text-accent">
            <ShieldCheck className="h-2.5 w-2.5" /> Admin Master
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-5">
        <p className="px-3 pb-3 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/40">
          Painel
        </p>
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href, item.exact) ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-all duration-200",
              "focus-visible:ring-2 focus-visible:ring-primary/40",
              isActive(item.href, item.exact)
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "text-muted-foreground hover:bg-noir-surface-raised hover:text-foreground",
            )}
          >
            <item.icon
              className={cn(
                "h-[18px] w-[18px] shrink-0 transition-all",
                isActive(item.href, item.exact)
                  ? "text-primary-foreground"
                  : "text-muted-foreground/60 group-hover:text-primary",
              )}
            />
            {item.label}
          </Link>
        ))}

        <div className="pt-4">
          <p className="px-3 pb-3 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/40">
            Atalhos
          </p>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-noir-surface-raised hover:text-foreground"
          >
            <Stethoscope className="h-[18px] w-[18px] shrink-0 text-muted-foreground/60" />
            Dashboard médico
          </Link>
        </div>
      </nav>

      {/* Logout */}
      <div className="border-t border-noir-line px-3 py-4">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}
