// ─── Admin Panel API Client ────────────────────────────────────────────────────
// All admin endpoints require JWT stored in localStorage under 'admin_jwt'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://192.168.1.23:8080'

// ── Token helpers ──────────────────────────────────────────────────────────────
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('admin_jwt')
}

export const setToken = (token: string) => {
  localStorage.setItem('admin_jwt', token)
}

export const clearToken = () => {
  localStorage.removeItem('admin_jwt')
}

export const decodeJwt = (token: string): Record<string, any> | null => {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

// ── Core fetch wrapper ─────────────────────────────────────────────────────────
export async function adminFetch<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })

  if (res.status === 401 || res.status === 403) {
    clearToken()
    if (typeof window !== 'undefined') window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  const data = await res.json()
  if (!data.success) throw new Error(data.error ?? 'API error')
  return data
}

// ── Auth ───────────────────────────────────────────────────────────────────────
export const login = (email: string, password: string) =>
  adminFetch('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

// ── Analytics (legacy) ────────────────────────────────────────────────────────
export const getAnalytics = () =>
  adminFetch('/api/v1/admin/analytics')

// ── Advanced Analytics (Sprint 7) ─────────────────────────────────────────────
export const getAnalyticsOverview = (period: '7' | '30' | '90' = '30') =>
  adminFetch(`/api/v1/admin/analytics/overview?period=${period}`)

export const getAnalyticsUsers = () =>
  adminFetch('/api/v1/admin/analytics/users')

export const getAnalyticsRevenue = (period: '7' | '30' | '90' = '30') =>
  adminFetch(`/api/v1/admin/analytics/revenue?period=${period}`)

export const getAnalyticsFeatures = (period: '7' | '30' | '90' = '30') =>
  adminFetch(`/api/v1/admin/analytics/features?period=${period}`)

export const getAnalyticsFunnels = (period: '7' | '30' | '90' = '30') =>
  adminFetch(`/api/v1/admin/analytics/funnels?period=${period}`)

export const getAnalyticsInsights = () =>
  adminFetch('/api/v1/admin/analytics/insights')

export const runAggregation = (date?: string) =>
  adminFetch(`/api/v1/admin/analytics/run-aggregation${date ? `?date=${date}` : ''}`, {
    method: 'POST',
  })

// ── Users ─────────────────────────────────────────────────────────────────────
export const getUsers = (page = 1, limit = 20, search = '') =>
  adminFetch(
    `/api/v1/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
  )

export const updateUser = (id: string, data: object) =>
  adminFetch(`/api/v1/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

export const adjustTokens = (
  id: string,
  amount: number,
  action: 'add' | 'remove',
  description = 'Admin adjustment',
) =>
  adminFetch(`/api/v1/admin/users/${id}/tokens`, {
    method: 'POST',
    body: JSON.stringify({ amount, action, description }),
  })

export const deleteUser = (id: string) =>
  adminFetch(`/api/v1/admin/users/${id}`, { method: 'DELETE' })

// ── Astrologers ───────────────────────────────────────────────────────────────
export const getAdminAstrologers = () =>
  adminFetch('/api/v1/admin/astrologers')

export const updateAstrologer = (id: string, data: object) =>
  adminFetch(`/api/v1/admin/astrologers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

export const createAstrologer = (data: object) =>
  adminFetch('/api/v1/admin/astrologers', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const deleteAstrologer = (id: string) =>
  adminFetch(`/api/v1/admin/astrologers/${id}`, { method: 'DELETE' })

export async function uploadAstrologerPhoto(file: File): Promise<{ success: boolean; url: string }> {
  const token = getToken()
  const formData = new FormData()
  formData.append('photo', file)
  const res = await fetch(`${BASE_URL}/api/v1/admin/astrologers/upload-photo`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (res.status === 401 || res.status === 403) {
    clearToken()
    if (typeof window !== 'undefined') window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  const data = await res.json()
  if (!data.success) throw new Error(data.error ?? 'Upload failed')
  return data
}

// ── Transactions / Revenue ────────────────────────────────────────────────────
export const getTransactions = (page = 1, limit = 50, type = '') =>
  adminFetch(
    `/api/v1/admin/transactions?page=${page}&limit=${limit}${type ? `&type=${type}` : ''}`,
  )

// ── Reports ───────────────────────────────────────────────────────────────────
export const getReports = (status = '') =>
  adminFetch(`/api/v1/admin/reports${status ? `?status=${status}` : ''}`)

export const updateReport = (id: string, status: string, adminNote = '') =>
  adminFetch(`/api/v1/admin/reports/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status, admin_note: adminNote }),
  })

// ── Applications ──────────────────────────────────────────────────────────────
export const getApplications = () =>
  adminFetch('/api/v1/admin/applications')

export const reviewApplication = (
  id: string,
  status: 'approved' | 'rejected',
  adminNote = '',
) =>
  adminFetch(`/api/v1/admin/applications/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status, admin_note: adminNote }),
  })

// ── Token Packages ────────────────────────────────────────────────────────────
export const getPackages = () =>
  adminFetch('/api/v1/admin/packages')

export const createPackage = (data: object) =>
  adminFetch('/api/v1/admin/packages', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const updatePackage = (id: string, data: object) =>
  adminFetch(`/api/v1/admin/packages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

export const deletePackage = (id: string) =>
  adminFetch(`/api/v1/admin/packages/${id}`, { method: 'DELETE' })

// ── Campaigns ─────────────────────────────────────────────────────────────────
export const getCampaigns = () =>
  adminFetch('/api/v1/admin/campaigns')

export const createCampaign = (data: object) =>
  adminFetch('/api/v1/admin/campaigns', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const toggleCampaign = (id: string, status: 'active' | 'paused' | 'expired') =>
  adminFetch(`/api/v1/admin/campaigns/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })

// ── Streaks ───────────────────────────────────────────────────────────────────
export const getStreaks = () =>
  adminFetch('/api/v1/admin/streaks')

// ── Referrals ─────────────────────────────────────────────────────────────────
export const getReferrals = () =>
  adminFetch('/api/v1/admin/referrals')
