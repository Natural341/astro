"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CohortRow {
  month: string
  cohort_size: number
  retention: Record<string, number>
}

interface CohortTableProps {
  cohorts: CohortRow[]
}

function getColor(value: number): string {
  if (value >= 60) return "bg-emerald-500/80 text-white"
  if (value >= 40) return "bg-emerald-500/50 text-white"
  if (value >= 25) return "bg-yellow-500/50 text-white"
  if (value >= 10) return "bg-orange-500/40 text-white"
  if (value > 0) return "bg-red-500/30 text-white"
  return "bg-muted/30 text-muted-foreground"
}

export default function CohortTable({ cohorts }: CohortTableProps) {
  const periods = ["D1", "D7", "D14", "D30"]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">Cohort Retention</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Month</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Cohort</th>
                {periods.map((p) => (
                  <th key={p} className="text-center py-2 px-3 font-medium text-muted-foreground">{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.map((c) => (
                <tr key={c.month} className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium">{c.month}</td>
                  <td className="py-2 px-3 text-right text-muted-foreground">{c.cohort_size.toLocaleString()}</td>
                  {periods.map((p) => {
                    const val = c.retention[p] ?? 0
                    return (
                      <td key={p} className="py-1.5 px-1.5 text-center">
                        <span className={`inline-block w-full py-1 rounded text-xs font-medium ${getColor(val)}`}>
                          {val > 0 ? `${val.toFixed(1)}%` : "—"}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
