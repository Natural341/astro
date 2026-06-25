"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { ResponsiveContainer, AreaChart, Area } from "recharts"

interface KPICardProps {
  name: string
  value: number | string
  change?: number
  suffix?: string
  inverse?: boolean
  trend?: { date: string; value: number }[]
}

export default function KPICard({ name, value, change = 0, suffix, inverse, trend }: KPICardProps) {
  const isPositive = inverse ? change < 0 : change > 0
  const isNegative = inverse ? change > 0 : change < 0
  const formattedValue = typeof value === "number"
    ? suffix === "₺" ? value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : suffix === "%" ? value.toFixed(1)
    : value.toLocaleString()
    : value

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{name}</p>
        <div className="flex items-end justify-between mt-1">
          <div>
            <span className="text-2xl font-bold font-heading">
              {formattedValue}{suffix && <span className="text-sm ml-0.5 font-normal text-muted-foreground">{suffix}</span>}
            </span>
            {change !== 0 && (
              <p className="flex items-center gap-1 text-xs mt-1">
                {isPositive && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                {isNegative && <TrendingDown className="h-3 w-3 text-red-500" />}
                {!isPositive && !isNegative && <Minus className="h-3 w-3 text-muted-foreground" />}
                <span className={isPositive ? "text-emerald-500 font-medium" : isNegative ? "text-red-500 font-medium" : "text-muted-foreground"}>
                  {change > 0 ? "+" : ""}{change.toFixed(1)}%
                </span>
              </p>
            )}
          </div>
          {trend && trend.length > 1 && (
            <div className="w-20 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={isPositive ? "#10b981" : isNegative ? "#ef4444" : "#8b5cf6"}
                    fill={isPositive ? "#10b98120" : isNegative ? "#ef444420" : "#8b5cf620"}
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
