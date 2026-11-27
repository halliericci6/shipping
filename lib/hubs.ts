export type Hub = {
  id: string
  city: string
  state: string
  yard: string
  lat: number
  lng: number
}

export const HUBS: Hub[] = [
  { id: "wellington-fl", city: "Wellington", state: "FL", yard: "WEF showgrounds", lat: 26.658, lng: -80.269 },
  { id: "ocala-fl", city: "Ocala", state: "FL", yard: "World Equestrian Center", lat: 29.187, lng: -82.18 },
  { id: "lexington-ky", city: "Lexington", state: "KY", yard: "Kentucky Horse Park", lat: 38.047, lng: -84.521 },
  { id: "louisville-ky", city: "Louisville", state: "KY", yard: "Churchill Downs stable gate", lat: 38.205, lng: -85.77 },
  { id: "saratoga-ny", city: "Saratoga Springs", state: "NY", yard: "Oklahoma training track", lat: 43.072, lng: -73.782 },
  { id: "aiken-sc", city: "Aiken", state: "SC", yard: "Aiken training track", lat: 33.56, lng: -81.719 },
  { id: "tryon-nc", city: "Tryon", state: "NC", yard: "Tryon International", lat: 35.209, lng: -82.239 },
  { id: "southern-pines-nc", city: "Southern Pines", state: "NC", yard: "Walthour-Moss Foundation", lat: 35.174, lng: -79.392 },
  { id: "middleburg-va", city: "Middleburg", state: "VA", yard: "Great Meadow", lat: 38.968, lng: -77.735 },
  { id: "upperville-va", city: "Upperville", state: "VA", yard: "Upperville show grounds", lat: 38.994, lng: -77.883 },
  { id: "the-plains-va", city: "The Plains", state: "VA", yard: "Virginia Gold Cup", lat: 38.862, lng: -77.775 },
  { id: "gladstone-nj", city: "Gladstone", state: "NJ", yard: "Hamilton Farm", lat: 40.724, lng: -74.666 },
  { id: "devon-pa", city: "Devon", state: "PA", yard: "Devon Horse Show", lat: 40.047, lng: -75.422 },
  { id: "harrisburg-pa", city: "Harrisburg", state: "PA", yard: "Farm Show Complex", lat: 40.273, lng: -76.886 },
  { id: "millbrook-ny", city: "Millbrook", state: "NY", yard: "HITS Millbrook", lat: 41.785, lng: -73.695 },
  { id: "saugerties-ny", city: "Saugerties", state: "NY", yard: "HITS Saugerties", lat: 42.078, lng: -73.953 },
  { id: "lake-placid-ny", city: "Lake Placid", state: "NY", yard: "North Elba show grounds", lat: 44.28, lng: -73.98 },
  { id: "thermal-ca", city: "Thermal", state: "CA", yard: "Desert International Horse Park", lat: 33.64, lng: -116.174 },
  { id: "del-mar-ca", city: "Del Mar", state: "CA", yard: "Del Mar Horsepark", lat: 32.959, lng: -117.265 },
  { id: "woodside-ca", city: "Woodside", state: "CA", yard: "Menlo Circus Club", lat: 37.43, lng: -122.254 },
  { id: "scottsdale-az", city: "Scottsdale", state: "AZ", yard: "WestWorld", lat: 33.668, lng: -111.891 },
  { id: "tucson-az", city: "Tucson", state: "AZ", yard: "Pima County fairgrounds", lat: 32.222, lng: -110.926 },
  { id: "weatherford-tx", city: "Weatherford", state: "TX", yard: "Weatherford stock barns", lat: 32.759, lng: -97.797 },
  { id: "katy-tx", city: "Katy", state: "TX", yard: "Great Southwest Equestrian Center", lat: 29.786, lng: -95.824 },
  { id: "fort-worth-tx", city: "Fort Worth", state: "TX", yard: "Will Rogers Memorial Center", lat: 32.748, lng: -97.369 },
  { id: "san-antonio-tx", city: "San Antonio", state: "TX", yard: "San Antonio show barns", lat: 29.425, lng: -98.494 },
  { id: "oklahoma-city-ok", city: "Oklahoma City", state: "OK", yard: "State Fair Park barns", lat: 35.468, lng: -97.516 },
  { id: "franklin-tn", city: "Franklin", state: "TN", yard: "Brownland Farm", lat: 35.925, lng: -86.869 },
  { id: "conyers-ga", city: "Conyers", state: "GA", yard: "Georgia International Horse Park", lat: 33.667, lng: -83.986 },
  { id: "camden-sc", city: "Camden", state: "SC", yard: "Springdale Race Course", lat: 34.246, lng: -80.607 },
  { id: "nashville-tn", city: "Nashville", state: "TN", yard: "Nashville show barns", lat: 36.163, lng: -86.781 },
  { id: "columbus-oh", city: "Columbus", state: "OH", yard: "Ohio Expo Center", lat: 40.003, lng: -82.998 },
  { id: "wayne-il", city: "Wayne", state: "IL", yard: "Lamplight Equestrian Center", lat: 41.95, lng: -88.243 },
  { id: "traverse-city-mi", city: "Traverse City", state: "MI", yard: "Flintfields Horse Park", lat: 44.763, lng: -85.617 },
  { id: "parker-co", city: "Parker", state: "CO", yard: "Colorado Horse Park", lat: 39.519, lng: -104.761 },
  { id: "albuquerque-nm", city: "Albuquerque", state: "NM", yard: "Expo New Mexico", lat: 35.084, lng: -106.651 },
  { id: "woodinville-wa", city: "Woodinville", state: "WA", yard: "Gold Creek Equestrian", lat: 47.754, lng: -122.163 },
  { id: "wilsonville-or", city: "Wilsonville", state: "OR", yard: "Hunter Creek", lat: 45.307, lng: -122.766 },
  { id: "birmingham-al", city: "Birmingham", state: "AL", yard: "Birmingham equestrian grounds", lat: 33.52, lng: -86.802 },
]

const byId = new Map(HUBS.map((hub) => [hub.id, hub]))

export function getHub(id: string): Hub | undefined {
  return byId.get(id)
}

export function hubPlace(hub: Hub): string {
  return `${hub.city}, ${hub.state}`
}

export function hubLabel(hub: Hub): string {
  return `${hub.city}, ${hub.state} — ${hub.yard}`
}
