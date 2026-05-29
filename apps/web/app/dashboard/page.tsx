import { Header } from "@/components/header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { AgendaWidget } from "@/components/dashboard/agenda-widget"
import { RemindersWidget } from "@/components/dashboard/reminders-widget"
import { MessagesWidget } from "@/components/dashboard/messages-widget"
import { EvolutionChart } from "@/components/dashboard/evolution-chart"
import { CheckinWidget } from "@/components/dashboard/checkin-widget"
import { RecentPatientsWidget } from "@/components/dashboard/recent-patients-widget"

export default function DashboardPage() {
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="min-h-screen">
      <Header title="Dashboard" subtitle={`Olá, Dra. Ana! ${today}`} />
      
      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        <StatsCards />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            <EvolutionChart />
            <RecentPatientsWidget />
          </div>

          {/* Right Column - Widgets */}
          <div className="space-y-6">
            <AgendaWidget />
            <CheckinWidget />
            <MessagesWidget />
            <RemindersWidget />
          </div>
        </div>
      </div>
    </div>
  )
}
