"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface FunnelStep {
  step: string
  count: number
  percent: number
  drop_off: number
}

interface FunnelChartProps {
  title: string
  steps: FunnelStep[]
}

export default function FunnelChart({ title, steps }: FunnelChartProps) {
  if (!steps || steps.length === 0) return null
  const maxCount = steps[0]?.count || 1

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step, i) => {
          const width = maxCount > 0 ? Math.max((step.count / maxCount) * 100, 8) : 8
          return (
            <div key={step.step}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium truncate mr-2">{step.step}</span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                  <span>{step.count.toLocaleString()}</span>
                  <span className="font-medium">{step.percent.toFixed(1)}%</span>
                </div>
              </div>
              <div className="relative">
                <div
                  className="h-7 rounded-md bg-violet-500/80 flex items-center justify-end pr-2 transition-all"
                  style={{ width: `${width}%` }}
                >
                  {step.count > 0 && (
                    <span className="text-[10px] text-white font-medium">{step.count.toLocaleString()}</span>
                  )}
                </div>
              </div>
              {i > 0 && step.drop_off > 0 && (
                <p className="text-[11px] text-red-400 mt-0.5 ml-1">
                  -{step.drop_off.toFixed(1)}% drop-off
                </p>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
