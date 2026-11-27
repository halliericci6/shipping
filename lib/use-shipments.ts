"use client"

import { useMemo, useSyncExternalStore } from "react"
import { getServerSnapshot, getSnapshot, shipmentsFrom, subscribe } from "./store"

function subscribeMounted(): () => void {
  return () => {}
}

export function useShipments() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const mounted = useSyncExternalStore(subscribeMounted, () => true, () => false)
  const shipments = useMemo(() => shipmentsFrom(raw), [raw])
  return { shipments, mounted, raw }
}
