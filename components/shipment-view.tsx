"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
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
import { formatDay, formatMiles, formatUsd, formatWhen, plural } from "@/lib/format"
import { getHub, hubPlace } from "@/lib/hubs"
import { serviceLabel } from "@/lib/pricing"
import { cancelShipment } from "@/lib/store"
import type { Shipment } from "@/lib/types"
import { useShipments } from "@/lib/use-shipments"
import { cn } from "@/lib/utils"

export function ShipmentView({ id }: { id: string }) {
  const { shipments, mounted } = useShipments()
  const shipment = shipments.find((item) => item.id === id)
  if (!shipment && !mounted) return <HaulPending label="Pulling the haul slip…" />
  if (!shipment) return <MissingHaul />
  return <Slip shipment={shipment} />
}

export function HaulPending({ label }: { label: string }) {
  return (
    <div className={`${shell} py-20`}>
      <p className="text-xs tracking-[0.18em] text-brass-deep uppercase">Haul slip</p>
      <h1 className="mt-2 font-heading text-4xl">{label}</h1>
    </div>
  )
}

function MissingHaul() {
  return (
    <div className={`${shell} py-20`}>
      <p className="text-xs tracking-[0.18em] text-brass-deep uppercase">Haul slip</p>
      <h1 className="mt-2 font-heading text-4xl tracking-tight">That haul is not on this desk.</h1>
      <p className="mt-3 max-w-lg text-muted-foreground">
        It may have been cleared from this browser, or the reference was typed wrong.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button nativeButton={false} render={<Link href="/shipments" />} className="h-10">
          Haul board
        </Button>
        <Button nativeButton={false} render={<Link href="/quote" />} variant="outline" className="h-10">
          Request a quote
        </Button>
      </div>
    </div>
  )
}

function Slip({ shipment }: { shipment: Shipment }) {
  const origin = getHub(shipment.originId)
  const destination = getHub(shipment.destinationId)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelError, setCancelError] = useState("")
  const steps = timeline(shipment)

  useLayoutEffect(() => {
    return () => setCancelOpen(false)
  }, [])

  return (
    <div className={`${shell} py-8 sm:py-12`}>
      <Link href="/shipments" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Haul board
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusPill status={shipment.status} />
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
          {shipment.source === "yours" ? "Yours" : "Sample"}
        </span>
        <span className="font-mono text-xs text-muted-foreground">{shipment.id}</span>
      </div>
      <h1 className="mt-3 max-w-3xl font-heading text-4xl tracking-tight sm:text-5xl">
        {origin ? hubPlace(origin) : "Pickup"} to {destination ? hubPlace(destination) : "Delivery"}
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        {serviceLabel(shipment.service)} van · {formatMiles(shipment.miles)} · about {shipment.driveHours} hours rolling ·{" "}
        {plural(shipment.layoverNights, "overnight")}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-6">
          <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
            <div>
              <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">Pickup</p>
              <p className="mt-1 font-heading text-2xl">{origin ? hubPlace(origin) : shipment.originId}</p>
              <p className="text-sm text-muted-foreground">{origin?.yard}</p>
              <p className="mt-2 text-sm">{formatDay(shipment.departDate)}</p>
            </div>
            <div>
              <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">Delivery</p>
              <p className="mt-1 font-heading text-2xl">{destination ? hubPlace(destination) : shipment.destinationId}</p>
              <p className="text-sm text-muted-foreground">{destination?.yard}</p>
              <p className="mt-2 text-sm">
                {shipment.status === "delivered" ? "Delivered" : "ETA"} {formatDay(shipment.arrivalDate)}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-heading text-2xl">Horses</h2>
            <ul className="mt-4 divide-y divide-border">
              {shipment.horses.map((horse) => (
                <li key={horse.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium">{horse.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {horse.breed} · {horse.sex} · {horse.hands} hands
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{careLine(horse.flags, horse.sex)}</p>
                </li>
              ))}
            </ul>
          </section>

          {shipment.careStops.length > 0 ? (
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-heading text-2xl">Care log</h2>
              <ol className="mt-4 grid gap-4">
                {shipment.careStops.map((stop) => (
                  <li key={`${stop.at}-${stop.place}`} className="grid gap-1 border-l-2 border-brass pl-4">
                    <p className="text-xs text-muted-foreground">{formatWhen(stop.at)} · {stop.place}</p>
                    <p className="text-sm">{stop.note}</p>
                  </li>
                ))}
              </ol>
            </section>
          ) : (
            <section className="rounded-2xl border border-dashed border-border p-5">
              <h2 className="font-heading text-2xl">Care log</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {shipment.status === "cancelled"
                  ? "This haul was cancelled before it rolled."
                  : "Water, hay, and overnight notes show up here once the rig is rolling."}
              </p>
            </section>
          )}

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-heading text-2xl">Quote</h2>
            <ul className="mt-4 grid gap-2">
              {shipment.lineItems.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 text-sm">
                  <span>
                    <span className="block font-medium">{item.label}</span>
                    {item.detail ? <span className="block text-muted-foreground">{item.detail}</span> : null}
                  </span>
                  <span className="shrink-0 tabular-nums">{formatUsd(item.cents)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-baseline justify-between border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-heading text-3xl">{formatUsd(shipment.totalCents)}</span>
            </p>
          </section>
        </div>

        <div className="grid content-start gap-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-heading text-2xl">Shipper</h2>
            <dl className="mt-3 grid gap-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd>{shipment.shipper.name}</dd>
              </div>
              {shipment.shipper.barn ? (
                <div>
                  <dt className="text-muted-foreground">Barn</dt>
                  <dd>{shipment.shipper.barn}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-muted-foreground">Phone</dt>
                <dd>{shipment.shipper.phone}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="break-all">{shipment.shipper.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Driver</dt>
                <dd>{shipment.driver ?? "Assigned when the rig is confirmed."}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Health papers</dt>
                <dd>{shipment.papersReady ? "On file with the rig." : "Bring Coggins and a health certificate to pickup."}</dd>
              </div>
            </dl>
            {shipment.notes ? <p className="mt-4 border-t border-border pt-3 text-sm">{shipment.notes}</p> : null}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-heading text-2xl">Timeline</h2>
            <ol className="mt-4">
              {steps.map((step, index) => (
                <li key={step.title} className="grid grid-cols-[1rem_1fr] gap-3">
                  <span className="flex flex-col items-center">
                    <span
                      className={cn(
                        "mt-1.5 size-2.5 rounded-full",
                        step.state === "done" && "bg-ink",
                        step.state === "current" && "bg-brass ring-4 ring-brass/30",
                        step.state === "upcoming" && "border border-border bg-background",
                      )}
                    />
                    {index < steps.length - 1 ? <span className="w-px flex-1 bg-border" /> : null}
                  </span>
                  <div className="pb-4">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {shipment.status === "scheduled" ? (
            <div>
              {cancelError ? <p className="mb-2 text-sm text-destructive">{cancelError}</p> : null}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCancelError("")
                  setCancelOpen(true)
                }}
              >
                Cancel this haul
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel {shipment.id}?</DialogTitle>
            <DialogDescription>
              {origin && destination
                ? `${hubPlace(origin)} to ${hubPlace(destination)} comes off the schedule.`
                : "This haul comes off the schedule."}{" "}
              The slip stays on the board as cancelled.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCancelOpen(false)}>
              Keep it scheduled
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                const result = cancelShipment(shipment.id)
                if (!result.ok) {
                  setCancelError(result.error)
                  setCancelOpen(false)
                  return
                }
                setCancelOpen(false)
              }}
            >
              Cancel the haul
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function careLine(flags: Shipment["horses"][number]["flags"], sex: Shipment["horses"][number]["sex"]): string {
  const parts: string[] = []
  if (sex === "stallion") parts.push("Own compartment")
  if (flags.includes("inFoal")) parts.push("In foal")
  if (flags.includes("senior")) parts.push("Senior")
  if (flags.includes("medication")) parts.push("Medication")
  if (flags.includes("blankets")) parts.push("Blankets")
  return parts.length > 0 ? parts.join(" · ") : "Routine care"
}

function timeline(shipment: Shipment): { title: string; detail: string; state: "done" | "current" | "upcoming" }[] {
  if (shipment.status === "cancelled") {
    return [
      { title: "Booked", detail: formatDay(shipment.departDate), state: "done" },
      {
        title: "Cancelled",
        detail: shipment.cancelledAt ? formatWhen(shipment.cancelledAt) : "Cancelled before load-out",
        state: "current",
      },
    ]
  }
  const rolling = shipment.status === "in_transit" || shipment.status === "delivered"
  const delivered = shipment.status === "delivered"
  const papers = shipment.papersReady || rolling
  return [
    {
      title: "Booked",
      detail: `${serviceLabel(shipment.service)} · ${formatDay(shipment.departDate)}`,
      state: "done",
    },
    {
      title: "Health papers",
      detail: papers ? "Coggins and health certificate on file" : "Bring both to pickup",
      state: papers ? "done" : "current",
    },
    {
      title: "Loaded",
      detail: rolling ? (shipment.driver ? `With ${shipment.driver}` : "Horses on the rig") : "Waiting for load-out",
      state: rolling ? "done" : papers ? "current" : "upcoming",
    },
    {
      title: "On the road",
      detail: rolling
        ? `${plural(shipment.layoverNights, "overnight")} on the quote`
        : "The rig has not left",
      state: delivered ? "done" : rolling ? "current" : "upcoming",
    },
    {
      title: "Delivered",
      detail: delivered ? formatDay(shipment.arrivalDate) : `ETA ${formatDay(shipment.arrivalDate)}`,
      state: delivered ? "current" : "upcoming",
    },
  ]
}
