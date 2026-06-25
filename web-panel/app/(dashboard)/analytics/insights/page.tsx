"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts"
import { Lightbulb, Play, Loader2 } from "lucide-react"
import AnalyticsTabs from "@/components/analytics/AnalyticsTabs"
import InsightCard from "@/components/analytics/InsightCard"
import { getAnalyticsInsights, runAggregation } from "@/lib/api"

export default function AnalyticsInsightsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [aggregating, setAggregating] = useState(false)
  const [aggregationResult, setAggregationResult] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const res = await getAnalyticsInsights()
      setData(res.data)
    } catch (err) {
      console.error("Failed to fetch insights:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRunAggregation = async () => {
    setAggregating(true)
    setAggregationResult(null)
    try {
      const res = await runAggregation()
      setAggregationResult(`Aggregation complete for ${res.date}${res.warnings?.length ? ` (${res.warnings.length} warnings)` : ""}`)
      fetchData()
    } catch (err) {
      setAggregationResult("Aggregation failed. Check backend logs.")
    } finally {
      setAggregating(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold font-heading tracking-tight">Analytics</h2>
        <button
          onClick={handleRunAggregation}
          disabled={aggregating}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
        >
          {aggregating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run Aggregation
        </button>
      </div>

      <AnalyticsTabs />

      {aggregationResult && (
        <div className="px-4 py-3 bg-violet-500/10 border border-violet-500/20 rounded-lg text-sm text-violet-400">
          {aggregationResult}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading insights...</div>
      ) : data ? (
        <>
          <div className="space-y-3">
            {data.insights?.map((insight: any, i: number) => (
              <InsightCard
                key={i}
                severity={insight.severity}
                category={insight.category}
                title={insight.title}
                message={insight.message}
                suggestion={insight.suggestion}
              />
            ))}
          </div>

          {data.churn_risk && data.churn_risk.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Churn Risk Distribution</CardTitle>
                <CardDescription>User distribution by churn risk score (based on last activity)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.churn_risk} layout="vertical">
                    <XAxis type="number" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="range" stroke="#888" fontSize={11} tickLine={false} axisLine={false} width={120} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-heading text-lg mb-2">No Insights Yet</h3>
            <p className="text-sm text-muted-foreground">Click "Run Aggregation" to generate daily metrics and insights.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
