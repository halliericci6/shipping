import { Suspense } from "react"
import { HaulPending, ShipmentView } from "@/components/shipment-view"

export const metadata = {
  title: "Haul",
}

export default function ShipmentPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<HaulPending label="Pulling the haul slip…" />}>
      <ShipmentRoute params={params} />
    </Suspense>
  )
}

async function ShipmentRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ShipmentView id={id} />
}
