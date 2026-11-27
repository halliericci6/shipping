import { formatDay, formatMiles, formatUsd, plural } from "@/lib/format"
import type { Quote } from "@/lib/types"

export function QuoteFigures({
  quote,
  arrival,
}: {
  quote: Quote | null
  arrival: string | null
}) {
  if (!quote) {
    return <p className="text-sm text-muted-foreground">Pick two different hubs to price the haul.</p>
  }

  return (
    <div className="grid gap-4">
      <dl className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Miles</dt>
          <dd className="font-medium">{formatMiles(quote.miles)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Rolling</dt>
          <dd className="font-medium">{quote.driveHours} hr</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Overnights</dt>
          <dd className="font-medium">{quote.layoverNights}</dd>
        </div>
      </dl>
      <p className="text-sm text-muted-foreground">
        {arrival
          ? `Arrives ${formatDay(arrival)}. ${plural(quote.layoverNights, "overnight")} at a layover barn.`
          : "Choose a ship date to pin the arrival."}
      </p>
      <ul className="grid gap-2 border-t border-border pt-3">
        {quote.lineItems.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-4 text-sm">
            <span>
              <span className="block font-medium">{item.label}</span>
              <span className="block text-muted-foreground">{item.detail}</span>
            </span>
            <span className="shrink-0 tabular-nums">{formatUsd(item.cents)}</span>
          </li>
        ))}
      </ul>
      <p className="flex items-baseline justify-between border-t border-border pt-3">
        <span className="text-sm text-muted-foreground">Quote</span>
        <span className="font-heading text-3xl tracking-tight">{formatUsd(quote.totalCents)}</span>
      </p>
    </div>
  )
}
