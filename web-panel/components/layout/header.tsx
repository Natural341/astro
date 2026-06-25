"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, User, LogOut, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getToken, decodeJwt, clearToken } from "@/lib/api"

export function Header() {
  const router = useRouter()
  const [adminEmail, setAdminEmail] = useState<string>("")

  useEffect(() => {
    const token = getToken()
    if (token) {
      const payload = decodeJwt(token)
      if (payload?.email) setAdminEmail(payload.email)
    }
  }, [])

  const handleLogout = () => {
    clearToken()
    router.push("/login")
  }

  return (
    <div className="flex items-center px-6 border-b h-16 bg-background/80 backdrop-blur-sm">
      <div className="flex items-center flex-1">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users, astrologers..."
            className="w-[300px] lg:w-[400px] bg-muted/50 pl-8 border-0 focus-visible:ring-1"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 rounded-full pl-2 pr-3 h-9">
              <div className="flex items-center justify-center h-7 w-7 rounded-full bg-violet-500/15">
                <Shield className="h-3.5 w-3.5 text-violet-500" />
              </div>
              {adminEmail && (
                <span className="text-xs text-muted-foreground max-w-[160px] truncate hidden lg:block">
                  {adminEmail}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Admin</p>
                {adminEmail && (
                  <p className="text-xs text-muted-foreground truncate">{adminEmail}</p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
