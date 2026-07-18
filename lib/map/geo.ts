const EARTH_RADIUS_NM = 3440.065;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function haversineNm(from: GeoJSON.Position, to: GeoJSON.Position): number {
  const dLat = toRadians(to[1] - from[1]);
  const dLng = toRadians(to[0] - from[0]);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(from[1])) * Math.cos(toRadians(to[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_NM * Math.asin(Math.sqrt(a));
}

/** Cumulative distance (NM) at each vertex; [0] is always 0. */
export function cumulativeDistances(coordinates: GeoJSON.Position[]): number[] {
  const distances = [0];
  for (let index = 1; index < coordinates.length; index += 1) {
    distances.push(distances[index - 1] + haversineNm(coordinates[index - 1], coordinates[index]));
  }
  return distances;
}

/**
 * Point at a fraction of the line's total length. Unlike vertex-index
 * interpolation, the apparent speed is constant regardless of vertex spacing.
 */
export function pointAtProgress(coordinates: GeoJSON.Position[], progress: number, distances = cumulativeDistances(coordinates)): GeoJSON.Position {
  if (coordinates.length === 0) return [0, 0];
  if (coordinates.length === 1) return coordinates[0];
  const total = distances[distances.length - 1];
  if (total === 0) return coordinates[0];
  const target = Math.max(0, Math.min(1, progress)) * total;
  let index = 1;
  while (index < distances.length - 1 && distances[index] < target) index += 1;
  const from = coordinates[index - 1];
  const to = coordinates[index];
  const span = distances[index] - distances[index - 1] || 1;
  const local = (target - distances[index - 1]) / span;
  return [from[0] + (to[0] - from[0]) * local, from[1] + (to[1] - from[1]) * local];
}

/** Course bearing (degrees, 0 = north) at a fraction of the line. */
export function bearingAt(coordinates: GeoJSON.Position[], progress: number, distances = cumulativeDistances(coordinates)): number {
  if (coordinates.length < 2) return 0;
  const total = distances[distances.length - 1];
  const target = Math.max(0, Math.min(1, progress)) * total;
  let index = 1;
  while (index < distances.length - 1 && distances[index] < target) index += 1;
  const from = coordinates[index - 1];
  const to = coordinates[index];
  const y = Math.sin(toRadians(to[0] - from[0])) * Math.cos(toRadians(to[1]));
  const x = Math.cos(toRadians(from[1])) * Math.sin(toRadians(to[1]))
    - Math.sin(toRadians(from[1])) * Math.cos(toRadians(to[1])) * Math.cos(toRadians(to[0] - from[0]));
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

/**
 * For each mark point, the fraction of the route at which the animation should
 * light it up: the route-length fraction of the closest route vertex.
 */
export function markThresholds(routeCoordinates: GeoJSON.Position[], marks: GeoJSON.Position[]): number[] {
  const distances = cumulativeDistances(routeCoordinates);
  const total = distances[distances.length - 1] || 1;
  return marks.map((mark) => {
    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    routeCoordinates.forEach((vertex, index) => {
      const d = haversineNm(vertex, mark);
      if (d < bestDistance) {
        bestDistance = d;
        best = index;
      }
    });
    return distances[best] / total;
  });
}

function formatAxis(value: number, positive: string, negative: string): string {
  const hemisphere = value >= 0 ? positive : negative;
  const absolute = Math.abs(value);
  const degrees = Math.floor(absolute);
  const minutes = (absolute - degrees) * 60;
  return `${String(degrees).padStart(2, "0")}°${minutes.toFixed(1).padStart(4, "0")}’ ${hemisphere}`;
}

/** "47°33.4’ N — 002°51.2’ O" style readout for the tactical HUD. */
export function formatDMS(lng: number, lat: number): { lat: string; lng: string } {
  return {
    lat: formatAxis(lat, "N", "S"),
    lng: formatAxis(lng, "E", "O"),
  };
}
