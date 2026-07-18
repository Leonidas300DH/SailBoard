const DEFAULT_SAMPLES_PER_LEG = 32;

/**
 * Builds one deliberately bowed line per championship leg. Keeping the legs
 * separate lets MapLibre orient its direction chevrons from stage N to N + 1.
 */
export function buildCurvedChronology(
  stops: GeoJSON.Position[],
  samplesPerLeg = DEFAULT_SAMPLES_PER_LEG,
): GeoJSON.Position[][] {
  const legs: GeoJSON.Position[][] = [];

  for (let index = 0; index < stops.length - 1; index += 1) {
    const from = stops[index];
    const to = stops[index + 1];
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const distance = Math.hypot(dx, dy);

    if (distance === 0) {
      legs.push([from, to]);
      continue;
    }

    // The repeating side pattern opens the long Atlantic legs into a broad
    // spatial S-curve while preventing neighbouring arcs from feeling cloned.
    const side = index % 3 === 0 ? -1 : 1;
    const bow = Math.min(0.55, Math.max(0.035, distance * 0.18)) * side;
    const control: GeoJSON.Position = [
      (from[0] + to[0]) / 2 + (-dy / distance) * bow,
      (from[1] + to[1]) / 2 + (dx / distance) * bow,
    ];

    const coordinates: GeoJSON.Position[] = [];
    for (let sample = 0; sample <= samplesPerLeg; sample += 1) {
      const progress = sample / samplesPerLeg;
      const inverse = 1 - progress;
      coordinates.push([
        inverse * inverse * from[0] + 2 * inverse * progress * control[0] + progress * progress * to[0],
        inverse * inverse * from[1] + 2 * inverse * progress * control[1] + progress * progress * to[1],
      ]);
    }
    legs.push(coordinates);
  }

  return legs;
}

export function chronologyFeatures(
  legs: GeoJSON.Position[][],
): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  return {
    type: "FeatureCollection",
    features: legs.map((coordinates, index) => ({
      type: "Feature",
      properties: { sequence: index + 1 },
      geometry: { type: "LineString", coordinates },
    })),
  };
}
