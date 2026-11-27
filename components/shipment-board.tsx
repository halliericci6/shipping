"use client"

import Link from "next/link"
import { useLayoutEffect, useState } from "react"
import { shell } from "@/components/shell"
import { StatusPill } from "@/components/status-pill"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDay, formatUsd, plural } from "@/lib/format"
import { getHub, hubPlace } from "@/lib/hubs"
import { serviceLabel } from "@/lib/pricing"
import { clearSavedChanges, savedChangeCount } from "@/lib/store"
import type { Shipment, ShipmentStatus } from "@/lib/types"
import { useShipments } from "@/lib/use-shipments"
import { cn } from "@/lib/utils"

const FILTERS: { id: "all" | ShipmentStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in_transit", label: "In transit" },
  { id: "scheduled", label: "Scheduled" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
]

export function ShipmentBoard() {
  const { shipments, raw } = useShipments()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all")
  const [clearOpen, setClearOpen] = useState(false)
  const [clearError, setClearError] = useState("")
  const saved = savedChangeCount(raw)

  useLayoutEffect(() => {
    return () => setClearOpen(false)
  }, [])

  const visible = shipments.filter((shipment) => filter === "all" || shipment.status === filter)

  return (
    <div className={`${shell} py-8 sm:py-12`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.18em] text-brass-deep uppercase">Haul board</p>
          <h1 className="mt-2 font-heading text-4xl tracking-tight sm:text-5xl">Who is on a rig.</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Sample hauls show a trip already moving. Hauls you book are marked Yours and stay in this browser.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/quote" />} className="h-12">
          Request a quote
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter hauls">
        {FILTERS.map((item) => {
          const count = item.id === "all" ? shipments.length : shipments.filter((shipment) => shipment.status === item.id).length
          const selected = filter === item.id
          return (
            <Button
              key={item.id}
              type="button"
              variant={selected ? "default" : "outline"}
              className="h-10"
              aria-pressed={selected}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
              <span className={cn("tabular-nums", selected ? "text-cream/70" : "text-muted-foreground")}>{count}</span>
            </Button>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <h2 className="font-heading text-3xl">{emptyTitle(filter)}</h2>
          <p className="mt-2 text-muted-foreground">Send a quote request and it will show up here as scheduled.</p>
          <Button nativeButton={false} render={<Link href="/quote" />} className="mt-5 h-12">
            Request a quote
          </Button>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {visible.map((shipment) => (
            <li key={shipment.id}>
              <HaulCard shipment={shipment} />
            </li>
          ))}
        </ul>
      )}

      {saved > 0 ? (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>{plural(saved, "change")} saved in this browser.</p>
          <Button type="button" variant="ghost" onClick={() => { setClearError(""); setClearOpen(true) }}>
            Clear saved changes
          </Button>
        </div>
      ) : null}

      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear hauls saved in this browser?</DialogTitle>
            <DialogDescription>
              Your bookings are removed. Cancelled sample hauls go back to the schedule. The sample trips themselves stay.
            </DialogDescription>
          </DialogHeader>
          {clearError ? <p className="text-sm text-destructive">{clearError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setClearOpen(false)}>
              Keep them
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                const result = clearSavedChanges()
                if (!result.ok) {
                  setClearError(result.error)
                  return
                }
                setClearOpen(false)
              }}
            >
              Clear saved changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function emptyTitle(filter: (typeof FILTERS)[number]["id"]): string {
  if (filter === "in_transit") return "Nothing is in transit."
  if (filter === "scheduled") return "Nothing is scheduled."
  if (filter === "delivered") return "Nothing has been delivered."
  if (filter === "cancelled") return "Nothing has been cancelled."
  return "The board is clear."
}

function HaulCard({ shipment }: { shipment: Shipment }) {
  const origin = getHub(shipment.originId)
  const destination = getHub(shipment.destinationId)
  const names = shipment.horses.map((horse) => horse.name).join(", ")
  return (
    <Link
      href={`/shipments/${shipment.id}`}
      className="grid gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-brass sm:grid-cols-[1fr_auto] sm:p-5"
    >
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={shipment.status} />
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
            {shipment.source === "yours" ? "Yours" : "Sample"}
          </span>
          <span className="font-mono text-xs text-muted-foreground">{shipment.id}</span>
        </div>
        <p className="font-heading text-2xl tracking-tight">
          {origin ? hubPlace(origin) : "Pickup"} to {destination ? hubPlace(destination) : "Delivery"}
        </p>
        <p className="text-sm text-muted-foreground">
          {names} · {serviceLabel(shipment.service)} · {formatDay(shipment.departDate)}
          {shipment.arrivalDate !== shipment.departDate ? ` – ${formatDay(shipment.arrivalDate)}` : ""}
        </p>
      </div>
      <p className="font-heading text-2xl sm:text-right">{formatUsd(shipment.totalCents)}</p>
    </Link>
  )
}
