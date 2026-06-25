"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Users, CreditCard, Activity, Coins, ArrowUpRight,
  BookOpen, Star, RefreshCw, TrendingUp, Receipt, MessageSquare, Heart,
} from "lucide-react"
import {
  Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts"
import { getAnalytics } from "@/lib/api"

const PIE_COLORS = ["#7C3AED", "#2EC4B6", "#F97316", "#E63946", "#4ADE80", "#F59E0B"]

const KPI_GRADIENTS: Record<string, string> = {
  "text-sky-500": "from-sky-500/8 to-transparent",
  "text-violet-500": "from-violet-500/8 to-transparent",
  "text-emerald-500": "from-emerald-500/8 to-transparent",
  "text-orange-500": "from-orange-500/8 to-transparent",
  "text-pink-500": "from-pink-500/8 to-transparent",
  "text-blue-500": "from-blue-500/8 to-transparent",
  "text-indigo-500": "from-indigo-500/8 to-transparent",
  "text-rose-500": "from-rose-500/8 to-transparent",
}

const KPI_BG: Record<string, string> = {
  "text-sky-500": "bg-sky-500/10",
  "text-violet-500": "bg-violet-500/10",
  "text-emerald-500": "bg-emerald-500/10",
  "text-orange-500": "bg-orange-500/10",
  "text-pink-500": "bg-pink-500/10",
  "text-blue-500": "bg-blue-500/10",
  "text-indigo-500": "bg-indigo-500/10",
  "text-rose-500": "bg-rose-500/10",
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchData = useCallback(async () => {
    try {
      const res = await getAnalytics()
      setData(res.data)
      setLastRefresh(new Date())
    } catch (err) {
      console.error("[Dashboard] fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30_000)
    return () => clearInterval(interval)
  }, [fetchData])

  const categoryData = data?.categoryDistribution
    ? Object.entries(data.categoryDistribution as Record<string, number>).map(
        ([name, value]) => ({ name, value })
      )
    : []

  const userGrowth: { name: string; value: number }[] = data?.userGrowth ?? []

  const kpis = [
    {
      label: "Total Users",
      value: data?.totalUsers?.toLocaleString() ?? "—",
      sub: `+${data?.todayUsers ?? 0} today`,
      icon: Users,
      color: "text-sky-500",
    },
    {
      label: "Premium Users",
      value: data?.premiumUsers?.toLocaleString() ?? "—",
      sub: `${data?.premiumRate ?? 0}% of total`,
      icon: CreditCard,
      color: "text-violet-500",
    },
    {
      label: "Total Revenue",
      value: data?.totalRevenue != null ? `₺${Number(data.totalRevenue).toFixed(2)}` : "—",
      sub: `₺${Number(data?.todayRevenue ?? 0).toFixed(2)} today`,
      icon: Coins,
      color: "text-emerald-500",
    },
    {
      label: "Total Readings",
      value: data?.totalQuestions?.toLocaleString() ?? "—",
      sub: `+${data?.todayQuestions ?? 0} today`,
      icon: BookOpen,
      color: "text-orange-500",
    },
    {
      label: "Online Astrologers",
      value: data?.activeAstrologers ?? "—",
      sub: "currently live",
      icon: Star,
      color: "text-pink-500",
    },
    {
      label: "Tokens Issued",
      value: data?.totalTokensIssued?.toLocaleString() ?? "—",
      sub: "all time",
      icon: Activity,
      color: "text-blue-500",
    },
    {
      label: "Direct Messages",
      value: data?.totalDMs?.toLocaleString() ?? "—",
      sub: `+${data?.todayDMs ?? 0} today`,
      icon: MessageSquare,
      color: "text-indigo-500",
    },
    {
      label: "Friendships",
      value: data?.totalFriends?.toLocaleString() ?? "—",
      sub: "active connections",
      icon: Heart,
      color: "text-rose-500",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold font-heading tracking-tight">Dashboard Overview</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5" />
          {loading ? "Loading..." : `Updated ${lastRefresh.toLocaleTimeString()}`}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${KPI_GRADIENTS[k.color] ?? ""} pointer-events-none`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
              <div className={`flex items-center justify-center h-9 w-9 rounded-lg ${KPI_BG[k.color] ?? "bg-muted"}`}>
                <k.icon className={`h-4.5 w-4.5 ${k.color}`} />
              </div>
            </CardHeader>
            <CardContent className="relative">
              {loading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : (
                <div className="text-2xl font-bold font-heading">{k.value}</div>
              )}
              <p className="text-xs text-muted-foreground flex items-center mt-1.5">
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500 mr-1" />
                {k.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* User Growth */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              User Growth (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[220px] flex items-center justify-center">
                <div className="h-full w-full bg-muted/30 animate-pulse rounded" />
              </div>
            ) : userGrowth.length === 0 ? (
              <EmptyState icon={TrendingUp} title="No data yet" description="User growth data will appear here once users start joining." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={userGrowth}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#7C3AED" radius={[4, 4, 0, 0]} name="New Users" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Reading Categories */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-orange-500" />
              Reading Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[220px] flex items-center justify-center">
                <div className="h-full w-full bg-muted/30 animate-pulse rounded" />
              </div>
            ) : categoryData.length === 0 ? (
              <EmptyState icon={BookOpen} title="No readings yet" description="Reading category breakdown will appear after the first reading." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4 text-emerald-500" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between pb-2">
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="space-y-1.5 flex flex-col items-end">
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-12 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : !data?.recentTransactions?.length ? (
            <EmptyState icon={Receipt} title="No transactions yet" description="Revenue transactions will appear here once users make purchases." />
          ) : (
            <div className="space-y-3">
              {(data.recentTransactions as any[]).map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">{tx.users?.display_name || tx.users?.email || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground capitalize">{tx.type.replace(/_/g, " ")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-500">
                      {tx.amount > 0 ? `₺${Number(tx.amount).toFixed(2)}` : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.token_delta > 0 ? `+${tx.token_delta}` : tx.token_delta} tokens
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
