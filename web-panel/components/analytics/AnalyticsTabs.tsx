"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Users, Coins, Layers, GitBranch, Lightbulb } from "lucide-react"

const tabs = [
  { name: "Overview", href: "/analytics", icon: BarChart3 },
  { name: "Users", href: "/analytics/users", icon: Users },
  { name: "Revenue", href: "/analytics/revenue", icon: Coins },
  { name: "Features", href: "/analytics/features", icon: Layers },
  { name: "Funnels", href: "/analytics/funnels", icon: GitBranch },
  { name: "Insights", href: "/analytics/insights", icon: Lightbulb },
]

export default function AnalyticsTabs() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    // Exact match for overview (/analytics, /analytics/)
    if (href === "/analytics") {
      return pathname === "/analytics" || pathname === "/analytics/"
    }
    // startsWith for sub-routes (handles trailing slash too)
    return pathname.startsWith(href)
  }

  return (
    <div className="flex items-center gap-1 border-b border-border pb-0 mb-6 overflow-x-auto">
      {tabs.map((tab) => {
        const active = isActive(tab.href)
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              active
                ? "border-violet-500 text-violet-500"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.name}
          </Link>
        )
      })}
    </div>
  )
}
