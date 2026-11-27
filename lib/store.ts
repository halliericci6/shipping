import { buildBooking, type BookInput } from "./booking"
import { cancelInStore, EMPTY_STORE, mergeShipments } from "./shipments"
import type { SavedStore, Shipment } from "./types"

export const STORE_KEY = "barnbound.shipments.v1"
const STORE_EVENT = "barnbound-store"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isShipment(value: unknown): value is Shipment {
  if (!isRecord(value)) return false
  const horses = value.horses
  const shipper = value.shipper
  const status = value.status
  return (
    typeof value.id === "string" &&
    (value.source === "yours" || value.source === "sample") &&
    (status === "scheduled" || status === "in_transit" || status === "delivered" || status === "cancelled") &&
    typeof value.originId === "string" &&
    typeof value.destinationId === "string" &&
    Array.isArray(horses) &&
    typeof value.departDate === "string" &&
    typeof value.service === "string" &&
    typeof value.totalCents === "number" &&
    Array.isArray(value.lineItems) &&
    Array.isArray(value.careStops) &&
    isRecord(shipper) &&
    typeof shipper.name === "string"
  )
}

export function parseStore(raw: string): SavedStore {
  if (!raw) return EMPTY_STORE
  try {
    const value = JSON.parse(raw) as unknown
    if (!isRecord(value)) return EMPTY_STORE
    const bookings = Array.isArray(value.bookings) ? value.bookings.filter(isShipment) : []
    const overrides: SavedStore["overrides"] = {}
    if (isRecord(value.overrides)) {
      for (const [id, entry] of Object.entries(value.overrides)) {
        if (!isRecord(entry)) continue
        const status = entry.status
        if (status !== "scheduled" && status !== "in_transit" && status !== "delivered" && status !== "cancelled") {
          continue
        }
        overrides[id] = {
          status,
          cancelledAt: typeof entry.cancelledAt === "string" ? entry.cancelledAt : undefined,
        }
      }
    }
    return { bookings, overrides }
  } catch {
    return EMPTY_STORE
  }
}

export function subscribe(onStore: () => void): () => void {
  const listener = () => onStore()
  window.addEventListener("storage", listener)
  window.addEventListener(STORE_EVENT, listener)
  return () => {
    window.removeEventListener("storage", listener)
    window.removeEventListener(STORE_EVENT, listener)
  }
}

export function getSnapshot(): string {
  try {
    return localStorage.getItem(STORE_KEY) ?? ""
  } catch {
    return ""
  }
}

export function getServerSnapshot(): string {
  return ""
}

function writeStore(store: SavedStore): boolean {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store))
    window.dispatchEvent(new Event(STORE_EVENT))
    return true
  } catch {
    return false
  }
}

export function bookShipment(
  input: BookInput,
): { ok: true; shipment: Shipment } | { ok: false; error: string } {
  const built = buildBooking(input)
  if (!built.ok) return built
  const store = parseStore(getSnapshot())
  const next: SavedStore = { ...store, bookings: [built.shipment, ...store.bookings] }
  if (!writeStore(next)) {
    return { ok: false, error: "This browser blocked saving the haul. The quote is still here." }
  }
  return built
}

export function cancelShipment(id: string): { ok: true } | { ok: false; error: string } {
  const store = parseStore(getSnapshot())
  const next = cancelInStore(store, id, new Date().toISOString())
  if (!next.ok) return next
  if (!writeStore(next.store)) return { ok: false, error: "This browser blocked the update." }
  return { ok: true }
}

export function clearSavedChanges(): { ok: true } | { ok: false; error: string } {
  if (!writeStore(EMPTY_STORE)) return { ok: false, error: "This browser blocked the update." }
  return { ok: true }
}

export function savedChangeCount(raw: string): number {
  const store = parseStore(raw)
  return store.bookings.length + Object.keys(store.overrides).length
}

export function shipmentsFrom(raw: string): Shipment[] {
  return mergeShipments(parseStore(raw))
}
