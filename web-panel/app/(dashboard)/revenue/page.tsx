"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Coins, ChevronLeft, ChevronRight } from "lucide-react"
import { getTransactions } from "@/lib/api"

interface Transaction {
  id: string
  user_id: string
  user_email: string
  type: string
  amount: number
  token_delta: number
  description: string
  created_at: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const TX_BADGE: Record<string, string> = {
  purchase: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  admin_grant: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  admin_deduct: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  deduct: "bg-red-500/15 text-red-600 border-red-500/30",
  streak_reward: "bg-violet-500/15 text-violet-600 border-violet-500/30",
}

export default function RevenuePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [typeFilter, setTypeFilter] = useState("")
  const [totalRevenue, setTotalRevenue] = useState(0)

  const fetchData = useCallback(async (page = 1, type = typeFilter) => {
    try {
      const res = await getTransactions(page, 50, type)
      setTransactions(res.data ?? [])
      setPagination(res.pagination ?? { page, limit: 50, total: 0, totalPages: 1 })
      // Sum purchase amounts for revenue display
      const revenue = (res.data ?? [])
        .filter((t: Transaction) => t.type === "purchase")
        .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0)
      setTotalRevenue(revenue)
      setLastRefresh(new Date())
    } catch (err) {
      console.error("[Revenue] fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [typeFilter])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30_000)
    return () => clearInterval(interval)
  }, [fetchData])

  const TX_FILTERS = [
    { label: "All", value: "" },
    { label: "Purchases", value: "purchase" },
    { label: "Admin Grants", value: "admin_grant" },
    { label: "Deductions", value: "deduct" },
    { label: "Streak", value: "streak_reward" },
  ]

  const formatDate = (s: string) =>
    new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold font-heading tracking-tight flex items-center gap-2">
            <Coins className="h-7 w-7 text-emerald-500" />
            Token & Revenue
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {pagination.total.toLocaleString()} transactions
            {typeFilter === "" || typeFilter === "purchase"
              ? ` · ₺${totalRevenue.toFixed(2)} shown`
              : ""}
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3" />
          {loading ? "Loading…" : `Updated ${lastRefresh.toLocaleTimeString()}`}
        </span>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap">
        {TX_FILTERS.map(f => (
          <Button
            key={f.value}
            variant={typeFilter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => { setTypeFilter(f.value); fetchData(1, f.value) }}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">User</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-right px-4 py-3 font-medium">Amount (₺)</th>
                  <th className="text-right px-4 py-3 font-medium">Tokens</th>
                  <th className="text-left px-4 py-3 font-medium">Description</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Loading…</td></tr>
                )}
                {!loading && transactions.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No transactions found</td></tr>
                )}
                {transactions.map(tx => (
                  <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{tx.user_email || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${TX_BADGE[tx.type] ?? "bg-gray-500/10 text-gray-500 border-gray-400/20"}`}>
                        {tx.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {tx.amount > 0 ? (
                        <span className="text-emerald-500">₺{Number(tx.amount).toFixed(2)}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span className={tx.token_delta >= 0 ? "text-emerald-500" : "text-red-500"}>
                        {tx.token_delta >= 0 ? "+" : ""}{tx.token_delta}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-[200px]">
                      {tx.description || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(tx.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} transactions
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pagination.page <= 1}
                  onClick={() => fetchData(pagination.page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchData(pagination.page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
