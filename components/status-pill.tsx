import { cn } from "@/lib/utils"
import type { ShipmentStatus } from "@/lib/types"

const label: Record<ShipmentStatus, string> = {
  scheduled: "Scheduled",
  in_transit: "In transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

const tone: Record<ShipmentStatus, string> = {
  scheduled: "bg-brass/25 text-foreground",
  in_transit: "bg-sage/15 text-sage",
  delivered: "bg-ink text-cream",
  cancelled: "bg-muted text-muted-foreground",
}

export function StatusPill({ status }: { status: ShipmentStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tone[status])}>
      {label[status]}
    </span>
  )
}
