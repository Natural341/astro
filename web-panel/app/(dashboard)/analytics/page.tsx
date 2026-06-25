"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts"
import { Activity, Heart } from "lucide-react"
import AnalyticsTabs from "@/components/analytics/AnalyticsTabs"
import KPICard from "@/components/analytics/KPICard"
import { getAnalyticsOverview } from "@/lib/api"

type Period = "7" | "30" | "90"

export default function AnalyticsOverviewPage() {
  const [data, setData] = useState<any>(null)
  const [period, setPeriod] = useState<Period>("30")
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await getAnalyticsOverview(period)
      setData(res.data)
    } catch (err) {
      console.error("Failed to fetch overview:", err)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold font-heading tracking-tight">Analytics</h2>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {(["7", "30", "90"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => { setPeriod(p); setLoading(true) }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === p ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}d
            </button>
          ))}
        </div>
      </div>

      <AnalyticsTabs />

      {loading && !data ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading analytics...</div>
      ) : data ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {data.kpis?.map((kpi: any) => (
              <KPICard
                key={kpi.name}
                name={kpi.name}
                value={kpi.value}
                change={kpi.change}
                suffix={kpi.suffix}
                inverse={kpi.inverse}
                trend={kpi.trend}
              />
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Health Score</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
                      <circle
                        cx="40" cy="40" r="34" fill="none" strokeWidth="6"
                        strokeDasharray={`${(data.health_score / 100) * 213.6} 213.6`}
                        strokeLinecap="round"
                        className={data.health_score >= 70 ? "stroke-emerald-500" : data.health_score >= 40 ? "stroke-yellow-500" : "stroke-red-500"}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">{data.health_score}</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Premium: {data.premium_users}</p>
                    <p>Readings: {data.total_readings?.toLocaleString()}</p>
                    <p>Avg Session: {data.avg_session ? `${Math.round(data.avg_session / 60)}m ${Math.round(data.avg_session % 60)}s` : "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {data.kpis?.find((k: any) => k.name === "DAU")?.trend?.length > 1 && (
              <Card className="col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">DAU Trend</CardTitle>
                  <CardDescription>Daily active users over the period</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={data.kpis.find((k: any) => k.name === "DAU").trend}>
                      <XAxis dataKey="date" stroke="#888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v: string) => v.slice(5)} />
                      <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                      <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="#8b5cf620" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-heading text-lg mb-2">No Analytics Data</h3>
            <p className="text-sm text-muted-foreground">Run the aggregation first from the Insights tab, or wait for user events to accumulate.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
