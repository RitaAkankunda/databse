"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Calendar, Wrench } from "lucide-react"

type Stat = { title: string; value: React.ReactNode; subtitle?: string; icon?: React.ReactNode }

export default function StatsCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="mb-6 grid gap-6 md:grid-cols-4">
      {stats.map((s, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">{s.title}</h3>
            <div>{s.icon ?? <Calendar className="h-4 w-4 text-blue-600" />}</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{s.value}</div>
            <p className="text-xs text-muted-foreground">{s.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
