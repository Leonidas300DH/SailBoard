export type MapCoordinate = [number, number];

export type MotionPath = {
  id: string;
  coordinates: MapCoordinate[];
  speedKph: number;
  offset: number;
};

export type LiveTrafficPoint = {
  id: string;
  coordinates: MapCoordinate;
  heading: number;
  speedKph: number;
  updatedAt: number;
  label?: string;
};

export const TACTICAL_CITIES = [
  { id: "brest", coordinates: [-4.4861, 48.3904] as MapCoordinate, intensity: 1 },
  { id: "quimper", coordinates: [-4.1025, 47.996] as MapCoordinate, intensity: 0.72 },
  { id: "lorient", coordinates: [-3.37, 47.7483] as MapCoordinate, intensity: 0.82 },
  { id: "vannes", coordinates: [-2.7608, 47.6582] as MapCoordinate, intensity: 0.78 },
  { id: "saint-brieuc", coordinates: [-2.7656, 48.5142] as MapCoordinate, intensity: 0.68 },
  { id: "rennes", coordinates: [-1.6778, 48.1173] as MapCoordinate, intensity: 1 },
  { id: "saint-nazaire", coordinates: [-2.2137, 47.2735] as MapCoordinate, intensity: 0.82 },
  { id: "nantes", coordinates: [-1.5536, 47.2184] as MapCoordinate, intensity: 1 },
  { id: "la-roche-sur-yon", coordinates: [-1.426, 46.6705] as MapCoordinate, intensity: 0.74 },
  { id: "les-sables", coordinates: [-1.7833, 46.4965] as MapCoordinate, intensity: 0.62 },
  { id: "la-rochelle", coordinates: [-1.1511, 46.1603] as MapCoordinate, intensity: 0.82 },
  { id: "cholet", coordinates: [-0.8795, 47.0594] as MapCoordinate, intensity: 0.6 },
  { id: "angers", coordinates: [-0.5632, 47.4784] as MapCoordinate, intensity: 0.78 },
];

// Real western-France corridors, simplified to a few geodetic waypoints. The
// underlying OpenStreetMap motorway/trunk layer supplies the exact road shape;
// these paths only drive the tiny, low-frequency light traces.
export const ROAD_MOTION_PATHS: MotionPath[] = [
  {
    id: "n165-brest-nantes",
    coordinates: [[-4.486, 48.39], [-4.1, 47.996], [-3.55, 47.86], [-3.37, 47.748], [-2.76, 47.658], [-2.35, 47.51], [-2.214, 47.274], [-1.554, 47.218]],
    speedKph: 102,
    offset: 0.08,
  },
  {
    id: "n24-rennes-lorient",
    coordinates: [[-1.678, 48.117], [-2.05, 48.0], [-2.42, 47.92], [-2.83, 47.84], [-3.37, 47.748]],
    speedKph: 94,
    offset: 0.46,
  },
  {
    id: "n137-rennes-nantes",
    coordinates: [[-1.678, 48.117], [-1.66, 47.87], [-1.64, 47.61], [-1.6, 47.4], [-1.554, 47.218]],
    speedKph: 105,
    offset: 0.7,
  },
  {
    id: "a83-nantes-niort",
    coordinates: [[-1.554, 47.218], [-1.43, 46.93], [-1.426, 46.67], [-1.15, 46.45], [-0.58, 46.32]],
    speedKph: 112,
    offset: 0.23,
  },
  {
    id: "n137-nantes-la-rochelle",
    coordinates: [[-1.554, 47.218], [-1.426, 46.67], [-1.29, 46.45], [-1.151, 46.16]],
    speedKph: 92,
    offset: 0.88,
  },
];

export const SHIPPING_LANES: MotionPath[] = [
  {
    id: "ushant-southbound",
    coordinates: [[-6.8, 50.2], [-6.15, 49.35], [-5.55, 48.55], [-5.15, 47.7], [-4.72, 46.8], [-4.18, 45.7]],
    speedKph: 31,
    offset: 0.13,
  },
  {
    id: "ushant-northbound",
    coordinates: [[-3.78, 45.35], [-4.22, 46.25], [-4.62, 47.2], [-4.98, 48.05], [-5.37, 48.95], [-5.95, 49.95]],
    speedKph: 27,
    offset: 0.64,
  },
  {
    id: "loire-approach",
    coordinates: [[-5.1, 47.05], [-4.2, 47.15], [-3.35, 47.23], [-2.62, 47.29], [-2.22, 47.27]],
    speedKph: 22,
    offset: 0.39,
  },
  {
    id: "la-rochelle-approach",
    coordinates: [[-4.45, 45.55], [-3.45, 45.73], [-2.45, 45.93], [-1.55, 46.08], [-1.17, 46.14]],
    speedKph: 24,
    offset: 0.8,
  },
];

export const FALLBACK_AIR_ROUTES: MotionPath[] = [
  {
    id: "atlantic-eastbound",
    coordinates: [[-8.2, 47.2], [-6.7, 47.55], [-5.2, 47.85], [-3.4, 48.1], [-1.5, 48.35], [0.7, 48.7]],
    speedKph: 790,
    offset: 0.18,
  },
  {
    id: "atlantic-westbound",
    coordinates: [[1.8, 46.2], [0.1, 46.45], [-1.7, 46.8], [-3.7, 47.2], [-5.9, 47.55], [-8.0, 48.0]],
    speedKph: 830,
    offset: 0.72,
  },
  {
    id: "nantes-channel",
    coordinates: [[-1.61, 47.15], [-2.2, 47.55], [-3.05, 48.1], [-4.05, 48.65], [-5.35, 49.1]],
    speedKph: 690,
    offset: 0.44,
  },
];

export function haversineKm(a: MapCoordinate, b: MapCoordinate): number {
  const radius = 6371;
  const toRadians = Math.PI / 180;
  const lat1 = a[1] * toRadians;
  const lat2 = b[1] * toRadians;
  const deltaLat = (b[1] - a[1]) * toRadians;
  const deltaLng = (b[0] - a[0]) * toRadians;
  const sinLat = Math.sin(deltaLat / 2);
  const sinLng = Math.sin(deltaLng / 2);
  const value = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function pointAlongPath(path: MapCoordinate[], distanceKm: number): MapCoordinate {
  if (path.length < 2) return path[0] ?? [0, 0];
  const lengths: number[] = [];
  let total = 0;
  for (let index = 1; index < path.length; index += 1) {
    const length = haversineKm(path[index - 1], path[index]);
    lengths.push(length);
    total += length;
  }
  let remaining = ((distanceKm % total) + total) % total;
  for (let index = 0; index < lengths.length; index += 1) {
    const length = lengths[index];
    if (remaining <= length) {
      const progress = length === 0 ? 0 : remaining / length;
      const start = path[index];
      const end = path[index + 1];
      return [start[0] + (end[0] - start[0]) * progress, start[1] + (end[1] - start[1]) * progress];
    }
    remaining -= length;
  }
  return path[path.length - 1];
}

export function destinationPoint(origin: MapCoordinate, heading: number, distanceKm: number): MapCoordinate {
  const radius = 6371;
  const angularDistance = distanceKm / radius;
  const bearing = heading * Math.PI / 180;
  const latitude = origin[1] * Math.PI / 180;
  const longitude = origin[0] * Math.PI / 180;
  const nextLatitude = Math.asin(
    Math.sin(latitude) * Math.cos(angularDistance)
      + Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(bearing),
  );
  const nextLongitude = longitude + Math.atan2(
    Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitude),
    Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(nextLatitude),
  );
  return [nextLongitude * 180 / Math.PI, nextLatitude * 180 / Math.PI];
}
