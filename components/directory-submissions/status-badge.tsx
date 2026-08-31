import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  statusLabels,
  type CampaignStatus,
  type JobStatus,
} from "@/features/directory-submissions/config"

const statusStyles: Record<CampaignStatus | JobStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  awaiting_payment: "border-amber-200 bg-amber-50 text-amber-900",
  cancelled: "border-rose-200 bg-rose-50 text-rose-800",
  completed: "border-teal-200 bg-teal-50 text-teal-800",
  draft: "border-slate-200 bg-slate-50 text-slate-700",
  live: "border-emerald-200 bg-emerald-50 text-emerald-800",
  needs_action: "border-amber-200 bg-amber-50 text-amber-900",
  processing: "border-blue-200 bg-blue-50 text-blue-800",
  queued: "border-slate-200 bg-slate-50 text-slate-700",
  rejected: "border-red-200 bg-red-50 text-red-800",
  skipped: "border-slate-200 bg-slate-50 text-slate-500",
  submitted: "border-indigo-200 bg-indigo-50 text-indigo-800",
}

export function DirectoryStatusBadge({
  status,
}: {
  status: CampaignStatus | JobStatus
}) {
  return (
    <Badge
      variant="outline"
      className={cn("whitespace-nowrap", statusStyles[status])}
    >
      {statusLabels[status]}
    </Badge>
  )
}
