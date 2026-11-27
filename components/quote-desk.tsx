"use client"

import { ArrowLeftRight, Plus, Trash } from "lucide-react"
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { HubField } from "@/components/hub-field"
import { QuoteFigures } from "@/components/quote-figures"
import { shell } from "@/components/shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { validateShipper, type ShipperErrors } from "@/lib/booking"
import { addDays, formatUsd, plural, todayISO } from "@/lib/format"
import { roadMiles } from "@/lib/geo"
import { getHub, hubPlace } from "@/lib/hubs"
import { RATE, SERVICES, layoverNights, quoteHaul, serviceLabel } from "@/lib/pricing"
import { bookShipment } from "@/lib/store"
import type { CareFlag, Horse, Quote, Service, Sex, Shipper } from "@/lib/types"
import { cn } from "@/lib/utils"

const BREEDS = [
  "Thoroughbred",
  "Warmblood",
  "Dutch Warmblood",
  "Hanoverian",
  "Quarter Horse",
  "Paint",
  "Arabian",
  "Appendix",
  "Irish Sport Horse",
  "Welsh pony",
  "Pony",
  "Draft",
  "Other",
]

const HANDS = [
  "13.0", "13.1", "13.2", "13.3",
  "14.0", "14.1", "14.2", "14.3",
  "15.0", "15.1", "15.2", "15.3",
  "16.0", "16.1", "16.2", "16.3",
  "17.0", "17.1", "17.2", "17.3",
  "18.0",
]

const CARE: { id: CareFlag; label: string }[] = [
  { id: "inFoal", label: "In foal" },
  { id: "senior", label: "Senior, 18+" },
  { id: "medication", label: "Medication" },
  { id: "blankets", label: "Blankets" },
]

function blankHorse(id: string): Horse {
  return { id, name: "", breed: "Thoroughbred", sex: "gelding", hands: "16.0", flags: [] }
}

function emptyShipper(): Shipper {
  return { name: "", phone: "", email: "", barn: "" }
}

function subscribeToday() {
  return () => {}
}

export function QuoteDesk() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedFrom = searchParams.get("from") ?? ""
  const requestedTo = searchParams.get("to") ?? ""
  const saving = useRef(false)
  const today = useSyncExternalStore(subscribeToday, () => todayISO(), () => "")
  const routeKey = `${requestedFrom}|${requestedTo}`

  const [originId, setOriginId] = useState(() => (getHub(requestedFrom) ? requestedFrom : ""))
  const [destinationId, setDestinationId] = useState(() => (getHub(requestedTo) ? requestedTo : ""))
  const [seenRoute, setSeenRoute] = useState(routeKey)
  if (seenRoute !== routeKey) {
    setSeenRoute(routeKey)
    if (getHub(requestedFrom)) setOriginId(requestedFrom)
    if (getHub(requestedTo)) setDestinationId(requestedTo)
  }
  const [horses, setHorses] = useState<Horse[]>([blankHorse("horse-1")])
  const [nextHorse, setNextHorse] = useState(2)
  const [service, setService] = useState<Service>("shared")
  const [departDate, setDepartDate] = useState("")
  const [shipper, setShipper] = useState<Shipper>(emptyShipper)
  const [notes, setNotes] = useState("")
  const [papersReady, setPapersReady] = useState(false)
  const [errors, setErrors] = useState<ShipperErrors>({})
  const [formError, setFormError] = useState("")

  useLayoutEffect(() => {
    document.body.dataset.dock = "quote"
    return () => {
      delete document.body.dataset.dock
    }
  }, [])

  const origin = getHub(originId)
  const destination = getHub(destinationId)
  const sameYard = Boolean(origin && destination && origin.id === destination.id)
  const miles = origin && destination && !sameYard ? roadMiles(origin, destination) : 0

  const quotes: Record<Service, Quote | null> = { shared: null, private: null, priority: null }
  if (miles) {
    for (const option of SERVICES) {
      const result = quoteHaul({ miles, horses, service: option.id })
      quotes[option.id] = result.ok ? result.quote : null
    }
  }

  const quote = quotes[service]
  const arrival = quote && departDate ? addDays(departDate, quote.arrivalOffsetDays) : null
  const nightsSaved = miles ? layoverNights(miles, "shared") - layoverNights(miles, "priority") : 0

  const blockers: string[] = []
  if (!origin) blockers.push("Pick a pickup hub.")
  if (!destination) blockers.push("Pick a delivery hub.")
  if (sameYard) blockers.push("Pickup and delivery are the same yard.")
  if (horses.some((horse) => horse.name.trim().length < 1)) blockers.push("Name each horse.")
  if (!departDate) blockers.push("Choose a ship date.")
  else if (today && departDate < today) blockers.push("That ship date has already passed.")
  function updateHorse(id: string, patch: Partial<Horse>) {
    setHorses((current) =>
      current.map((horse) => {
        if (horse.id !== id) return horse
        const next = { ...horse, ...patch }
        if (next.sex !== "mare") next.flags = next.flags.filter((flag) => flag !== "inFoal")
        return next
      }),
    )
  }

  function toggleFlag(id: string, flag: CareFlag) {
    setHorses((current) =>
      current.map((horse) => {
        if (horse.id !== id) return horse
        const has = horse.flags.includes(flag)
        return { ...horse, flags: has ? horse.flags.filter((item) => item !== flag) : [...horse.flags, flag] }
      }),
    )
  }

  function resetDesk() {
    setOriginId("")
    setDestinationId("")
    setHorses([blankHorse("horse-1")])
    setNextHorse(2)
    setService("shared")
    setDepartDate("")
    setShipper(emptyShipper())
    setNotes("")
    setPapersReady(false)
    setErrors({})
    setFormError("")
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function submitBooking() {
    if (!origin || !destination || sameYard) {
      scrollTo("route")
      return
    }
    if (horses.some((horse) => horse.name.trim().length < 1)) {
      scrollTo("horses")
      return
    }
    if (!departDate || (today && departDate < today)) {
      scrollTo("when")
      return
    }
    const fieldErrors = validateShipper({
      name: shipper.name,
      phone: shipper.phone,
      email: shipper.email,
      notes,
      papersReady,
    })
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) {
      setFormError("")
      scrollTo("your-details")
      return
    }
    if (saving.current || !quote) return
    saving.current = true
    const result = bookShipment({
      originId,
      destinationId,
      horses,
      departDate,
      service,
      shipper,
      notes,
      papersReady,
    })
    if (!result.ok) {
      saving.current = false
      setFormError(result.error)
      return
    }
    const id = result.shipment.id
    resetDesk()
    router.push(`/shipments/${id}`)
  }

  const routeLabel = origin && destination ? `${hubPlace(origin)} to ${hubPlace(destination)}` : "This haul"
  const totalLabel = quote ? formatUsd(quote.totalCents) : "—"

  return (
    <div className={`${shell} py-8 pb-36 sm:py-12 lg:pb-16`}>
      <p className="text-xs tracking-[0.18em] text-brass-deep uppercase">Quote request</p>
      <h1 className="mt-2 max-w-2xl font-heading text-4xl tracking-tight sm:text-5xl">
        Request a shipping quote.
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Pickup, delivery, and the horses. The price updates as you fill it in, and you send the request from this page.
      </p>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-8">
          <section id="route" className="grid scroll-mt-24 gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
            <h2 className="font-heading text-2xl">Route</h2>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
              <HubField label="Pickup" hubId={originId} onChange={setOriginId} />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-12 sm:mt-6"
                aria-label="Swap pickup and delivery"
                onClick={() => {
                  setOriginId(destinationId)
                  setDestinationId(originId)
                }}
              >
                <ArrowLeftRight />
              </Button>
              <HubField label="Delivery" hubId={destinationId} onChange={setDestinationId} />
            </div>
            {sameYard ? <p className="text-sm text-destructive">Pickup and delivery are the same yard.</p> : null}
            {miles ? (
              <p className="text-sm text-muted-foreground">
                About {miles.toLocaleString("en-US")} road miles. Estimated from the hubs, along highways.
              </p>
            ) : null}
          </section>

          <section id="horses" className="grid scroll-mt-24 gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
            <div className="flex items-end justify-between gap-3">
              <h2 className="font-heading text-2xl">Horses</h2>
              <p className="text-sm text-muted-foreground">{plural(horses.length, "horse")}</p>
            </div>
            <div className="grid gap-4">
              {horses.map((horse, index) => (
                <article key={horse.id} className="grid gap-3 rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-medium">Horse {index + 1}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${horse.name || `horse ${index + 1}`}`}
                      disabled={horses.length === 1}
                      onClick={() => setHorses((current) => current.filter((item) => item.id !== horse.id))}
                    >
                      <Trash />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                      <Label htmlFor={`${horse.id}-name`}>Name</Label>
                      <Input
                        id={`${horse.id}-name`}
                        className="h-12"
                        autoComplete="off"
                        value={horse.name}
                        onChange={(event) => updateHorse(horse.id, { name: event.target.value })}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor={`${horse.id}-breed`}>Breed</Label>
                      <select
                        id={`${horse.id}-breed`}
                        className="h-12 w-full rounded-lg border border-input bg-transparent px-3 text-base"
                        value={horse.breed}
                        onChange={(event) => updateHorse(horse.id, { breed: event.target.value })}
                      >
                        {BREEDS.map((breed) => (
                          <option key={breed}>{breed}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor={`${horse.id}-sex`}>Sex</Label>
                      <select
                        id={`${horse.id}-sex`}
                        className="h-12 w-full rounded-lg border border-input bg-transparent px-3 text-base"
                        value={horse.sex}
                        onChange={(event) => updateHorse(horse.id, { sex: event.target.value as Sex })}
                      >
                        <option value="mare">Mare</option>
                        <option value="gelding">Gelding</option>
                        <option value="stallion">Stallion</option>
                      </select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor={`${horse.id}-hands`}>Hands</Label>
                      <select
                        id={`${horse.id}-hands`}
                        className="h-12 w-full rounded-lg border border-input bg-transparent px-3 text-base"
                        value={horse.hands}
                        onChange={(event) => updateHorse(horse.id, { hands: event.target.value })}
                      >
                        {HANDS.map((hands) => (
                          <option key={hands}>{hands}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <fieldset className="grid gap-2">
                    <legend className="text-sm font-medium">Care</legend>
                    <div className="flex flex-wrap gap-2">
                      {CARE.map((flag) => {
                        const disabled = flag.id === "inFoal" && horse.sex !== "mare"
                        const checked = horse.flags.includes(flag.id)
                        return (
                          <label
                            key={flag.id}
                            className={cn(
                              "flex min-h-11 items-center gap-2 rounded-full border border-border px-3 text-sm",
                              checked && "border-brass bg-brass/15",
                              disabled && "opacity-50",
                            )}
                          >
                            <input
                              type="checkbox"
                              className="size-4 accent-ink"
                              checked={checked && !disabled}
                              disabled={disabled}
                              onChange={() => toggleFlag(horse.id, flag.id)}
                            />
                            {flag.label}
                          </label>
                        )
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Stallions are separated automatically. Blankets are a driver note, with no charge.
                    </p>
                  </fieldset>
                </article>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-12"
              disabled={horses.length >= RATE.maxHorses}
              onClick={() => {
                setHorses((current) => [...current, blankHorse(`horse-${nextHorse}`)])
                setNextHorse((count) => count + 1)
              }}
            >
              <Plus />
              Add a horse
            </Button>
          </section>

          <section id="when" className="grid scroll-mt-24 gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
            <h2 className="font-heading text-2xl">Date and rig</h2>
            <div className="grid gap-1.5 sm:max-w-xs">
              <Label htmlFor="depart-date">Ship date</Label>
              <Input
                id="depart-date"
                type="date"
                className="h-12"
                min={today || undefined}
                value={departDate}
                onChange={(event) => setDepartDate(event.target.value)}
              />
            </div>
            <fieldset className="grid gap-3">
              <legend className="sr-only">Rig</legend>
              <div className="grid gap-3 md:grid-cols-3">
                {SERVICES.map((option) => {
                  const optionQuote = quotes[option.id]
                  const selected = service === option.id
                  return (
                    <label
                      key={option.id}
                      className={cn(
                        "grid cursor-pointer gap-2 rounded-xl border p-3 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                        selected ? "border-ink bg-ink text-cream" : "border-border bg-background",
                      )}
                    >
                      <input
                        type="radio"
                        name="service"
                        className="sr-only"
                        checked={selected}
                        onChange={() => setService(option.id)}
                      />
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="font-medium">{option.title}</span>
                        <span className="font-heading text-xl">
                          {optionQuote ? formatUsd(optionQuote.totalCents) : "—"}
                        </span>
                      </span>
                      <span className={cn("text-sm", selected ? "text-cream/75" : "text-muted-foreground")}>
                        {option.blurb}
                      </span>
                      <span className={cn("text-xs", selected ? "text-brass" : "text-muted-foreground")}>
                        {optionQuote
                          ? plural(optionQuote.layoverNights, "overnight")
                          : "Waiting on a route"}
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
            {nightsSaved > 0 ? (
              <p className="text-sm text-muted-foreground">
                Priority skips {plural(nightsSaved, "overnight")} on this route. The rolling charges go up {Math.round(RATE.priorityShare * 100)}%.
              </p>
            ) : null}
          </section>

          <section id="your-details" className="grid scroll-mt-24 gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
            <h2 className="font-heading text-2xl">Your details</h2>
            <p className="text-sm text-muted-foreground">
              We use this to confirm the request. It stays in this browser with the haul.
            </p>
            {formError ? (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="shipper-name">Your name</Label>
                <Input
                  id="shipper-name"
                  autoComplete="name"
                  className="h-12"
                  value={shipper.name}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "shipper-name-error" : undefined}
                  onChange={(event) => setShipper({ ...shipper, name: event.target.value })}
                />
                {errors.name ? (
                  <p id="shipper-name-error" className="text-sm text-destructive">
                    {errors.name}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="shipper-phone">Phone</Label>
                  <Input
                    id="shipper-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    className="h-12"
                    value={shipper.phone}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? "shipper-phone-error" : undefined}
                    onChange={(event) => setShipper({ ...shipper, phone: event.target.value })}
                  />
                  {errors.phone ? (
                    <p id="shipper-phone-error" className="text-sm text-destructive">
                      {errors.phone}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="shipper-email">Email</Label>
                  <Input
                    id="shipper-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    className="h-12"
                    value={shipper.email}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "shipper-email-error" : undefined}
                    onChange={(event) => setShipper({ ...shipper, email: event.target.value })}
                  />
                  {errors.email ? (
                    <p id="shipper-email-error" className="text-sm text-destructive">
                      {errors.email}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="shipper-barn">Barn</Label>
                <Input
                  id="shipper-barn"
                  className="h-12"
                  placeholder="Optional"
                  value={shipper.barn}
                  onChange={(event) => setShipper({ ...shipper, barn: event.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="driver-note">Note for the driver</Label>
                <Textarea
                  id="driver-note"
                  value={notes}
                  maxLength={400}
                  placeholder="Feeding, blankets, how the horse loads."
                  className="min-h-24 text-base"
                  aria-invalid={Boolean(errors.notes)}
                  aria-describedby={errors.notes ? "driver-note-error" : undefined}
                  onChange={(event) => setNotes(event.target.value)}
                />
                {errors.notes ? (
                  <p id="driver-note-error" className="text-sm text-destructive">
                    {errors.notes}
                  </p>
                ) : null}
              </div>
              <label className="flex min-h-11 items-start gap-3 text-base">
                <input
                  type="checkbox"
                  className="mt-1 size-5 accent-ink"
                  checked={papersReady}
                  onChange={(event) => setPapersReady(event.target.checked)}
                />
                <span>Coggins and a health certificate will be at pickup.</span>
              </label>
              {errors.papers ? <p className="text-sm text-destructive">{errors.papers}</p> : null}
            </div>
          </section>

          <section id="breakdown" className="grid scroll-mt-24 gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6 lg:hidden">
            <h2 className="font-heading text-2xl">{serviceLabel(service)} quote</h2>
            <QuoteFigures quote={quote} arrival={arrival} />
          </section>

          <details className="rounded-2xl border border-border bg-card p-4 text-sm sm:p-6">
            <summary className="cursor-pointer font-medium">Rate card</summary>
            <dl className="mt-4 grid gap-2 text-muted-foreground">
              <div className="flex justify-between gap-4"><dt>Dispatch</dt><dd>{formatUsd(RATE.dispatchCents)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Loaded mile</dt><dd>{formatUsd(RATE.centsPerMile)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Each extra horse, per mile</dt><dd>{formatUsd(RATE.extraHorseCentsPerMile)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Private van, per mile</dt><dd>{formatUsd(RATE.privateCentsPerMile)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Priority</dt><dd>{Math.round(RATE.priorityShare * 100)}% of rolling charges</dd></div>
              <div className="flex justify-between gap-4"><dt>Overnight</dt><dd>{formatUsd(RATE.layoverCents)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Health papers</dt><dd>{formatUsd(RATE.papersCents)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Stallion compartment</dt><dd>{formatUsd(RATE.stallionCents)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Mare in foal</dt><dd>{formatUsd(RATE.inFoalCents)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Senior care</dt><dd>{formatUsd(RATE.seniorCents)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Medication</dt><dd>{formatUsd(RATE.medicationCents)}</dd></div>
            </dl>
            <p className="mt-3 text-muted-foreground">
              A shared day overnights after {RATE.sharedLayoverAfter} miles, then every {RATE.sharedLayoverEvery}. Priority waits until {RATE.priorityLayoverAfter}, then every {RATE.priorityLayoverEvery}.
            </p>
          </details>
        </div>

        <aside className="sticky top-20 hidden rounded-2xl border border-border border-t-2 border-t-brass bg-card p-5 lg:block">
          <p className="text-xs tracking-[0.16em] text-brass-deep uppercase">{serviceLabel(service)} quote</p>
          <h2 className="mt-2 font-heading text-2xl">{routeLabel}</h2>
          <div className="mt-4">
            <QuoteFigures quote={quote} arrival={arrival} />
          </div>
          <Button type="button" className="mt-5 h-12 w-full" onClick={submitBooking}>
            {quote ? `Send request · ${formatUsd(quote.totalCents)}` : "Send request"}
          </Button>
          {blockers.length > 0 ? (
            <ul className="mt-3 grid gap-1 text-sm text-muted-foreground">
              {blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          ) : null}
          <p className="mt-3 text-xs text-muted-foreground">A dispatcher confirms the rig before the horse loads.</p>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">
              {blockers[0] ?? serviceLabel(service)}
            </p>
            <p className="font-heading text-2xl">{totalLabel}</p>
          </div>
          <Button type="button" className="h-12 shrink-0 px-4" onClick={submitBooking}>
            Send request
          </Button>
        </div>
      </div>
    </div>
  )
}
