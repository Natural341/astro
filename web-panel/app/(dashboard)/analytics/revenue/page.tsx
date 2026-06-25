"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area } from "recharts"
import { Coins } from "lucide-react"
import AnalyticsTabs from "@/components/analytics/AnalyticsTabs"
import { getAnalyticsRevenue } from "@/lib/api"

type Period = "7" | "30" | "90"

export default function AnalyticsRevenuePage() {
  const [data, setData] = useState<any>(null)
  const [period, setPeriod] = useState<Period>("30")
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await getAnalyticsRevenue(period)
      setData(res.data)
    } catch (err) {
      console.error("Failed to fetch revenue analytics:", err)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const tokenEconomy = data?.token_economy
  const tokenData = tokenEconomy ? [
    { name: "Minted", value: tokenEconomy.minted },
    { name: "Spent", value: tokenEconomy.spent },
    { name: "In Circulation", value: tokenEconomy.circulation },
  ] : []

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
        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading revenue analytics...</div>
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase">Total Revenue</p>
                <p className="text-2xl font-bold font-heading mt-1">{data.total_revenue?.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase">LTV (per purchaser)</p>
                <p className="text-2xl font-bold font-heading mt-1">{data.ltv?.toFixed(2)} ₺</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase">Token Circulation</p>
                <p className="text-2xl font-bold font-heading mt-1">{tokenEconomy?.circulation?.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {tokenData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Token Economy</CardTitle>
                <CardDescription>Tokens minted vs spent ({period}d)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={tokenData}>
                    <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {data.packages && data.packages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Package Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3">Package</th>
                        <th className="text-right py-2 px-3">Tokens</th>
                        <th className="text-right py-2 px-3">Price</th>
                        <th className="text-right py-2 px-3">Purchases</th>
                        <th className="text-right py-2 px-3">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.packages.map((pkg: any) => (
                        <tr key={pkg.name} className="border-b border-border/50">
                          <td className="py-2 px-3 font-medium">{pkg.name}</td>
                          <td className="py-2 px-3 text-right">{pkg.token_amount}</td>
                          <td className="py-2 px-3 text-right">{pkg.price_tl?.toFixed(2)} ₺</td>
                          <td className="py-2 px-3 text-right">{pkg.purchases}</td>
                          <td className="py-2 px-3 text-right font-medium">{pkg.total_revenue?.toFixed(2)} ₺</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {data.revenue_trend && data.revenue_trend.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={data.revenue_trend}>
                    <XAxis dataKey="date" stroke="#888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                    <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b98120" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Coins className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-heading text-lg mb-2">No Revenue Data</h3>
            <p className="text-sm text-muted-foreground">Revenue analytics will appear after purchases are made.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
