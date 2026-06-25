"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { adminFetch } from "@/lib/api"
import {
  Search, RefreshCw, ChevronLeft, ChevronRight,
  BookOpen, Sparkles, Star, Coffee, Moon, Zap, Hand, Sun, Heart, Eye,
} from "lucide-react"

interface Reading {
  id: string
  user_id: string
  user_email: string
  type: string
  category: string
  tokens_used: number
  created_at: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const READING_CATEGORIES = [
  { value: "", label: "All Types" },
  { value: "tarot", label: "Tarot" },
  { value: "dream", label: "Dream" },
  { value: "coffee", label: "Coffee" },
  { value: "birth_chart", label: "Birth Chart" },
  { value: "palm", label: "Palm" },
  { value: "ai_chat", label: "AI Chat" },
  { value: "numerology", label: "Numerology" },
  { value: "synastry", label: "Synastry" },
  { value: "vedic_chart", label: "Vedic Chart" },
  { value: "face_reading", label: "Face Reading" },
  { value: "draw_soulmate", label: "Soulmate" },
]

const TYPE_ICON: Record<string, React.ReactNode> = {
  tarot:        <Sparkles className="h-3.5 w-3.5" />,
  dream:        <Moon className="h-3.5 w-3.5" />,
  coffee:       <Coffee className="h-3.5 w-3.5" />,
  birth_chart:  <Sun className="h-3.5 w-3.5" />,
  palm:         <Hand className="h-3.5 w-3.5" />,
  ai_chat:      <Zap className="h-3.5 w-3.5" />,
  numerology:   <Star className="h-3.5 w-3.5" />,
  synastry:     <Heart className="h-3.5 w-3.5" />,
  vedic_chart:  <Sun className="h-3.5 w-3.5" />,
  face_reading: <Eye className="h-3.5 w-3.5" />,
  draw_soulmate: <Sparkles className="h-3.5 w-3.5" />,
}

const TYPE_COLOR: Record<string, string> = {
  tarot:        "bg-violet-500/15 text-violet-500 border-violet-500/30",
  dream:        "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  coffee:       "bg-amber-500/15 text-amber-500 border-amber-500/30",
  birth_chart:  "bg-orange-500/15 text-orange-400 border-orange-500/30",
  palm:         "bg-pink-500/15 text-pink-400 border-pink-500/30",
  ai_chat:      "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  numerology:   "bg-sky-500/15 text-sky-400 border-sky-500/30",
  synastry:     "bg-rose-500/15 text-rose-500 border-rose-500/30",
  vedic_chart:  "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  face_reading: "bg-purple-500/15 text-purple-500 border-purple-500/30",
  draw_soulmate: "bg-indigo-500/15 text-indigo-500 border-indigo-500/30",
}

function TypeBadge({ type }: { type: string }) {
  const key = type?.toLowerCase()
  const color = TYPE_COLOR[key] ?? "bg-muted text-muted-foreground border-border"
  const icon = TYPE_ICON[key]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {icon}
      {type}
    </span>
  )
}

function getReadings(page: number, limit: number, category: string, search: string) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(category ? { category } : {}),
    ...(search ? { search } : {}),
  })
  return adminFetch<any>(`/api/v1/admin/readings?${params}`)
}

export default function ContentPage() {
  const [readings, setReadings] = useState<Reading[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentPage = useRef(1)

  const fetchData = useCallback(async (page = 1, q?: string, cat?: string) => {
    const query = q !== undefined ? q : search
    const catFilter = cat !== undefined ? cat : category
    try {
      const res = await getReadings(page, 50, catFilter, query)
      setReadings(res.data ?? [])
      setPagination(res.pagination ?? { page, limit: 50, total: 0, totalPages: 1 })
      currentPage.current = page
      setLastRefresh(new Date())
    } catch (err) {
      console.error("[Content] fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [search, category])

  useEffect(() => {
    fetchData(1)
    const interval = setInterval(() => fetchData(currentPage.current), 30_000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (val: string) => {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => fetchData(1, val, category), 400)
  }

  const handleCategory = (val: string) => {
    setCategory(val)
    fetchData(1, search, val)
  }

  const formatDate = (s: string) => {
    const d = new Date(s)
    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" }) +
      " " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
  }

  // Summary stats from current page data
  const totalTokens = readings.reduce((s, r) => s + (r.tokens_used || 0), 0)
  const typeMap = readings.reduce((acc: Record<string, number>, r) => {
    const k = r.type?.toLowerCase() || "other"
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})
  const topType = Object.entries(typeMap).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold font-heading tracking-tight">Content & Readings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {pagination.total.toLocaleString()} total readings
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3" />
          {loading ? "Loading..." : lastRefresh.toLocaleTimeString()}
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Readings</p>
            <p className="text-2xl font-bold font-heading">{pagination.total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tokens Used (page)</p>
            <p className="text-2xl font-bold font-heading">{totalTokens.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Top Feature</p>
            <p className="text-2xl font-bold font-heading capitalize">{topType?.[0] ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by email..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {READING_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => handleCategory(cat.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                category === cat.value
                  ? "bg-violet-500 text-white border-violet-500"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">User</th>
                  <th className="text-left px-4 py-3 font-medium">Reading Type</th>
                  <th className="text-center px-4 py-3 font-medium">Tokens</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-muted-foreground">
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="h-4 w-64 mx-auto bg-muted animate-pulse rounded" />
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && readings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-16">
                      <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground text-sm">No readings found</p>
                    </td>
                  </tr>
                )}
                {readings.map(r => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        {r.user_email || r.user_id?.slice(0, 8) + "..."}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={r.type || r.category} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.tokens_used > 0 ? (
                        <span className="font-mono text-amber-500 font-medium">{r.tokens_used}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} readings
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
