import { Suspense } from "react"
import { HaulPending } from "@/components/shipment-view"
import { QuoteDesk } from "@/components/quote-desk"

export const metadata = {
  title: "Request a quote",
}

export default function QuotePage() {
  return (
    <Suspense fallback={<HaulPending label="Opening the quote request…" />}>
      <QuoteDesk />
    </Suspense>
  )
}
