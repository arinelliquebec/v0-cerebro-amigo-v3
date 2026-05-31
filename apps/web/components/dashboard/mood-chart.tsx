"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const weeklyMoodData = [
  { day: "Seg", muitoBem: 8, bem: 12, neutro: 3, mal: 1 },
  { day: "Ter", muitoBem: 10, bem: 10, neutro: 4, mal: 0 },
  { day: "Qua", muitoBem: 7, bem: 14, neutro: 2, mal: 2 },
  { day: "Qui", muitoBem: 12, bem: 8, neutro: 3, mal: 1 },
  { day: "Sex", muitoBem: 15, bem: 7, neutro: 1, mal: 1 },
  { day: "Sáb", muitoBem: 6, bem: 5, neutro: 2, mal: 0 },
  { day: "Dom", muitoBem: 4, bem: 4, neutro: 1, mal: 0 },
]

export function MoodChart() {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
      <BarChart data={weeklyMoodData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="day" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
        <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
          }}
        />
        <Bar dataKey="muitoBem" stackId="a" fill="var(--success)" name="Muito bem" radius={[0, 0, 0, 0]} />
        <Bar dataKey="bem" stackId="a" fill="var(--primary)" name="Bem" />
        <Bar dataKey="neutro" stackId="a" fill="var(--warning)" name="Neutro" />
        <Bar dataKey="mal" stackId="a" fill="var(--coral)" name="Mal" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
