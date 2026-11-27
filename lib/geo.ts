const EARTH_KM = 6371
const KM_TO_MILES = 0.621371
/** Horse vans follow highways, not the great-circle line. */
const ROAD_FACTOR = 1.26

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Estimated road miles between two hubs. Not a turn-by-turn route. */
export function roadMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const miles = haversineKm(a, b) * KM_TO_MILES * ROAD_FACTOR
  return Math.max(1, Math.round(miles))
}
