"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { clearToken } from "@/lib/api"
import {
  LayoutDashboard,
  Users,
  Star,
  MessageSquare,
  Coins,
  Bell,
  BarChart3,
  Flag,
  UserCheck,
  LogOut,
  Sparkles,
  Share2,
} from "lucide-react"

const navSections = [
  {
    header: "Main",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/", color: "text-sky-500", exact: true },
      { label: "Analytics", icon: BarChart3, href: "/analytics", color: "text-blue-500" },
    ],
  },
  {
    header: "Management",
    items: [
      { label: "Users", icon: Users, href: "/users", color: "text-violet-500" },
      { label: "Astrologers", icon: Star, href: "/astrologers", color: "text-pink-500" },
      { label: "Applications", icon: UserCheck, href: "/applications", color: "text-violet-600" },
      { label: "Reports", icon: Flag, href: "/reports", color: "text-red-500" },
      { label: "Referrals", icon: Share2, href: "/referrals", color: "text-cyan-500" },
    ],
  },
  {
    header: "Finance",
    items: [
      { label: "Revenue", icon: Coins, href: "/revenue", color: "text-emerald-500" },
      { label: "Token Packages", icon: Sparkles, href: "/settings", color: "text-amber-500" },
      { label: "Campaigns", icon: Bell, href: "/campaigns", color: "text-orange-500" },
    ],
  },
  {
    header: "Content",
    items: [
      { label: "Readings", icon: MessageSquare, href: "/content", color: "text-orange-500" },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    clearToken()
    router.push("/login")
  }

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Brand */}
      <div className="px-6 pt-6 pb-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold font-heading bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">
            Kosmos
          </span>
        </Link>
      </div>

      {/* Nav sections */}
      <div className="flex-1 overflow-y-auto px-3 space-y-6">
        {navSections.map((section) => (
          <div key={section.header}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold px-3 mb-2">
              {section.header}
            </p>
            <div className="space-y-0.5">
              {section.items.map((route) => {
                const isActive = route.exact
                  ? pathname === route.href || pathname === route.href + "/"
                  : pathname === route.href || pathname.startsWith(route.href + "/")
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                      "text-sm group flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all relative",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-violet-500" />
                    )}
                    <route.icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? route.color : "text-muted-foreground/60")} />
                    {route.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-sm text-sidebar-foreground/60 hover:text-red-400 hover:bg-sidebar-accent/50 rounded-lg transition-all font-medium"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Log out
        </button>
      </div>
    </div>
  )
}
