export type Service = "shared" | "private" | "priority"

export type Sex = "mare" | "gelding" | "stallion"

export type CareFlag = "inFoal" | "senior" | "medication" | "blankets"

export type ShipmentStatus = "scheduled" | "in_transit" | "delivered" | "cancelled"

export type Horse = {
  id: string
  name: string
  breed: string
  sex: Sex
  hands: string
  flags: CareFlag[]
}

export type LineItem = {
  id: string
  label: string
  detail: string
  cents: number
}

export type Quote = {
  miles: number
  driveHours: number
  layoverNights: number
  arrivalOffsetDays: number
  lineItems: LineItem[]
  totalCents: number
}

export type Shipper = {
  name: string
  phone: string
  email: string
  barn: string
}

export type CareStop = {
  at: string
  place: string
  note: string
}

export type StoreOverride = {
  status: ShipmentStatus
  cancelledAt?: string
}

export type SavedStore = {
  bookings: Shipment[]
  overrides: Record<string, StoreOverride>
}

export type Shipment = {
  id: string
  source: "sample" | "yours"
  status: ShipmentStatus
  originId: string
  destinationId: string
  horses: Horse[]
  departDate: string
  arrivalDate: string
  service: Service
  miles: number
  driveHours: number
  layoverNights: number
  lineItems: LineItem[]
  totalCents: number
  shipper: Shipper
  papersReady: boolean
  notes: string
  driver?: string
  careStops: CareStop[]
  createdAt: string
  cancelledAt?: string
}
