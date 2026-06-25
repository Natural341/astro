"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "@/components/ui/image-upload"
import { EmptyState } from "@/components/ui/empty-state"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal, RefreshCw, Plus, Star, Trash2,
  LayoutGrid, List, Pencil, X, Users,
} from "lucide-react"
import { getAdminAstrologers, updateAstrologer, createAstrologer, deleteAstrologer } from "@/lib/api"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://192.168.1.23:8080"

interface Astrologer {
  id: string
  name: string
  title: string
  specialty: string
  specialties: string[]
  bio: string
  photo_url: string
  rating: number
  rating_count: number
  total_readings: number
  price_per_min: number
  is_online: boolean
  is_active: boolean
}

type FormState = {
  name: string
  title: string
  specialty: string
  bio: string
  photo_url: string
  price_per_min: string
  rating: string
}

const emptyForm: FormState = {
  name: "", title: "", specialty: "", bio: "", photo_url: "", price_per_min: "10", rating: "4.5",
}

function resolvePhotoUrl(url: string) {
  if (!url) return ""
  if (url.startsWith("http")) return url
  return `${BASE_URL}${url}`
}

function AstrologerAvatar({ url, name, size = "md" }: { url?: string; name: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = { sm: "h-8 w-8 text-xs", md: "h-12 w-12 text-sm", lg: "h-20 w-20 text-xl" }
  if (url) {
    return (
      <img
        src={resolvePhotoUrl(url)}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-border`}
      />
    )
  }
  const letter = name?.charAt(0)?.toUpperCase() || "?"
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-violet-500/20 flex items-center justify-center font-semibold text-violet-400 border-2 border-border`}>
      {letter}
    </div>
  )
}

export default function AstrologersPage() {
  const [astrologers, setAstrologers] = useState<Astrologer[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

  // Dialog states
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await getAdminAstrologers()
      setAstrologers(res.data ?? [])
      setLastRefresh(new Date())
    } catch (err) {
      console.error("[Astrologers] fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30_000)
    return () => clearInterval(interval)
  }, [fetchData])

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setDialogMode("create")
  }

  const openEdit = (a: Astrologer) => {
    setForm({
      name: a.name,
      title: a.title || "",
      specialty: (a.specialties?.length ? a.specialties : a.specialty?.split(",").filter(Boolean) ?? []).join(", "),
      bio: a.bio || "",
      photo_url: a.photo_url || "",
      price_per_min: String(a.price_per_min),
      rating: String(a.rating),
    })
    setEditingId(a.id)
    setDialogMode("edit")
  }

  const closeDialog = () => {
    setDialogMode(null)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        name: form.name,
        title: form.title,
        specialty: form.specialty,
        bio: form.bio,
        photo_url: form.photo_url,
        price_per_min: Number(form.price_per_min),
        ...(dialogMode === "create" ? { rating: Number(form.rating) } : {}),
      }
      if (dialogMode === "create") {
        await createAstrologer(payload)
      } else if (editingId) {
        await updateAstrologer(editingId, payload)
      }
      closeDialog()
      fetchData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleOnline = async (id: string, current: boolean) => {
    setAstrologers(prev =>
      prev.map(a => a.id === id ? { ...a, is_online: !current } : a)
    )
    try {
      await updateAstrologer(id, { is_online: !current })
    } catch {
      setAstrologers(prev =>
        prev.map(a => a.id === id ? { ...a, is_online: current } : a)
      )
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this astrologer? This cannot be undone.")) return
    try {
      await deleteAstrologer(id)
      setAstrologers(prev => prev.filter(a => a.id !== id))
    } catch (err: any) {
      alert(err.message)
    }
  }

  const onlineCount = astrologers.filter(a => a.is_online).length

  const getSpecialties = (a: Astrologer) =>
    a.specialties?.length ? a.specialties : a.specialty?.split(",").filter(Boolean) ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold font-heading tracking-tight">Astrologers</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {onlineCount} online · {astrologers.length} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3" />
            {loading ? "Loading..." : lastRefresh.toLocaleTimeString()}
          </span>
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors ${viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 transition-colors ${viewMode === "table" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Add Astrologer
          </Button>
        </div>
      </div>

      {/* Create / Edit Slide-out Dialog */}
      {dialogMode && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{dialogMode === "create" ? "New Astrologer" : "Edit Astrologer"}</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeDialog}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Photo</Label>
                  <ImageUpload
                    value={form.photo_url}
                    onChange={url => setForm(p => ({ ...p, photo_url: url }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Name *</Label>
                    <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Title</Label>
                    <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Vedic Astrologer" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Specialties</Label>
                    <Input value={form.specialty} onChange={e => setForm(p => ({ ...p, specialty: e.target.value }))} placeholder="Tarot, Birth Chart, Love" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Price per msg (tokens)</Label>
                    <Input type="number" value={form.price_per_min} onChange={e => setForm(p => ({ ...p, price_per_min: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Bio</Label>
                  <Textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3} />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving..." : dialogMode === "create" ? "Create" : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="overflow-hidden">
              <div className="h-32 bg-muted animate-pulse" />
              <CardContent className="pt-4 space-y-2">
                <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-40 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && astrologers.length === 0 && (
        <EmptyState
          icon={Users}
          title="No astrologers yet"
          description="Add your first astrologer to get started."
          action={{ label: "Add Astrologer", onClick: openCreate }}
        />
      )}

      {/* Card Grid View */}
      {!loading && astrologers.length > 0 && viewMode === "grid" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {astrologers.map(a => (
            <Card key={a.id} className="overflow-hidden group relative">
              <CardContent className="pt-5">
                <div className="flex items-start gap-4">
                  {/* Avatar with online indicator */}
                  <div className="relative shrink-0">
                    <AstrologerAvatar url={a.photo_url} name={a.name} size="lg" />
                    <div className={`absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-background ${a.is_online ? "bg-emerald-500" : "bg-gray-400"}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold truncate">{a.name}</h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEdit(a)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateAstrologer(a.id, { is_active: !a.is_active }).then(fetchData)}
                          >
                            {a.is_active ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-500" onClick={() => handleDelete(a.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{a.title || "Astrologer"}</p>

                    {/* Rating */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star
                            key={s}
                            className={`h-3 w-3 ${s <= Math.round(a.rating) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium">{a.rating?.toFixed(1)}</span>
                      {(a.rating_count > 0) && (
                        <span className="text-xs text-muted-foreground">({a.rating_count})</span>
                      )}
                    </div>

                    {/* Specialties */}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {getSpecialties(a).slice(0, 3).map(s => (
                        <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">{s.trim()}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{a.total_readings} readings</span>
                    <span>{a.price_per_min} tkn/msg</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Online</span>
                    <Switch
                      checked={a.is_online}
                      onCheckedChange={() => toggleOnline(a.id, a.is_online)}
                      className="data-[state=checked]:bg-emerald-500 scale-90"
                    />
                  </div>
                </div>

                {/* Inactive overlay */}
                {!a.is_active && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center pointer-events-none">
                    <Badge variant="secondary" className="text-xs">Inactive</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Table View */}
      {!loading && astrologers.length > 0 && viewMode === "table" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Astrologer</th>
                    <th className="text-left px-4 py-3 font-medium">Specialties</th>
                    <th className="text-center px-4 py-3 font-medium">Rating</th>
                    <th className="text-center px-4 py-3 font-medium">Readings</th>
                    <th className="text-center px-4 py-3 font-medium">Price</th>
                    <th className="text-center px-4 py-3 font-medium">Online</th>
                    <th className="text-center px-4 py-3 font-medium">Active</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {astrologers.map(a => (
                    <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <AstrologerAvatar url={a.photo_url} name={a.name} size="sm" />
                          <div>
                            <p className="font-medium">{a.name}</p>
                            <p className="text-xs text-muted-foreground">{a.title || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {getSpecialties(a).slice(0, 3).map(s => (
                            <Badge key={s} variant="secondary" className="text-xs">{s.trim()}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                            {a.rating?.toFixed(1)}
                          </span>
                          {a.rating_count > 0 && (
                            <span className="text-[10px] text-muted-foreground">{a.rating_count} reviews</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">{a.total_readings}</td>
                      <td className="px-4 py-3 text-center">{a.price_per_min} tkn</td>
                      <td className="px-4 py-3 text-center">
                        <Switch
                          checked={a.is_online}
                          onCheckedChange={() => toggleOnline(a.id, a.is_online)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={a.is_active ? "default" : "secondary"}>
                          {a.is_active ? "Active" : "Inactive"}
                        </Badge>
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
                            <DropdownMenuItem onClick={() => openEdit(a)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateAstrologer(a.id, { is_active: !a.is_active }).then(fetchData)}
                            >
                              {a.is_active ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500" onClick={() => handleDelete(a.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
