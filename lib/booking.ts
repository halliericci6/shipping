import { roadMiles } from "./geo"
import { addDays, todayISO } from "./format"
import { getHub } from "./hubs"
import { RATE, quoteHaul } from "./pricing"
import type { Horse, Service, Shipment, Shipper } from "./types"

export type BookInput = {
  originId: string
  destinationId: string
  horses: Horse[]
  departDate: string
  service: Service
  shipper: Shipper
  notes: string
  papersReady: boolean
  id?: string
  createdAt?: string
}

export type ShipperErrors = Partial<Record<"name" | "phone" | "email" | "notes" | "papers", string>>

export function validateShipper(input: {
  name: string
  phone: string
  email: string
  notes: string
  papersReady: boolean
}): ShipperErrors {
  const errors: ShipperErrors = {}
  if (input.name.trim().length < 2) errors.name = "Enter the shipper's name."
  if (input.phone.replace(/\D/g, "").length < 10) {
    errors.phone = "Enter a phone number with at least 10 digits."
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    errors.email = "Enter an email address."
  }
  if (input.notes.trim().length > 400) errors.notes = "Keep the driver note under 400 characters."
  if (!input.papersReady) {
    errors.papers = "Confirm the Coggins and health certificate will be at pickup."
  }
  return errors
}

export function buildBooking(
  input: BookInput,
  today = todayISO(),
): { ok: true; shipment: Shipment } | { ok: false; error: string } {
  const origin = getHub(input.originId)
  const destination = getHub(input.destinationId)
  if (!origin || !destination) return { ok: false, error: "Pick two hubs on this desk." }
  if (origin.id === destination.id) {
    return { ok: false, error: "Pickup and delivery are the same yard." }
  }
  if (input.horses.length < 1) return { ok: false, error: "Add at least one horse." }
  if (input.horses.length > RATE.maxHorses) {
    return { ok: false, error: `A van on this desk carries up to ${RATE.maxHorses} horses.` }
  }
  if (input.horses.some((horse) => horse.name.trim().length < 1)) {
    return { ok: false, error: "Name each horse." }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.departDate)) {
    return { ok: false, error: "Choose a ship date." }
  }
  if (input.departDate < today) return { ok: false, error: "That ship date has already passed." }

  const shipperErrors = validateShipper({
    name: input.shipper.name,
    phone: input.shipper.phone,
    email: input.shipper.email,
    notes: input.notes,
    papersReady: input.papersReady,
  })
  const firstError = Object.values(shipperErrors)[0]
  if (firstError) return { ok: false, error: firstError }

  const miles = roadMiles(origin, destination)
  const priced = quoteHaul({ miles, horses: input.horses, service: input.service })
  if (!priced.ok) return priced

  const horses = input.horses.map((horse) => ({
    ...horse,
    name: horse.name.trim(),
    flags: horse.sex === "mare" ? horse.flags : horse.flags.filter((flag) => flag !== "inFoal"),
  }))

  const shipment: Shipment = {
    id: input.id ?? `bb-${crypto.randomUUID().slice(0, 8)}`,
    source: "yours",
    status: "scheduled",
    originId: origin.id,
    destinationId: destination.id,
    horses,
    departDate: input.departDate,
    arrivalDate: addDays(input.departDate, priced.quote.arrivalOffsetDays),
    service: input.service,
    miles: priced.quote.miles,
    driveHours: priced.quote.driveHours,
    layoverNights: priced.quote.layoverNights,
    lineItems: priced.quote.lineItems,
    totalCents: priced.quote.totalCents,
    shipper: {
      name: input.shipper.name.trim(),
      phone: input.shipper.phone.trim(),
      email: input.shipper.email.trim(),
      barn: input.shipper.barn.trim(),
    },
    papersReady: true,
    notes: input.notes.trim(),
    careStops: [],
    createdAt: input.createdAt ?? new Date().toISOString(),
  }

  return { ok: true, shipment }
}
