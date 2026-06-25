"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, AlertCircle, Lightbulb, Info } from "lucide-react"

interface InsightCardProps {
  severity: string
  category: string
  title: string
  message: string
  suggestion: string
}

const severityConfig: Record<string, { icon: typeof AlertTriangle; bg: string; border: string; badge: string }> = {
  critical: { icon: AlertCircle, bg: "bg-red-500/5", border: "border-red-500/20", badge: "bg-red-500/10 text-red-500" },
  warning: { icon: AlertTriangle, bg: "bg-orange-500/5", border: "border-orange-500/20", badge: "bg-orange-500/10 text-orange-500" },
  opportunity: { icon: Lightbulb, bg: "bg-violet-500/5", border: "border-violet-500/20", badge: "bg-violet-500/10 text-violet-500" },
  info: { icon: Info, bg: "bg-blue-500/5", border: "border-blue-500/20", badge: "bg-blue-500/10 text-blue-500" },
}

export default function InsightCard({ severity, category, title, message, suggestion }: InsightCardProps) {
  const config = severityConfig[severity] ?? severityConfig.info
  const Icon = config.icon

  return (
    <Card className={`${config.bg} ${config.border} border`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-sm">{title}</h3>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase ${config.badge}`}>
                {severity}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">{category}</span>
            </div>
            <p className="text-sm text-muted-foreground">{message}</p>
            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50 italic">
              Suggestion: {suggestion}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
