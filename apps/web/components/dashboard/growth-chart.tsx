"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const monthlyData = [
  { month: "Jan", pacientes: 180, checkins: 45, consultas: 120 },
  { month: "Fev", pacientes: 195, checkins: 52, consultas: 135 },
  { month: "Mar", pacientes: 210, checkins: 61, consultas: 145 },
  { month: "Abr", pacientes: 225, checkins: 58, consultas: 152 },
  { month: "Mai", pacientes: 235, checkins: 72, consultas: 160 },
  { month: "Jun", pacientes: 248, checkins: 68, consultas: 165 },
]

export function GrowthChart() {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
      <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorPacientes" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorConsultas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
        <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
          }}
        />
        <Area type="monotone" dataKey="pacientes" stroke="var(--primary)" strokeWidth={2} fill="url(#colorPacientes)" name="Pacientes" />
        <Area type="monotone" dataKey="consultas" stroke="var(--primary)" strokeWidth={2} fill="url(#colorConsultas)" name="Consultas" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
