import { LatLngTuple } from '../types.ts';

// Haversine formula to compute great-circle distance between two points in km
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Compute total route length in km from an array of waypoints
export function calculateTotalRouteDistance(coordinates: LatLngTuple[]): number {
  if (!coordinates || coordinates.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    total += calculateDistanceKm(
      coordinates[i][0],
      coordinates[i][1],
      coordinates[i + 1][0],
      coordinates[i + 1][1]
    );
  }
  return Math.round(total * 10) / 10;
}

// Parse routeCoordinates safely
export function parseRouteCoordinates(coordStr: string | LatLngTuple[]): LatLngTuple[] {
  if (Array.isArray(coordStr)) return coordStr;
  try {
    const parsed = JSON.parse(coordStr);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((pt: any) => [Number(pt[0]), Number(pt[1])]);
    }
  } catch (err) {
    console.warn('Failed to parse route coordinates:', err);
  }
  return [
    [1.2838, 103.8591],
    [1.2862, 103.8585],
    [1.2885, 103.8569],
    [1.2838, 103.8591],
  ];
}

// Generate GPX string for route export
export function generateGpxString(title: string, coordinates: LatLngTuple[]): string {
  const trkpts = coordinates
    .map(
      (c) =>
        `    <trkpt lat="${c[0]}" lon="${c[1]}"><ele>15</ele></trkpt>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Stride Running Club" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${title}</name>
  </metadata>
  <trk>
    <name>${title}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

// Presets for quick route selection
export const ROUTE_PRESETS = [
  {
    name: 'Marina Waterfront 5K',
    distance: 5.2,
    meetingPoint: 'Promenade Amphitheatre, Waterfront Boardwalk',
    terrain: 'Paved Waterfront',
    elevation: 18,
    coordinates: [
      [1.2838, 103.8591],
      [1.2862, 103.8585],
      [1.2885, 103.8569],
      [1.2898, 103.8540],
      [1.2865, 103.8530],
      [1.2845, 103.8550],
      [1.2838, 103.8591],
    ] as LatLngTuple[],
  },
  {
    name: 'Botanical Canopy 8K',
    distance: 8.4,
    meetingPoint: 'Tanglin Gate Entrance Cafe',
    terrain: 'Park Trails & Paved Paths',
    elevation: 72,
    coordinates: [
      [1.3138, 103.8159],
      [1.3175, 103.8162],
      [1.3205, 103.8190],
      [1.3190, 103.8240],
      [1.3140, 103.8230],
      [1.3110, 103.8195],
      [1.3138, 103.8159],
    ] as LatLngTuple[],
  },
  {
    name: 'Riverfront Sunset 10K',
    distance: 10.1,
    meetingPoint: 'National Stadium Visitor Centre Plaza',
    terrain: 'Road & Riverway',
    elevation: 35,
    coordinates: [
      [1.3035, 103.8730],
      [1.2995, 103.8680],
      [1.2950, 103.8630],
      [1.2920, 103.8580],
      [1.2960, 103.8550],
      [1.3010, 103.8620],
      [1.3040, 103.8700],
      [1.3035, 103.8730],
    ] as LatLngTuple[],
  },
  {
    name: 'East Coast Trail 15K',
    distance: 15.2,
    meetingPoint: 'Lagoon Food Village Coastal Path',
    terrain: 'Coastal Boardwalk & Trail',
    elevation: 25,
    coordinates: [
      [1.3060, 103.9280],
      [1.3030, 103.9160],
      [1.3000, 103.9050],
      [1.2970, 103.8950],
      [1.2985, 103.8960],
      [1.3020, 103.9100],
      [1.3050, 103.9250],
      [1.3060, 103.9280],
    ] as LatLngTuple[],
  },
];
