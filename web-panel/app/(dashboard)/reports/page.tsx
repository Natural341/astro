"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { RefreshCw, Flag } from "lucide-react"
import { getReports, updateReport } from "@/lib/api"

type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed"

interface Report {
  id: string
  target_type: string
  target_id: string
  reason: string
  description: string | null
  status: ReportStatus
  admin_note: string | null
  created_at: string
  reporter_email: string | null
  reporter_nickname: string | null
}

const STATUS_COLORS: Record<ReportStatus, string> = {
  pending: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
  reviewed: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  resolved: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  dismissed: "bg-gray-400/15 text-gray-500 border-gray-400/30",
}

const FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Reviewed", value: "reviewed" },
  { label: "Resolved", value: "resolved" },
  { label: "Dismissed", value: "dismissed" },
]

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [reviewing, setReviewing] = useState<Report | null>(null)
  const [adminNote, setAdminNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async (filter = statusFilter) => {
    try {
      const res = await getReports(filter)
      setReports(res.data ?? [])
      setLastRefresh(new Date())
    } catch (err) {
      console.error("[Reports] fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30_000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleFilterChange = (val: string) => {
    setStatusFilter(val)
    fetchData(val)
  }

  const openReview = (report: Report) => {
    setReviewing(report)
    setAdminNote(report.admin_note ?? "")
  }

  const submitReview = async (status: ReportStatus) => {
    if (!reviewing) return
    setSubmitting(true)
    try {
      await updateReport(reviewing.id, status, adminNote)
      setReviewing(null)
      fetchData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const pendingCount = reports.filter(r => r.status === "pending").length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold font-heading tracking-tight flex items-center gap-2">
            <Flag className="h-7 w-7 text-red-500" />
            Reports
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingCount} pending · {reports.length} total
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3" />
          {loading ? "Loading…" : `Updated ${lastRefresh.toLocaleTimeString()}`}
        </span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <Button
            key={f.value}
            variant={statusFilter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Review modal */}
      {reviewing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-bold">Review Report</h3>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Reporter:</span> {reviewing.reporter_email ?? "Anonymous"}</p>
                <p><span className="text-muted-foreground">Target:</span> {reviewing.target_type} / {reviewing.target_id}</p>
                <p><span className="text-muted-foreground">Reason:</span> {reviewing.reason}</p>
                {reviewing.description && (
                  <p><span className="text-muted-foreground">Details:</span> {reviewing.description}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Admin Note</label>
                <Textarea
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="Optional note for this report…"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <Button variant="outline" onClick={() => setReviewing(null)}>Cancel</Button>
                <Button variant="outline" onClick={() => submitReview("reviewed")} disabled={submitting}>
                  Mark Reviewed
                </Button>
                <Button variant="outline" onClick={() => submitReview("dismissed")} disabled={submitting}>
                  Dismiss
                </Button>
                <Button onClick={() => submitReview("resolved")} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                  {submitting ? "Saving…" : "Resolve"}
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
                  <th className="text-left px-4 py-3 font-medium">Reporter</th>
                  <th className="text-left px-4 py-3 font-medium">Target</th>
                  <th className="text-left px-4 py-3 font-medium">Reason</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Loading…</td></tr>
                )}
                {!loading && reports.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No reports found</td></tr>
                )}
                {reports.map(r => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.reporter_nickname ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{r.reporter_email ?? ""}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="capitalize">{r.target_type}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p>{r.reason}</p>
                      {r.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{r.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "pending" && (
                        <Button size="sm" variant="outline" onClick={() => openReview(r)}>
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
