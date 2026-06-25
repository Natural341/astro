"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/ui/empty-state"
import { RefreshCw, UserCheck, Star, FileText } from "lucide-react"
import { getApplications, reviewApplication } from "@/lib/api"

type AppStatus = "pending" | "approved" | "rejected"
type FilterTab = "all" | AppStatus

interface Application {
  id: string
  user_id: string
  full_name: string
  title: string | null
  specialties: string | null
  experience_years: number
  bio: string | null
  photo_url: string | null
  social_link: string | null
  status: AppStatus
  admin_note: string | null
  created_at: string
  user_email: string | null
  user_nickname: string | null
}

const STATUS_COLORS: Record<AppStatus, string> = {
  pending: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
  approved: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-600 border-red-500/30",
}

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
]

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [reviewing, setReviewing] = useState<Application | null>(null)
  const [adminNote, setAdminNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [noteError, setNoteError] = useState("")
  const [filter, setFilter] = useState<FilterTab>("all")

  const fetchData = useCallback(async () => {
    try {
      const res = await getApplications()
      setApplications(res.data ?? [])
      setLastRefresh(new Date())
    } catch (err) {
      console.error("[Applications] fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30_000)
    return () => clearInterval(interval)
  }, [fetchData])

  const filtered = useMemo(
    () => filter === "all" ? applications : applications.filter(a => a.status === filter),
    [applications, filter]
  )

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: applications.length, pending: 0, approved: 0, rejected: 0 }
    applications.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1 })
    return counts
  }, [applications])

  const openReview = (app: Application) => {
    setReviewing(app)
    setAdminNote(app.admin_note ?? "")
    setNoteError("")
  }

  const submit = async (status: "approved" | "rejected") => {
    if (!reviewing) return
    if (status === "rejected" && !adminNote.trim()) {
      setNoteError("Admin note is required when rejecting an application.")
      return
    }
    setNoteError("")
    setSubmitting(true)
    try {
      await reviewApplication(reviewing.id, status, adminNote)
      setReviewing(null)
      fetchData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold font-heading tracking-tight flex items-center gap-2">
            <UserCheck className="h-7 w-7 text-violet-500" />
            Astrologer Applications
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {statusCounts.pending} pending · {applications.length} total
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3" />
          {loading ? "Loading..." : `Updated ${lastRefresh.toLocaleTimeString()}`}
        </span>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 w-fit">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-muted-foreground">
              {statusCounts[tab.value] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Review modal */}
      {reviewing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-bold">Review Application</h3>
              <div className="text-sm space-y-2 bg-muted/40 rounded-lg p-3">
                <p><span className="text-muted-foreground font-medium">Name:</span> {reviewing.full_name}</p>
                <p><span className="text-muted-foreground font-medium">Email:</span> {reviewing.user_email ?? "—"}</p>
                {reviewing.title && (
                  <p><span className="text-muted-foreground font-medium">Title:</span> {reviewing.title}</p>
                )}
                {reviewing.specialties && (
                  <p><span className="text-muted-foreground font-medium">Specialties:</span> {reviewing.specialties}</p>
                )}
                <p><span className="text-muted-foreground font-medium">Experience:</span> {reviewing.experience_years} years</p>
                {reviewing.bio && (
                  <p><span className="text-muted-foreground font-medium">Bio:</span> {reviewing.bio}</p>
                )}
                {reviewing.social_link && (
                  <p>
                    <span className="text-muted-foreground font-medium">Social:</span>{" "}
                    <a href={reviewing.social_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                      {reviewing.social_link}
                    </a>
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Admin Note <span className="text-xs text-muted-foreground">(required for rejection)</span>
                </label>
                <Textarea
                  value={adminNote}
                  onChange={e => { setAdminNote(e.target.value); setNoteError("") }}
                  placeholder="Feedback for the applicant..."
                  rows={3}
                />
                {noteError && (
                  <p className="text-xs text-red-500 mt-1">{noteError}</p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setReviewing(null)}>Cancel</Button>
                <Button
                  variant="outline"
                  className="border-red-400 text-red-500 hover:bg-red-50"
                  onClick={() => submit("rejected")}
                  disabled={submitting}
                >
                  Reject
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => submit("approved")}
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Approve"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Applicant</th>
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium">Specialties</th>
                  <th className="text-center px-4 py-3 font-medium">Exp.</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Applied</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-4 w-48 mx-auto bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                  </td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={7}>
                    <EmptyState
                      icon={FileText}
                      title={filter === "all" ? "No applications yet" : `No ${filter} applications`}
                      description={filter === "all" ? "Applications will appear here when users apply to become astrologers." : undefined}
                    />
                  </td></tr>
                )}
                {filtered.map(a => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{a.full_name}</p>
                      <p className="text-xs text-muted-foreground">{a.user_email ?? a.user_nickname ?? ""}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{a.title ?? "—"}</td>
                    <td className="px-4 py-3">
                      {a.specialties ? (
                        <div className="flex flex-wrap gap-1">
                          {a.specialties.split(",").slice(0, 3).map(s => (
                            <Badge key={s} variant="secondary" className="text-xs">{s.trim()}</Badge>
                          ))}
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">{a.experience_years}y</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[a.status]}`}>
                          {a.status}
                        </span>
                        {a.status === "approved" && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600">
                            <Star className="h-3 w-3" />
                            Astrologer created
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {a.status === "pending" && (
                        <Button size="sm" variant="outline" onClick={() => openReview(a)}>
                          Review
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
