import dynamic from "next/dynamic"
import { Header } from "@/components/header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { AgendaWidget } from "@/components/dashboard/agenda-widget"
import { RemindersWidget } from "@/components/dashboard/reminders-widget"
import { MessagesWidget } from "@/components/dashboard/messages-widget"
import { CheckinWidget } from "@/components/dashboard/checkin-widget"
import { RecentPatientsWidget } from "@/components/dashboard/recent-patients-widget"

const EvolutionChart = dynamic(
  () => import("@/components/dashboard/evolution-chart").then((m) => m.EvolutionChart),
  { loading: () => <div className="h-[200px] animate-pulse bg-muted rounded-xl" /> }
)

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <Header title="Dashboard" />

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
