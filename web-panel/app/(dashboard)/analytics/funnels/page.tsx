"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { GitBranch } from "lucide-react"
import AnalyticsTabs from "@/components/analytics/AnalyticsTabs"
import FunnelChart from "@/components/analytics/FunnelChart"
import { getAnalyticsFunnels } from "@/lib/api"

export default function AnalyticsFunnelsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getAnalyticsFunnels()
        setData(res.data)
      } catch (err) {
        console.error("Failed to fetch funnel analytics:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-3xl font-bold font-heading tracking-tight">Analytics</h2>
      <AnalyticsTabs />

      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading funnel analytics...</div>
      ) : data ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.onboarding && <FunnelChart title="Onboarding Funnel" steps={data.onboarding} />}
          {data.monetization && <FunnelChart title="Monetization Funnel" steps={data.monetization} />}
          {data.first_value && <FunnelChart title="First Value Funnel" steps={data.first_value} />}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-heading text-lg mb-2">No Funnel Data</h3>
            <p className="text-sm text-muted-foreground">Funnel analytics require user events. Start tracking to see conversion data.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
