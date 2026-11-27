"use client"

import { Button } from "@/components/ui/button"
import { shell } from "@/components/shell"

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className={`${shell} py-20`}>
      <p className="text-xs tracking-[0.18em] text-brass-deep uppercase">Desk error</p>
      <h1 className="mt-2 font-heading text-4xl tracking-tight">The desk stalled on that page.</h1>
      <p className="mt-3 max-w-lg text-muted-foreground">
        A haul you already booked is still in this browser. Try the page again.
      </p>
      <Button type="button" className="mt-6 h-10" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  )
}
