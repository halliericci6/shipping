import { formatUsd } from "./format"
import type { CareFlag, LineItem, Quote, Service, Sex } from "@/lib/types"

export const RATE = {
  dispatchCents: 32500,
  centsPerMile: 225,
  extraHorseCentsPerMile: 48,
  privateCentsPerMile: 125,
  priorityShare: 0.32,
  layoverCents: 19500,
  papersCents: 5500,
  stallionCents: 8500,
  inFoalCents: 9500,
  seniorCents: 4500,
  medicationCents: 3500,
  /** A standard day is about 10 hours, near 470 miles at hauling speed. */
  mph: 47,
  sharedLayoverAfter: 500,
  sharedLayoverEvery: 470,
  priorityLayoverAfter: 680,
  priorityLayoverEvery: 620,
  maxHorses: 8,
} as const

export type PricedHorse = {
  sex: Sex
  flags: CareFlag[]
}

export function layoverNights(miles: number, service: Service): number {
  const after = service === "priority" ? RATE.priorityLayoverAfter : RATE.sharedLayoverAfter
  const every = service === "priority" ? RATE.priorityLayoverEvery : RATE.sharedLayoverEvery
  if (miles <= after) return 0
  return Math.ceil((miles - after) / every)
}

export function driveHours(miles: number): number {
  return Math.round((miles / RATE.mph) * 10) / 10
}

export function arrivalOffsetDays(miles: number, service: Service): number {
  return layoverNights(miles, service)
}

export function quoteHaul(input: {
  miles: number
  horses: PricedHorse[]
  service: Service
}): { ok: true; quote: Quote } | { ok: false; error: string } {
  const { miles, horses, service } = input
  if (!Number.isFinite(miles) || miles < 1) {
    return { ok: false, error: "Miles have to be a real haul." }
  }
  if (horses.length < 1) {
    return { ok: false, error: "Add at least one horse." }
  }
  if (horses.length > RATE.maxHorses) {
    return { ok: false, error: `A van on this desk carries up to ${RATE.maxHorses} horses.` }
  }

  const nights = layoverNights(miles, service)
  const lineItems: LineItem[] = []

  lineItems.push({
    id: "dispatch",
    label: "Dispatch",
    detail: "Hookup, first hay net, and the pre-trip",
    cents: RATE.dispatchCents,
  })

  lineItems.push({
    id: "miles",
    label: "Loaded miles",
    detail: `${miles.toLocaleString("en-US")} mi × ${formatUsd(RATE.centsPerMile)}`,
    cents: miles * RATE.centsPerMile,
  })

  const extraHorses = horses.length - 1
  if (extraHorses > 0) {
    lineItems.push({
      id: "extra-horses",
      label: "Additional horses",
      detail: `${extraHorses} × ${miles.toLocaleString("en-US")} mi × ${formatUsd(RATE.extraHorseCentsPerMile)}`,
      cents: extraHorses * miles * RATE.extraHorseCentsPerMile,
    })
  }

  if (service === "private" || service === "priority") {
    lineItems.push({
      id: "private",
      label: "Private van",
      detail: `${miles.toLocaleString("en-US")} mi × ${formatUsd(RATE.privateCentsPerMile)}`,
      cents: miles * RATE.privateCentsPerMile,
    })
  }

  if (service === "priority") {
    const rolling = lineItems
      .filter((item) => item.id === "miles" || item.id === "extra-horses" || item.id === "private")
      .reduce((sum, item) => sum + item.cents, 0)
    lineItems.push({
      id: "priority",
      label: "Priority",
      detail: "32% of the rolling charges, for a longer day and a dedicated tractor",
      cents: Math.round(rolling * RATE.priorityShare),
    })
  }

  if (nights > 0) {
    lineItems.push({
      id: "layover",
      label: nights === 1 ? "Overnight layover" : "Overnight layovers",
      detail: `${nights} × ${formatUsd(RATE.layoverCents)} at a layover barn`,
      cents: nights * RATE.layoverCents,
    })
  }

  lineItems.push({
    id: "papers",
    label: "Health papers",
    detail: "Coggins and a health certificate, filed with the rig",
    cents: RATE.papersCents,
  })

  const stallions = horses.filter((horse) => horse.sex === "stallion").length
  const inFoal = horses.filter((horse) => horse.sex === "mare" && horse.flags.includes("inFoal")).length
  const seniors = horses.filter((horse) => horse.flags.includes("senior")).length
  const meds = horses.filter((horse) => horse.flags.includes("medication")).length

  if (stallions > 0) {
    lineItems.push({
      id: "stallion",
      label: "Stallion compartment",
      detail: stallions === 1 ? "1 stallion, separated" : `${stallions} stallions, separated`,
      cents: stallions * RATE.stallionCents,
    })
  }
  if (inFoal > 0) {
    lineItems.push({
      id: "in-foal",
      label: "Mare in foal",
      detail: inFoal === 1 ? "Slower handling and a vet note on file" : `${inFoal} mares, slower handling`,
      cents: inFoal * RATE.inFoalCents,
    })
  }
  if (seniors > 0) {
    lineItems.push({
      id: "senior",
      label: "Senior care",
      detail: seniors === 1 ? "Extra checks for a horse 18 or older" : `${seniors} seniors, extra checks`,
      cents: seniors * RATE.seniorCents,
    })
  }
  if (meds > 0) {
    lineItems.push({
      id: "medication",
      label: "Medication on the road",
      detail: meds === 1 ? "A dose logged at each stop" : `${meds} horses with a dose at each stop`,
      cents: meds * RATE.medicationCents,
    })
  }

  const totalCents = lineItems.reduce((sum, item) => sum + item.cents, 0)

  return {
    ok: true,
    quote: {
      miles,
      driveHours: driveHours(miles),
      layoverNights: nights,
      arrivalOffsetDays: nights,
      lineItems,
      totalCents,
    },
  }
}

export const SERVICES: { id: Service; title: string; blurb: string }[] = [
  {
    id: "shared",
    title: "Shared",
    blurb: "A compartment on a van already heading that way.",
  },
  {
    id: "private",
    title: "Private",
    blurb: "The trailer is yours. Air-ride, and no extra horses added late.",
  },
  {
    id: "priority",
    title: "Priority",
    blurb: "A dedicated tractor, a longer day, and fewer overnights.",
  },
]

export function serviceLabel(service: Service): string {
  const found = SERVICES.find((item) => item.id === service)
  return found ? found.title : service
}
