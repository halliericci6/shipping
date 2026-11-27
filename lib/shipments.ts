import { addDays } from "./format"
import { roadMiles } from "./geo"
import { getHub } from "./hubs"
import { quoteHaul } from "./pricing"
import type { CareStop, Horse, SavedStore, Service, Shipment, ShipmentStatus, Shipper } from "./types"

const STATUSES: ShipmentStatus[] = ["scheduled", "in_transit", "delivered", "cancelled"]

function horse(
  id: string,
  name: string,
  breed: string,
  sex: Horse["sex"],
  hands: string,
  flags: Horse["flags"] = [],
): Horse {
  return { id, name, breed, sex, hands, flags }
}

function shipper(name: string, phone: string, email: string, barn: string): Shipper {
  return { name, phone, email, barn }
}

function sample(input: {
  id: string
  originId: string
  destinationId: string
  horses: Horse[]
  departDate: string
  service: Service
  status: ShipmentStatus
  shipper: Shipper
  papersReady: boolean
  notes: string
  driver?: string
  careStops?: CareStop[]
  createdAt: string
}): Shipment {
  const origin = getHub(input.originId)
  const destination = getHub(input.destinationId)
  if (!origin || !destination) throw new Error(`Missing hub for ${input.id}`)
  const miles = roadMiles(origin, destination)
  const priced = quoteHaul({ miles, horses: input.horses, service: input.service })
  if (!priced.ok) throw new Error(priced.error)
  return {
    id: input.id,
    source: "sample",
    status: input.status,
    originId: input.originId,
    destinationId: input.destinationId,
    horses: input.horses,
    departDate: input.departDate,
    arrivalDate: addDays(input.departDate, priced.quote.arrivalOffsetDays),
    service: input.service,
    miles: priced.quote.miles,
    driveHours: priced.quote.driveHours,
    layoverNights: priced.quote.layoverNights,
    lineItems: priced.quote.lineItems,
    totalCents: priced.quote.totalCents,
    shipper: input.shipper,
    papersReady: input.papersReady,
    notes: input.notes,
    driver: input.driver,
    careStops: input.careStops ?? [],
    createdAt: input.createdAt,
  }
}

export const SEEDS: Shipment[] = [
  sample({
    id: "bb-1842",
    originId: "lexington-ky",
    destinationId: "wellington-fl",
    horses: [
      horse("mp", "Matchpoint", "Dutch Warmblood", "gelding", "17.0", ["blankets"]),
      horse("sn", "Sable Note", "Hanoverian", "mare", "16.1", ["inFoal"]),
    ],
    departDate: "2026-11-25",
    service: "private",
    status: "in_transit",
    shipper: shipper("Clare Donovan", "(859) 555-0142", "clare.donovan@example.com", "Donova Farm"),
    papersReady: true,
    notes: "Sable Note gets soaked beet pulp at each layover. Blanket Matchpoint if it drops under 45°F.",
    driver: "Nia Cole",
    createdAt: "2026-11-20T15:04:00-05:00",
    careStops: [
      {
        at: "2026-11-25T06:12:00-05:00",
        place: "Kentucky Horse Park",
        note: "Loaded both horses. Beet pulp for Sable Note is in the tack room.",
      },
      {
        at: "2026-11-25T10:25:00-05:00",
        place: "Knoxville, TN",
        note: "Water and hay. Both drank. Blankets stayed off.",
      },
      {
        at: "2026-11-25T19:10:00-05:00",
        place: "Macon, GA",
        note: "Overnight at a layover barn. Beet pulp fed. Hay nets refilled.",
      },
      {
        at: "2026-11-26T13:20:00-05:00",
        place: "Lake City, FL",
        note: "Water and hay. Sable Note ate. Overnight tonight is booked in Ocala, then Wellington.",
      },
    ],
  }),
  sample({
    id: "bb-1855",
    originId: "weatherford-tx",
    destinationId: "franklin-tn",
    horses: [horse("ch", "Cutter's Honor", "Quarter Horse", "stallion", "15.0")],
    departDate: "2026-11-26",
    service: "private",
    status: "in_transit",
    shipper: shipper("Harlan Peck", "(817) 555-0194", "harlan.peck@example.com", "Peck Performance Horses"),
    papersReady: true,
    notes: "Front compartment. He loads quietly if the handler goes in first.",
    driver: "Amos Reid",
    createdAt: "2026-11-22T11:18:00-05:00",
    careStops: [
      {
        at: "2026-11-26T05:40:00-05:00",
        place: "Weatherford, TX",
        note: "Stallion loaded in the front compartment. No neighbors on the trailer.",
      },
      {
        at: "2026-11-26T11:05:00-05:00",
        place: "Texarkana, TX",
        note: "Water stop. Ate and drank. Overnight tonight is west of Little Rock.",
      },
    ],
  }),
  sample({
    id: "bb-1860",
    originId: "ocala-fl",
    destinationId: "tryon-nc",
    horses: [horse("kr", "King's Ransom", "Thoroughbred", "gelding", "16.2", ["medication"])],
    departDate: "2026-12-04",
    service: "private",
    status: "scheduled",
    shipper: shipper("June Abebe", "(352) 555-0177", "june.abebe@example.com", "Abebe Eventing"),
    papersReady: false,
    notes: "Bute in the morning, logged at the first stop. He ships in a leather halter.",
    createdAt: "2026-11-24T09:40:00-05:00",
  }),
  sample({
    id: "bb-1866",
    originId: "thermal-ca",
    destinationId: "scottsdale-az",
    horses: [
      horse("bi", "Biscuit", "Welsh pony", "gelding", "13.2", ["blankets"]),
      horse("pi", "Pimm's", "Welsh pony", "mare", "13.1"),
    ],
    departDate: "2026-12-12",
    service: "shared",
    status: "scheduled",
    shipper: shipper("Rosa Vidal", "(760) 555-0118", "rosa.vidal@example.com", "Vidal Ponies"),
    papersReady: true,
    notes: "They travel side by side. Biscuit wears a blanket at night.",
    createdAt: "2026-11-23T16:02:00-05:00",
  }),
  sample({
    id: "bb-1790",
    originId: "aiken-sc",
    destinationId: "devon-pa",
    horses: [horse("aa", "After All", "Thoroughbred", "mare", "16.0", ["senior"])],
    departDate: "2026-11-14",
    service: "shared",
    status: "delivered",
    shipper: shipper("Ellen Shaw", "(803) 555-0160", "ellen.shaw@example.com", "Shaw Stables"),
    papersReady: true,
    notes: "Senior mare. Offer water before hay.",
    driver: "Nia Cole",
    createdAt: "2026-11-08T13:12:00-05:00",
    careStops: [
      {
        at: "2026-11-14T06:05:00-05:00",
        place: "Aiken training track",
        note: "Loaded. Walked on sound. Papers in the cab.",
      },
      {
        at: "2026-11-14T12:40:00-05:00",
        place: "Durham, NC",
        note: "Water and hay. Drank well.",
      },
      {
        at: "2026-11-14T18:55:00-05:00",
        place: "Fredericksburg, VA",
        note: "Overnight layover. Extra water before the hay net.",
      },
      {
        at: "2026-11-15T14:10:00-05:00",
        place: "Devon Horse Show",
        note: "Delivered to the shipper's groom. Walked off sound.",
      },
    ],
  }),
  sample({
    id: "bb-1802",
    originId: "middleburg-va",
    destinationId: "saratoga-ny",
    horses: [horse("nw", "North Wind", "Irish Sport Horse", "gelding", "16.3")],
    departDate: "2026-11-18",
    service: "shared",
    status: "delivered",
    shipper: shipper("Patrick Byrne", "(540) 555-0133", "patrick.byrne@example.com", "Byrne Sport Horses"),
    papersReady: true,
    notes: "Ships in a rope halter. No blanket unless it rains.",
    driver: "Amos Reid",
    createdAt: "2026-11-12T10:24:00-05:00",
    careStops: [
      {
        at: "2026-11-18T05:50:00-05:00",
        place: "Great Meadow",
        note: "Loaded at first light.",
      },
      {
        at: "2026-11-18T11:15:00-05:00",
        place: "Harrisburg, PA",
        note: "Water and hay. Quiet the whole leg.",
      },
      {
        at: "2026-11-18T16:40:00-05:00",
        place: "Oklahoma training track",
        note: "Delivered. Groom signed the slip.",
      },
    ],
  }),
]

export const EMPTY_STORE: SavedStore = { bookings: [], overrides: {} }

const RANK: Record<ShipmentStatus, number> = {
  in_transit: 0,
  scheduled: 1,
  delivered: 2,
  cancelled: 3,
}

export function mergeShipments(store: SavedStore): Shipment[] {
  const seeds = SEEDS.map((seed) => {
    const override = store.overrides[seed.id]
    if (!override || !STATUSES.includes(override.status)) return seed
    return { ...seed, status: override.status, cancelledAt: override.cancelledAt }
  })
  const yours = store.bookings.filter((booking) => STATUSES.includes(booking.status))
  return [...yours, ...seeds].sort((a, b) => {
    if (RANK[a.status] !== RANK[b.status]) return RANK[a.status] - RANK[b.status]
    if (a.status === "scheduled" || a.status === "in_transit") {
      return a.departDate.localeCompare(b.departDate) || a.id.localeCompare(b.id)
    }
    return b.departDate.localeCompare(a.departDate) || a.id.localeCompare(b.id)
  })
}

export function cancelInStore(
  store: SavedStore,
  id: string,
  at: string,
): { ok: true; store: SavedStore } | { ok: false; error: string } {
  const shipment = mergeShipments(store).find((item) => item.id === id)
  if (!shipment) return { ok: false, error: "That haul is not on this desk." }
  if (shipment.status !== "scheduled") {
    return { ok: false, error: "Only a scheduled haul can be cancelled." }
  }
  if (shipment.source === "yours") {
    return {
      ok: true,
      store: {
        ...store,
        bookings: store.bookings.map((booking) =>
          booking.id === id ? { ...booking, status: "cancelled", cancelledAt: at } : booking,
        ),
      },
    }
  }
  return {
    ok: true,
    store: {
      ...store,
      overrides: { ...store.overrides, [id]: { status: "cancelled", cancelledAt: at } },
    },
  }
}
