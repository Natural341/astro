"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Search, RefreshCw, ChevronLeft, ChevronRight, X, AlertTriangle, Trophy, Flame, Users } from "lucide-react"
import { getUsers, updateUser, adjustTokens, deleteUser, getStreaks } from "@/lib/api"

const AVATAR_COLORS = [
  "bg-violet-500/20 text-violet-400",
  "bg-sky-500/20 text-sky-400",
  "bg-emerald-500/20 text-emerald-400",
  "bg-pink-500/20 text-pink-400",
  "bg-orange-500/20 text-orange-400",
  "bg-blue-500/20 text-blue-400",
]

const ZODIAC_EMOJI: Record<string, string> = {
  aries:"♈", taurus:"♉", gemini:"♊", cancer:"♋", leo:"♌", virgo:"♍",
  libra:"♎", scorpio:"♏", sagittarius:"♐", capricorn:"♑", aquarius:"♒", pisces:"♓",
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://192.168.1.23:8080"

function resolvePhotoUrl(url?: string): string | undefined {
  if (!url) return undefined
  // Already absolute (http:// or https://)
  if (url.startsWith("http")) return url
  // Relative path from backend (e.g. /uploads/...)
  return `${BASE_URL}${url}`
}

function UserAvatar({ name, photoUrl }: { name: string; photoUrl?: string }) {
  const [imgError, setImgError] = useState(false)
  const resolved = resolvePhotoUrl(photoUrl)
  const letter = (name || "U").charAt(0).toUpperCase()
  const colorIdx = letter.charCodeAt(0) % AVATAR_COLORS.length

  if (resolved && !imgError) {
    return (
      <img
        src={resolved}
        alt={name}
        className="h-8 w-8 rounded-full object-cover shrink-0 border border-border"
        onError={() => setImgError(true)}
      />
    )
  }
  return (
    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${AVATAR_COLORS[colorIdx]}`}>
      {letter}
    </div>
  )
}

interface User {
  id: string
  email: string
  nickname: string
  display_name: string
  role: string
  is_premium: boolean
  tokens: number
  xp_points: number
  witch_level: string
  profile_image_url: string
  zodiac_sign: string
  birth_city: string
  last_active: string
  created_at: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

type DialogState =
  | null
  | { type: "grant"; user: User }
  | { type: "delete"; user: User }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentPage = useRef(1)

  // Dialog state
  const [dialog, setDialog] = useState<DialogState>(null)
  const [tokenAmount, setTokenAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Tabs & Streak leaderboard state
  const [activeTab, setActiveTab] = useState<"list" | "leaderboard">("list")
  const [streaks, setStreaks] = useState<any[]>([])
  const [streaksLoading, setStreaksLoading] = useState(false)

  const fetchStreaks = useCallback(async () => {
    setStreaksLoading(true)
    try {
      const res = await getStreaks()
      setStreaks(res.data ?? [])
    } catch (e) {
      console.error("Failed to fetch streaks:", e)
    } finally {
      setStreaksLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === "leaderboard") {
      fetchStreaks()
    }
  }, [activeTab, fetchStreaks])

  const fetchData = useCallback(async (page = 1, q?: string) => {
    const query = q !== undefined ? q : search
    try {
      const res = await getUsers(page, 20, query)
      setUsers(res.data ?? [])
      setPagination(res.pagination ?? { page, limit: 20, total: 0, totalPages: 1 })
      currentPage.current = page
      setLastRefresh(new Date())
    } catch (err) {
      console.error("[Users] fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchData(1)
    const interval = setInterval(() => fetchData(currentPage.current), 30_000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (val: string) => {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => fetchData(1, val), 400)
  }

  const handleGrantTokens = async () => {
    if (dialog?.type !== "grant") return
    const amount = parseInt(tokenAmount)
    if (isNaN(amount) || amount <= 0) return
    setSubmitting(true)
    try {
      await adjustTokens(dialog.user.id, amount, "add", "Admin grant")
      setDialog(null)
      setTokenAmount("")
      fetchData(currentPage.current)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleTogglePremium = async (user: User) => {
    try {
      await updateUser(user.id, { is_premium: !user.is_premium })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_premium: !u.is_premium } : u))
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDelete = async () => {
    if (dialog?.type !== "delete") return
    setSubmitting(true)
    try {
      await deleteUser(dialog.user.id)
      setDialog(null)
      fetchData(currentPage.current)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (s: string) => new Date(s).toLocaleDateString()

  return (
    <div className="flex flex-col gap-6">
      {/* Grant Tokens Dialog */}
      {dialog?.type === "grant" && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Grant Tokens</CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setDialog(null); setTokenAmount("") }}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Grant tokens to <span className="font-medium text-foreground">{dialog.user.display_name || dialog.user.email}</span>
              </p>
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Enter token amount"
                  value={tokenAmount}
                  onChange={e => setTokenAmount(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setDialog(null); setTokenAmount("") }}>Cancel</Button>
                <Button onClick={handleGrantTokens} disabled={submitting || !tokenAmount || parseInt(tokenAmount) <= 0}>
                  {submitting ? "Granting..." : "Grant"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {dialog?.type === "delete" && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Delete User</h3>
                  <p className="text-sm text-muted-foreground">This cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm">
                Are you sure you want to delete <span className="font-medium">{dialog.user.email}</span>?
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
                  {submitting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold font-heading tracking-tight">User Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTab === "list" ? `${pagination.total.toLocaleString()} total users` : `${streaks.length} active streaks`}
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin-slow" />
          {loading || streaksLoading ? "Loading..." : lastRefresh.toLocaleTimeString()}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border pb-0 mb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("list")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "list"
              ? "border-violet-500 text-violet-500"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          <Users className="h-4 w-4" />
          User List
        </button>
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "leaderboard"
              ? "border-violet-500 text-violet-500"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          <Flame className="h-4 w-4 text-orange-500" />
          Streak Leaderboard
        </button>
      </div>

      {activeTab === "list" && (
        <>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by email or nickname..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">User</th>
                      <th className="text-left px-4 py-3 font-medium">Email</th>
                      <th className="text-center px-4 py-3 font-medium">Zodiac</th>
                      <th className="text-center px-4 py-3 font-medium">Role</th>
                      <th className="text-center px-4 py-3 font-medium">Plan</th>
                      <th className="text-center px-4 py-3 font-medium">Tokens</th>
                      <th className="text-left px-4 py-3 font-medium">Last Active</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">
                        <div className="space-y-2">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="h-4 w-48 mx-auto bg-muted animate-pulse rounded" />
                          ))}
                        </div>
                      </td></tr>
                    )}
                    {!loading && users.length === 0 && (
                      <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">No users found</td></tr>
                    )}
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={u.display_name || u.nickname || u.email} photoUrl={u.profile_image_url || undefined} />
                            <div>
                              <p className="font-medium leading-tight">{u.display_name || u.nickname || "—"}</p>
                              {u.birth_city && <p className="text-xs text-muted-foreground">{u.birth_city}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                        <td className="px-4 py-3 text-center">
                          {u.zodiac_sign ? (
                            <span className="text-lg" title={u.zodiac_sign}>
                              {ZODIAC_EMOJI[u.zodiac_sign.toLowerCase()] ?? "✨"}
                            </span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={u.role === "admin" ? "default" : "outline"}>{u.role}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={u.is_premium ? "default" : "secondary"}>
                            {u.is_premium ? "Premium" : "Free"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center font-mono">{u.tokens.toLocaleString()}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {u.last_active ? formatDate(u.last_active) : formatDate(u.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => { setDialog({ type: "grant", user: u }); setTokenAmount("") }}>
                                Grant Tokens
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTogglePremium(u)}>
                                {u.is_premium ? "Remove Premium" : "Grant Premium"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-500" onClick={() => setDialog({ type: "delete", user: u })}>
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages} · {pagination.total} users
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
        </>
      )}

      {activeTab === "leaderboard" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="text-center w-16 py-3 font-medium">Rank</th>
                    <th className="text-left px-4 py-3 font-medium">User</th>
                    <th className="text-left px-4 py-3 font-medium">Email</th>
                    <th className="text-center px-4 py-3 font-medium">Current Streak</th>
                    <th className="text-center px-4 py-3 font-medium">Longest Streak</th>
                    <th className="text-center px-4 py-3 font-medium">Total Earned</th>
                    <th className="text-left px-4 py-3 font-medium">Last Claimed</th>
                  </tr>
                </thead>
                <tbody>
                  {streaksLoading && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-muted-foreground">
                        <div className="space-y-2">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="h-4 w-48 mx-auto bg-muted animate-pulse rounded" />
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                  {!streaksLoading && streaks.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-muted-foreground">
                        No streak data yet. Users must start claiming daily streaks.
                      </td>
                    </tr>
                  )}
                  {streaks.map((s, idx) => {
                    const rank = idx + 1
                    return (
                      <tr key={s.user_id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 text-center font-bold text-xs">
                          {rank === 1 ? (
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-500/20 text-amber-500" title="1st Place">
                              🏆
                            </span>
                          ) : rank === 2 ? (
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-300/20 text-slate-300" title="2nd Place">
                              🥈
                            </span>
                          ) : rank === 3 ? (
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-700/20 text-amber-700" title="3rd Place">
                              🥉
                            </span>
                          ) : (
                            <span className="text-muted-foreground">#{rank}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={s.user_email?.split("@")[0] || "User"} />
                            <div className="font-semibold text-foreground">
                              {s.user_email?.split("@")[0] || "User"}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{s.user_email}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1 font-bold text-orange-500 font-mono">
                            <Flame className="h-4 w-4 fill-orange-500/20 text-orange-500 shrink-0" />
                            {s.current_streak} days
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-medium">
                          {s.longest_streak} days
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-emerald-400 font-semibold">
                          +{s.total_tokens_earned.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                          {s.last_claim_date ? s.last_claim_date : "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
