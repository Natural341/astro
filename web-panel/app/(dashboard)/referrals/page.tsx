"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getReferrals } from "@/lib/api"
import { RefreshCw, Share2, Award, Calendar, Users } from "lucide-react"

interface Referral {
  id: string
  referrer_id: string
  referrer_email: string
  referred_id: string
  referred_email: string
  tokens_awarded: number
  created_at: string
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getReferrals()
      setReferrals(res.data ?? [])
      setLastRefresh(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const formatDate = (s: string) => {
    const d = new Date(s)
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Calculate quick stats
  const totalRewarded = referrals.reduce((sum, r) => sum + r.tokens_awarded, 0)
  const uniqueReferrers = new Set(referrals.map(r => r.referrer_id)).size

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold font-heading tracking-tight">Referral Tracking</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor user invitations and referral rewards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Invites</p>
              <p className="text-2xl font-bold font-heading mt-1">{referrals.length}</p>
            </div>
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500">
              <Share2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Active Referrers</p>
              <p className="text-2xl font-bold font-heading mt-1">{uniqueReferrers}</p>
            </div>
            <div className="p-2 bg-violet-500/10 rounded-lg text-violet-500">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Tokens Awarded</p>
              <p className="text-2xl font-bold font-heading mt-1 text-emerald-400">
                {totalRewarded.toLocaleString()}
              </p>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr className="text-xs font-semibold text-muted-foreground uppercase">
                  <th className="text-left px-6 py-4">Invited By (Referrer)</th>
                  <th className="text-left px-6 py-4">New User (Referred)</th>
                  <th className="text-center px-6 py-4">Tokens Awarded</th>
                  <th className="text-left px-6 py-4">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-20 text-muted-foreground">
                      <RefreshCw className="h-8 w-8 mx-auto animate-spin mb-3" />
                      Loading referrals...
                    </td>
                  </tr>
                ) : referrals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-20 text-muted-foreground">
                      <Share2 className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="font-semibold">No referrals yet</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Invites will appear here when users register using referral links</p>
                    </td>
                  </tr>
                ) : (
                  referrals.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold">{r.referrer_email?.split("@")[0] || "User"}</div>
                        <div className="text-xs font-mono text-muted-foreground">{r.referrer_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold">{r.referred_email?.split("@")[0] || "User"}</div>
                        <div className="text-xs font-mono text-muted-foreground">{r.referred_email}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-mono font-bold text-emerald-400">+{r.tokens_awarded} tokens</span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs font-mono">
                        {formatDate(r.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
