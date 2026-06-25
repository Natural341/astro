"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCampaigns, createCampaign, toggleCampaign } from "@/lib/api"
import {
  Plus, RefreshCw, X, Check, Gift, Percent, Calendar, Users, Eye, Play, Pause, AlertCircle
} from "lucide-react"

interface Campaign {
  id: string
  title: string
  code: string
  discount_percent: number
  discount_tokens: number
  status: "active" | "paused" | "expired"
  redemptions: number
  max_redemptions: number | null
  expiry_date: string | null
  created_at: string
}

const EMPTY_FORM = {
  title: "",
  code: "",
  discount_percent: "0",
  discount_tokens: "0",
  max_redemptions: "",
  expiry_date: "",
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [error, setError] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCampaigns()
      setCampaigns(res.data ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = useCallback(async () => {
    if (!form.title || !form.code) {
      setError("Title and Code are required.")
      return
    }

    const percent = parseInt(form.discount_percent) || 0
    const tokens = parseInt(form.discount_tokens) || 0

    if (percent === 0 && tokens === 0) {
      setError("Please specify either a discount percentage or token amount.")
      return
    }

    setSaving(true)
    setError("")

    try {
      const payload: any = {
        title: form.title,
        code: form.code,
        discount_percent: percent,
        discount_tokens: tokens,
      }

      if (form.max_redemptions) {
        payload.max_redemptions = parseInt(form.max_redemptions)
      }

      if (form.expiry_date) {
        payload.expiry_date = new Date(form.expiry_date).toISOString()
      }

      await createCampaign(payload)
      setShowCreate(false)
      setForm({ ...EMPTY_FORM })
      await fetchData()
    } catch (e: any) {
      setError(e.message ?? "Failed to create campaign")
    } finally {
      setSaving(false)
    }
  }, [form, fetchData])

  const handleToggleStatus = async (id: string, currentStatus: "active" | "paused" | "expired") => {
    const newStatus = currentStatus === "active" ? "paused" : "active"
    try {
      await toggleCampaign(id, newStatus)
      await fetchData()
    } catch (e: any) {
      alert(e.message ?? "Failed to toggle status")
    }
  }

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.code.toLowerCase().includes(searchQuery.toLowerCase())
    if (filterStatus === "all") return matchesSearch
    return c.status === filterStatus && matchesSearch
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold font-heading tracking-tight">Campaigns & Promo Codes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create discount codes or free token giveaways for users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => { setShowCreate(true); setError("") }}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Codes</p>
              <p className="text-2xl font-bold font-heading mt-1">{campaigns.length}</p>
            </div>
            <div className="p-2 bg-violet-500/10 rounded-lg text-violet-500">
              <Gift className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Active</p>
              <p className="text-2xl font-bold font-heading text-emerald-400 mt-1">
                {campaigns.filter(c => c.status === "active").length}
              </p>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <Play className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Redemptions</p>
              <p className="text-2xl font-bold font-heading text-sky-400 mt-1">
                {campaigns.reduce((acc, c) => acc + c.redemptions, 0)}
              </p>
            </div>
            <div className="p-2 bg-sky-500/10 rounded-lg text-sky-500">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Discount Given</p>
              <p className="text-2xl font-bold font-heading text-amber-400 mt-1">
                {campaigns.reduce((acc, c) => acc + (c.discount_tokens * c.redemptions), 0)} pts
              </p>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
              <Percent className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {showCreate && (
        <Card className="border-violet-500/30 bg-violet-500/5">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-lg">Create New Promo Campaign</CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowCreate(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Campaign Title *</Label>
                <Input placeholder="e.g. Summer Launch Special" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Promo Code (Case-insensitive) *</Label>
                <Input placeholder="e.g. KOSMOS50" value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Discount Percentage (for Store Purchases)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" type="number" placeholder="20" value={form.discount_percent}
                    onChange={e => setForm(f => ({ ...f, discount_percent: e.target.value }))} />
                </div>
                <p className="text-[11px] text-muted-foreground">Applies a discount on coin package purchases</p>
              </div>
              <div className="space-y-1.5">
                <Label>Free Tokens (Direct Reward)</Label>
                <Input type="number" placeholder="50" value={form.discount_tokens}
                  onChange={e => setForm(f => ({ ...f, discount_tokens: e.target.value }))} />
                <p className="text-[11px] text-muted-foreground">Gives direct free tokens upon code activation</p>
              </div>
              <div className="space-y-1.5">
                <Label>Max Redemptions (Leave empty for unlimited)</Label>
                <Input type="number" placeholder="100" value={form.max_redemptions}
                  onChange={e => setForm(f => ({ ...f, max_redemptions: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Expiry Date (Optional)</Label>
                <Input type="datetime-local" value={form.expiry_date}
                  onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreate} disabled={saving}>
                <Check className="h-4 w-4 mr-2" />
                {saving ? "Creating..." : "Create Campaign"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Input
                placeholder="Search by code or title..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex items-center gap-1.5">
              {["all", "active", "paused", "expired"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border ${
                    filterStatus === status
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 text-center text-muted-foreground">
              <RefreshCw className="h-8 w-8 mx-auto animate-spin mb-3" />
              Loading campaigns...
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <Gift className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-base font-semibold">No campaigns found</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try resetting filters or create a new campaign code</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/20 text-xs font-semibold text-muted-foreground uppercase">
                    <th className="px-6 py-4">Campaign / Code</th>
                    <th className="px-6 py-4">Direct Tokens</th>
                    <th className="px-6 py-4">Purchase Discount</th>
                    <th className="px-6 py-4 text-center">Redemptions</th>
                    <th className="px-6 py-4">Expiry Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {filteredCampaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold">{c.title}</div>
                        <div className="inline-block mt-1 font-mono text-xs font-bold bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded border border-violet-500/20">
                          {c.code}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {c.discount_tokens > 0 ? (
                          <div className="font-mono text-emerald-400">+{c.discount_tokens} tokens</div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {c.discount_percent > 0 ? (
                          <div className="font-mono text-amber-500">{c.discount_percent}% OFF</div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-mono font-medium">
                          {c.redemptions} / {c.max_redemptions ?? "∞"}
                        </div>
                        {c.max_redemptions && (
                          <div className="w-16 bg-muted h-1 rounded-full mx-auto mt-1.5 overflow-hidden">
                            <div 
                              className="bg-sky-500 h-full" 
                              style={{ width: `${Math.min(100, (c.redemptions / c.max_redemptions) * 100)}%` }} 
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {c.expiry_date ? (
                          new Date(c.expiry_date).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            c.status === "active"
                              ? "default"
                              : c.status === "paused"
                              ? "secondary"
                              : "destructive"
                          }
                          className="capitalize"
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {c.status !== "expired" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(c.id, c.status)}
                          >
                            {c.status === "active" ? (
                              <>
                                <Pause className="h-3 w-3 mr-1.5" /> Pause
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3 mr-1.5 text-emerald-400" /> Activate
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
