"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

interface FeatureBarProps {
  name: string
  uniqueUsers: number
  totalUses: number
  adoption: number
  trend: number
  repeatRate: number
  tokenCost: number
  revenue: number
}

export default function FeatureBar({ name, uniqueUsers, totalUses, adoption, trend, repeatRate, tokenCost, revenue }: FeatureBarProps) {
  return (
    <Card className="hover:border-violet-500/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">{name}</h3>
          <div className="flex items-center gap-1 text-xs">
            {trend > 0 ? (
              <><TrendingUp className="h-3 w-3 text-emerald-500" /><span className="text-emerald-500">+{trend.toFixed(1)}%</span></>
            ) : trend < 0 ? (
              <><TrendingDown className="h-3 w-3 text-red-500" /><span className="text-red-500">{trend.toFixed(1)}%</span></>
            ) : (
              <span className="text-muted-foreground">0%</span>
            )}
          </div>
        </div>
        <div className="relative w-full h-2 bg-muted rounded-full mb-3">
          <div
            className="absolute h-full bg-violet-500 rounded-full transition-all"
            style={{ width: `${Math.min(adoption, 100)}%` }}
          />
        </div>
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Users</p>
            <p className="font-medium">{uniqueUsers.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Uses</p>
            <p className="font-medium">{totalUses.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Adoption</p>
            <p className="font-medium">{adoption.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Repeat</p>
            <p className="font-medium">{repeatRate.toFixed(1)}x</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
          <span>Cost: {tokenCost} tokens</span>
          <span>Revenue: {revenue.toLocaleString()} tokens</span>
        </div>
      </CardContent>
    </Card>
  )
}
