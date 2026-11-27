import Link from "next/link"
import { shell } from "@/components/shell"
import { buttonVariants } from "@/components/ui/button"
import { formatDay, formatMiles, formatUsd, plural } from "@/lib/format"
import { roadMiles } from "@/lib/geo"
import { getHub, hubPlace } from "@/lib/hubs"
import { RATE, quoteHaul } from "@/lib/pricing"
import { SEEDS } from "@/lib/shipments"
import { cn } from "@/lib/utils"

const lanes = [
  ["lexington-ky", "wellington-fl"],
  ["ocala-fl", "tryon-nc"],
  ["weatherford-tx", "franklin-tn"],
  ["thermal-ca", "scottsdale-az"],
  ["aiken-sc", "devon-pa"],
  ["middleburg-va", "saratoga-ny"],
] as const

export const metadata = {
  title: "Horse shipping",
}

export default function HomePage() {
  const featured = SEEDS.find((shipment) => shipment.id === "bb-1842")
  const alsoRolling = SEEDS.find((shipment) => shipment.id === "bb-1855")
  const featuredOrigin = featured ? getHub(featured.originId) : undefined
  const featuredDestination = featured ? getHub(featured.destinationId) : undefined
  const lastStop = featured?.careStops.at(-1)

  return (
    <div>
      <section className={`${shell} grid items-end gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]`}>
        <div>
          <p className="text-xs tracking-[0.18em] text-brass-deep uppercase">Horse shipping desk</p>
          <h1 className="mt-3 max-w-xl font-heading text-5xl leading-[0.95] tracking-tight sm:text-6xl">
            The horse ships with the layover <span className="italic text-leather">already priced.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Send a horse-shipping request from your phone. Pickup, delivery, and the horses. The price is on the page before you submit.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/quote" className={cn(buttonVariants({ size: "lg" }), "h-12 justify-center px-4 sm:w-auto")}>
              Request a quote
            </Link>
            <Link href="/shipments" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 justify-center px-4 sm:w-auto")}>
              See hauls
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            {formatUsd(RATE.dispatchCents)} dispatch · {formatUsd(RATE.centsPerMile)} a mile · water and hay at least every four hours
          </p>
        </div>

        {featured && featuredOrigin && featuredDestination ? (
          <aside className="rounded-2xl bg-ink p-6 text-cream">
            <p className="text-xs tracking-[0.18em] text-brass uppercase">Dispatch slip · {featured.id}</p>
            <h2 className="mt-3 font-heading text-3xl tracking-tight">
              {hubPlace(featuredOrigin)} to {hubPlace(featuredDestination)}
            </h2>
            <p className="mt-2 text-sm text-cream/75">
              {featured.horses.map((horse) => horse.name).join(" and ")} · {plural(featured.layoverNights, "overnight")} · ETA {formatDay(featured.arrivalDate)}
            </p>
            {lastStop ? (
              <p className="mt-5 border-t border-white/15 pt-4 text-sm text-cream/85">
                Latest care note, {lastStop.place}: {lastStop.note}
              </p>
            ) : null}
            <Link href={`/shipments/${featured.id}`} className="mt-5 inline-block text-sm text-brass">
              Open this slip
            </Link>
            {alsoRolling ? (
              <p className="mt-4 text-sm text-cream/60">
                Also rolling:{" "}
                <Link href={`/shipments/${alsoRolling.id}`} className="text-cream underline-offset-4 hover:underline">
                  {getHub(alsoRolling.originId)?.city} to {getHub(alsoRolling.destinationId)?.city}
                </Link>
              </p>
            ) : null}
          </aside>
        ) : null}
      </section>

      <section className="border-y border-border">
        <div className={`${shell} grid gap-8 py-12 md:grid-cols-3`}>
          {[
            ["01", "Two hubs", "Pickup and delivery are yards this desk already runs, so the miles are estimated the same way every time."],
            ["02", "The string", "Name each horse. Stallions, mares in foal, seniors, and medication change the rate. Height and breed are for the driver."],
            ["03", "A rig and a date", "Compare shared, private, and priority. Book it, and the haul shows up on your board as scheduled."],
          ].map(([number, title, copy]) => (
            <div key={number}>
              <p className="font-heading text-brass-deep">{number}</p>
              <h2 className="mt-2 font-heading text-2xl">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`${shell} py-12 sm:py-16`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-3xl tracking-tight">Lanes on the desk</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Shared price for one horse, before special care. Open a lane to change the string, the rig, or the date.
            </p>
          </div>
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          <ul className="divide-y divide-border">
            {lanes.map(([fromId, toId]) => {
              const from = getHub(fromId)
              const to = getHub(toId)
              if (!from || !to) return null
              const miles = roadMiles(from, to)
              const priced = quoteHaul({ miles, horses: [{ sex: "gelding", flags: [] }], service: "shared" })
              if (!priced.ok) return null
              return (
                <li key={`${fromId}-${toId}`}>
                  <Link
                    href={`/quote?from=${fromId}&to=${toId}`}
                    className="grid gap-2 px-4 py-4 transition-colors hover:bg-accent sm:grid-cols-[1.4fr_0.6fr_0.7fr_auto] sm:items-center sm:px-5"
                  >
                    <span>
                      <span className="block font-medium">
                        {hubPlace(from)} to {hubPlace(to)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {from.yard} → {to.yard}
                      </span>
                    </span>
                    <span className="text-sm text-muted-foreground">{formatMiles(miles)}</span>
                    <span className="text-sm text-muted-foreground">{plural(priced.quote.layoverNights, "overnight")}</span>
                    <span className="font-heading text-xl sm:text-right">{formatUsd(priced.quote.totalCents)}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <section className="border-t border-border bg-ink text-cream">
        <div className={`${shell} grid gap-6 py-12 sm:grid-cols-2 lg:grid-cols-4`}>
          {[
            ["Water and hay", "At least every four hours, logged on the care slip."],
            ["Overnights", "A layover is a barn, with the night written into the quote."],
            ["Stallions", "They ride in their own compartment."],
            ["Papers", "Coggins and a health certificate ride with the horse."],
          ].map(([title, copy]) => (
            <div key={title}>
              <h2 className="font-heading text-xl text-brass">{title}</h2>
              <p className="mt-2 text-sm text-cream/75">{copy}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
