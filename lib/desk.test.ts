import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildBooking } from "./booking"
import { addDays } from "./format"
import { roadMiles } from "./geo"
import { getHub } from "./hubs"
import { driveHours, layoverNights, quoteHaul } from "./pricing"
import { cancelInStore, EMPTY_STORE, mergeShipments, SEEDS } from "./shipments"
import type { Horse } from "./types"

function gelding(): Horse {
  return { id: "h1", name: "Test Horse", breed: "Thoroughbred", sex: "gelding", hands: "16.0", flags: [] }
}

describe("road miles", () => {
  it("prices Lexington to Wellington as a long haul", () => {
    const miles = roadMiles(getHub("lexington-ky")!, getHub("wellington-fl")!)
    assert.equal(miles, 1039)
  })

  it("keeps Thermal to Scottsdale inside a single driving day", () => {
    const miles = roadMiles(getHub("thermal-ca")!, getHub("scottsdale-az")!)
    assert.equal(miles, 310)
    assert.equal(layoverNights(miles, "shared"), 0)
  })
})

describe("layovers", () => {
  it("starts a shared overnight after 500 miles", () => {
    assert.equal(layoverNights(500, "shared"), 0)
    assert.equal(layoverNights(501, "shared"), 1)
    assert.equal(layoverNights(970, "shared"), 1)
    assert.equal(layoverNights(971, "shared"), 2)
  })

  it("lets a priority run go farther before an overnight", () => {
    assert.equal(layoverNights(680, "priority"), 0)
    assert.equal(layoverNights(681, "priority"), 1)
    assert.equal(layoverNights(1000, "shared"), 2)
    assert.equal(layoverNights(1000, "priority"), 1)
  })
})

describe("quoteHaul", () => {
  it("prices a 400-mile shared gelding", () => {
    const result = quoteHaul({ miles: 400, horses: [gelding()], service: "shared" })
    assert.equal(result.ok, true)
    if (!result.ok) return
    assert.equal(result.quote.totalCents, 128000)
    assert.equal(result.quote.layoverNights, 0)
    assert.equal(result.quote.driveHours, driveHours(400))
  })

  it("adds a private van without a priority percentage", () => {
    const result = quoteHaul({ miles: 400, horses: [gelding()], service: "private" })
    assert.equal(result.ok, true)
    if (!result.ok) return
    assert.equal(result.quote.totalCents, 178000)
  })

  it("prices two horses, a stallion, and a mare in foal on a 1,000-mile shared haul", () => {
    const result = quoteHaul({
      miles: 1000,
      service: "shared",
      horses: [
        { sex: "stallion", flags: ["inFoal"] },
        { sex: "mare", flags: ["inFoal", "blankets"] },
      ],
    })
    assert.equal(result.ok, true)
    if (!result.ok) return
    assert.equal(result.quote.layoverNights, 2)
    assert.equal(result.quote.totalCents, 368000)
    assert.equal(result.quote.lineItems.some((item) => item.id === "blankets"), false)
    const stallion = result.quote.lineItems.find((item) => item.id === "stallion")
    assert.equal(stallion?.cents, 8500)
  })

  it("puts the priority percentage on rolling charges only", () => {
    const result = quoteHaul({ miles: 1000, horses: [gelding()], service: "priority" })
    assert.equal(result.ok, true)
    if (!result.ok) return
    assert.equal(result.quote.layoverNights, 1)
    assert.equal(result.quote.totalCents, 519500)
  })

  it("refuses an empty string or more than eight horses", () => {
    assert.equal(quoteHaul({ miles: 100, horses: [], service: "shared" }).ok, false)
    const horses = Array.from({ length: 9 }, () => ({ sex: "gelding" as const, flags: [] }))
    assert.equal(quoteHaul({ miles: 100, horses, service: "shared" }).ok, false)
  })
})

describe("dates", () => {
  it("rolls across a month and a year", () => {
    assert.equal(addDays("2026-11-25", 2), "2026-11-27")
    assert.equal(addDays("2026-12-31", 1), "2027-01-01")
  })
})

describe("booking", () => {
  it("saves a same-day desert haul with the quoted total", () => {
    const result = buildBooking(
      {
        originId: "thermal-ca",
        destinationId: "scottsdale-az",
        horses: [gelding()],
        departDate: "2026-12-12",
        service: "shared",
        shipper: {
          name: "Rosa Vidal",
          phone: "(760) 555-0118",
          email: "rosa.vidal@example.com",
          barn: "Vidal Ponies",
        },
        notes: "Side by side.",
        papersReady: true,
        id: "bb-test",
        createdAt: "2026-11-26T12:00:00-05:00",
      },
      "2026-11-26",
    )
    assert.equal(result.ok, true)
    if (!result.ok) return
    assert.equal(result.shipment.totalCents, 107750)
    assert.equal(result.shipment.arrivalDate, "2026-12-12")
    assert.equal(result.shipment.status, "scheduled")
    assert.equal(result.shipment.source, "yours")
  })

  it("rejects a past date and a haul that starts and ends at one yard", () => {
    const base = {
      originId: "devon-pa",
      destinationId: "devon-pa",
      horses: [gelding()],
      departDate: "2026-11-01",
      service: "shared" as const,
      shipper: {
        name: "Ellen Shaw",
        phone: "8035550160",
        email: "ellen.shaw@example.com",
        barn: "",
      },
      notes: "",
      papersReady: true,
    }
    const sameYard = buildBooking(base, "2026-11-26")
    assert.equal(sameYard.ok, false)
    const past = buildBooking({ ...base, destinationId: "aiken-sc" }, "2026-11-26")
    assert.equal(past.ok, false)
  })
})

describe("sample board", () => {
  it("keeps the Lexington haul in transit with two overnights", () => {
    const haul = SEEDS.find((seed) => seed.id === "bb-1842")
    assert.ok(haul)
    assert.equal(haul?.status, "in_transit")
    assert.equal(haul?.layoverNights, 2)
    assert.equal(haul?.arrivalDate, "2026-11-27")
    assert.equal(haul?.miles, 1039)
  })

  it("cancels a scheduled sample without dropping it from the board", () => {
    const next = cancelInStore(EMPTY_STORE, "bb-1860", "2026-11-26T12:00:00-05:00")
    assert.equal(next.ok, true)
    if (!next.ok) return
    const haul = mergeShipments(next.store).find((item) => item.id === "bb-1860")
    assert.equal(haul?.status, "cancelled")
    const rolling = cancelInStore(EMPTY_STORE, "bb-1842", "2026-11-26T12:00:00-05:00")
    assert.equal(rolling.ok, false)
  })
})
