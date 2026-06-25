"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getToken, decodeJwt } from "@/lib/api"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push('/login')
      return
    }
    const payload = decodeJwt(token)
    if (!payload || payload.role !== 'admin') {
      router.push('/login')
    }
  }, [router])

  return <>{children}</>
}
