import { Suspense } from "react"
import dynamic from "next/dynamic"
import { Header } from "@/components/header"
import { StatsCards, StatsCardsSkeleton } from "@/components/dashboard/stats-cards"
import { AgendaWidget } from "@/components/dashboard/agenda-widget"
import { RemindersWidget } from "@/components/dashboard/reminders-widget"
import { MessagesWidget } from "@/components/dashboard/messages-widget"
import { CheckinWidget } from "@/components/dashboard/checkin-widget"
import { RecentPatientsWidget, RecentPatientsSkeleton } from "@/components/dashboard/recent-patients-widget"
import { getDashboard } from "@/lib/dashboard"

const EvolutionChart = dynamic(
  () => import("@/components/dashboard/evolution-chart").then((m) => m.EvolutionChart),
  { loading: () => <div className="h-[200px] animate-pulse bg-muted rounded-xl" /> }
)

// Busca real (gateway). Isolada em <Suspense> p/ não derrubar o PPR da rota.
async function RecentPatientsSection() {
  const d = await getDashboard()
  return <RecentPatientsWidget data={d.recentes} />
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <Header title="Dashboard" />

      <div className="p-8 space-y-8">
        {/* Stats Overview (dados reais) */}
        <Suspense fallback={<StatsCardsSkeleton />}>
          <StatsCards />
        </Suspense>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - 2 cols */}
          <div className="lg:col-span-2 space-y-8">
            <EvolutionChart />
            <Suspense fallback={<RecentPatientsSkeleton />}>
              <RecentPatientsSection />
            </Suspense>
          </div>

          {/* Right Column - Widgets */}
          <div className="space-y-8">
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
