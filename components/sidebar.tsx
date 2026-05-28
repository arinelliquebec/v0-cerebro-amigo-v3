"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  FileText,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Heart,
  TrendingUp,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Pacientes", href: "/dashboard/pacientes", icon: Users },
  { name: "Agenda", href: "/dashboard/agenda", icon: Calendar },
  { name: "Mensagens", href: "/dashboard/mensagens", icon: MessageSquare },
  { name: "Prontuários", href: "/dashboard/prontuarios", icon: FileText },
  { name: "Evolução", href: "/dashboard/evolucao", icon: TrendingUp },
  { name: "Check-ins", href: "/dashboard/checkins", icon: Heart },
]

const secondaryNavigation = [
  { name: "Lembretes", href: "/dashboard/lembretes", icon: Bell },
  { name: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        <Logo showText={!collapsed} size={collapsed ? "sm" : "md"} />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Menu
          </p>
        )}
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-all duration-200",
                "focus-visible:ring-2 focus-visible:ring-[#0D9488]/40 focus-visible:ring-offset-1 focus-visible:ring-offset-card",
                isActive
                  ? "bg-[#0D9488] text-white shadow-sm shadow-[#0D9488]/25"
                  : "text-muted-foreground hover:bg-secondary hover:text-[#0D9488]",
                collapsed && "justify-center px-2"
              )}
            >
              {isActive && !collapsed && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-white/80" />
              )}
              <item.icon
                className={cn(
                  "h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive && "text-white"
                )}
              />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Secondary Navigation */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        {secondaryNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-all duration-200",
                "focus-visible:ring-2 focus-visible:ring-[#0D9488]/40 focus-visible:ring-offset-1 focus-visible:ring-offset-card",
                isActive
                  ? "bg-[#0D9488] text-white shadow-sm shadow-[#0D9488]/25"
                  : "text-muted-foreground hover:bg-secondary hover:text-[#0D9488]",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive && "text-white"
                )}
              />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}

        {/* Logout */}
        <button
          className={cn(
            "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-all duration-200",
            "text-muted-foreground hover:bg-red-50 hover:text-red-600",
            "focus-visible:ring-2 focus-visible:ring-red-400/40 focus-visible:ring-offset-1 focus-visible:ring-offset-card",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>

      {/* User Profile */}
      {!collapsed && (
        <div className="px-3 py-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-9 w-9 rounded-full bg-[#0D9488] flex items-center justify-center text-white font-medium text-sm">
              DR
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                Dra. Ana Silva
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Psiquiatra
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
