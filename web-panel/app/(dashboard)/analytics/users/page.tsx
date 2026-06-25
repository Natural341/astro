"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"
import AnalyticsTabs from "@/components/analytics/AnalyticsTabs"
import CohortTable from "@/components/analytics/CohortTable"
import { getAnalyticsUsers } from "@/lib/api"

export default function AnalyticsUsersPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getAnalyticsUsers()
        setData(res.data)
      } catch (err) {
        console.error("Failed to fetch user analytics:", err)
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
        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading user analytics...</div>
      ) : data ? (
        <>
          {data.cohorts && <CohortTable cohorts={data.cohorts} />}

          <div>
            <h3 className="text-lg font-heading font-semibold mb-3">User Segments</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {data.segments?.map((seg: any) => (
                <Card key={seg.name} className="hover:border-violet-500/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{seg.name}</h4>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{seg.percent?.toFixed(1)}%</span>
                    </div>
                    <p className="text-2xl font-bold font-heading">{seg.count?.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{seg.description}</p>
                    {seg.suggestion && (
                      <p className="text-xs text-violet-400 mt-2 pt-2 border-t border-border/50 italic">{seg.suggestion}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-heading text-lg mb-2">No User Data</h3>
            <p className="text-sm text-muted-foreground">User segments will populate as users interact with the app.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
