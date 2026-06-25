"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { getPackages, createPackage, updatePackage, deletePackage } from "@/lib/api"
import {
  Plus, Pencil, Trash2, Coins, RefreshCw, X, Check, Sparkles, Zap, Star,
} from "lucide-react"

interface Package {
  id: string
  name: string
  description: string
  token_amount: number
  price_tl: number
  is_active: boolean
  is_featured: boolean
  sort_order: number
}

const EMPTY_FORM = {
  name: "",
  description: "",
  token_amount: "",
  price_tl: "",
  is_active: true,
  is_featured: false,
  sort_order: "0",
}

const PKG_COLORS = [
  "from-violet-600/20 to-violet-500/5 border-violet-500/30",
  "from-sky-600/20 to-sky-500/5 border-sky-500/30",
  "from-amber-600/20 to-amber-500/5 border-amber-500/30",
  "from-emerald-600/20 to-emerald-500/5 border-emerald-500/30",
  "from-pink-600/20 to-pink-500/5 border-pink-500/30",
]

export default function SettingsPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [error, setError] = useState("")

  const fetchData = useCallback(async () => {
    try {
      const res = await getPackages()
      setPackages(res.data ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => {
    setForm({ ...EMPTY_FORM })
    setEditingId(null)
    setShowCreate(true)
    setError("")
  }

  const openEdit = (pkg: Package) => {
    setForm({
      name: pkg.name,
      description: pkg.description,
      token_amount: String(pkg.token_amount),
      price_tl: String(pkg.price_tl),
      is_active: pkg.is_active,
      is_featured: pkg.is_featured,
      sort_order: String(pkg.sort_order),
    })
    setEditingId(pkg.id)
    setShowCreate(true)
    setError("")
  }

  const handleSave = async () => {
    if (!form.name || !form.token_amount || !form.price_tl) {
      setError("Name, token amount and price are required.")
      return
    }
    setSaving(true)
    setError("")
    try {
      const payload = {
        name: form.name,
        description: form.description,
        token_amount: parseInt(form.token_amount),
        price_tl: parseFloat(form.price_tl),
        is_active: form.is_active,
        is_featured: form.is_featured,
        sort_order: parseInt(form.sort_order) || 0,
      }
      if (editingId) {
        await updatePackage(editingId, payload)
      } else {
        await createPackage(payload)
      }
      setShowCreate(false)
      setEditingId(null)
      await fetchData()
    } catch (e: any) {
      setError(e.message ?? "Failed to save package")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await deletePackage(id)
      await fetchData()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleToggle = async (pkg: Package) => {
    try {
      await updatePackage(pkg.id, { is_active: !pkg.is_active })
      await fetchData()
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold font-heading tracking-tight">Token Packages</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage what users see on the Premium / Purchase screen
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Package
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Packages</p>
            <p className="text-2xl font-bold font-heading">{packages.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Active</p>
            <p className="text-2xl font-bold font-heading text-emerald-400">
              {packages.filter(p => p.is_active).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Featured</p>
            <p className="text-2xl font-bold font-heading text-amber-400">
              {packages.filter(p => p.is_featured).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create / Edit Modal */}
      {showCreate && (
        <Card className="border-violet-500/30 bg-violet-500/5">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-lg">
                {editingId ? "Edit Package" : "Create New Package"}
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowCreate(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Package Name *</Label>
                <Input placeholder="e.g. Starter Pack" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input placeholder="Short description shown to users" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Token Amount *</Label>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" type="number" placeholder="100" value={form.token_amount}
                    onChange={e => setForm(f => ({ ...f, token_amount: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Price (₺) *</Label>
                <Input type="number" step="0.01" placeholder="49.99" value={form.price_tl}
                  onChange={e => setForm(f => ({ ...f, price_tl: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Sort Order</Label>
                <Input type="number" placeholder="0" value={form.sort_order}
                  onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={form.is_active}
                  onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <span className="text-sm font-medium">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={form.is_featured}
                  onCheckedChange={v => setForm(f => ({ ...f, is_featured: v }))} />
                <span className="text-sm font-medium">Featured ⭐</span>
              </label>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                <Check className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create Package"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Packages Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Sparkles className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-heading text-lg mb-2">No Packages Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first token package to show on the purchase screen.</p>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Create Package</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((pkg, i) => (
              <Card
                key={pkg.id}
                className={`relative bg-gradient-to-br border ${PKG_COLORS[i % PKG_COLORS.length]} transition-all hover:scale-[1.01]`}
              >
                {pkg.is_featured && (
                  <div className="absolute -top-2.5 left-4">
                    <span className="text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="h-3 w-3" /> Featured
                    </span>
                  </div>
                )}
                <CardHeader className="pb-2 pt-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="font-heading text-base">{pkg.name}</CardTitle>
                      {pkg.description && (
                        <CardDescription className="text-xs mt-0.5">{pkg.description}</CardDescription>
                      )}
                    </div>
                    <Switch
                      checked={pkg.is_active}
                      onCheckedChange={() => handleToggle(pkg)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Coins className="h-4 w-4 text-amber-400" />
                      <span className="text-2xl font-bold font-heading">{pkg.token_amount.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">tokens</span>
                    </div>
                    <span className="text-xl font-bold font-heading text-emerald-400">
                      ₺{pkg.price_tl.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Zap className="h-3 w-3" />
                    {(pkg.token_amount / pkg.price_tl).toFixed(1)} tokens/₺ ·
                    Sort #{pkg.sort_order}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(pkg)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => handleDelete(pkg.id, pkg.name)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  )
}
