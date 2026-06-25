"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Layers } from "lucide-react"
import AnalyticsTabs from "@/components/analytics/AnalyticsTabs"
import FeatureBar from "@/components/analytics/FeatureBar"
import { getAnalyticsFeatures } from "@/lib/api"

type Period = "7" | "30" | "90"

export default function AnalyticsFeaturesPage() {
  const [data, setData] = useState<any>(null)
  const [period, setPeriod] = useState<Period>("30")
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await getAnalyticsFeatures(period)
      setData(res.data)
    } catch (err) {
      console.error("Failed to fetch features analytics:", err)
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
        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading feature analytics...</div>
      ) : data?.features?.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {data.features.map((f: any) => (
            <FeatureBar
              key={f.key}
              name={f.name}
              uniqueUsers={f.unique_users}
              totalUses={f.total_uses}
              adoption={f.adoption}
              trend={f.trend}
              repeatRate={f.repeat_rate}
              tokenCost={f.token_cost}
              revenue={f.revenue}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-heading text-lg mb-2">No Feature Data</h3>
            <p className="text-sm text-muted-foreground">Feature analytics will appear as users use AI readings, tarot, dream interpretation, etc.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
