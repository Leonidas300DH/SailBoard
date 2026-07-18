import type { GeoJSONSource, Map as MaplibreMap } from "maplibre-gl";

export type GraticuleLine = GeoJSON.Feature<GeoJSON.LineString, { axis: "lat" | "lng"; value: number; label: string }>;

export function graticuleStep(zoom: number): number {
  if (zoom < 7) return 1;
  if (zoom < 9) return 0.5;
  if (zoom < 11) return 0.25;
  return 0.125;
}

function label(axis: "lat" | "lng", value: number): string {
  const hemisphere = axis === "lat" ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "O";
  const absolute = Math.abs(value);
  const degrees = Math.floor(absolute);
  const minutes = Math.round((absolute - degrees) * 60);
  return minutes === 0 ? `${degrees}°${hemisphere}` : `${degrees}°${String(minutes).padStart(2, "0")}’${hemisphere}`;
}

/** Adds the tactical graticule layer to a loaded map and keeps it in sync on move. */
export function attachGraticule(map: MaplibreMap) {
  const currentBounds = () => {
    const bounds = map.getBounds();
    return { west: bounds.getWest(), south: bounds.getSouth(), east: bounds.getEast(), north: bounds.getNorth() };
  };
  map.addSource("graticule", { type: "geojson", data: buildGraticule(currentBounds(), graticuleStep(map.getZoom())) });
  map.addLayer({
    id: "graticule",
    type: "line",
    source: "graticule",
    paint: { "line-color": "#55e6c4", "line-width": 0.7, "line-opacity": 0.14 },
  });
  map.on("moveend", () => {
    const source = map.getSource("graticule") as GeoJSONSource | undefined;
    source?.setData(buildGraticule(currentBounds(), graticuleStep(map.getZoom())));
  });
}

/**
 * Lat/lng grid covering the given bounds (expanded one step outward so panning
 * never reveals an unruled edge before the next moveend rebuild).
 */
export function buildGraticule(
  bounds: { west: number; south: number; east: number; north: number },
  step: number,
): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  const features: GraticuleLine[] = [];
  const west = Math.floor(bounds.west / step - 1) * step;
  const east = Math.ceil(bounds.east / step + 1) * step;
  const south = Math.floor(bounds.south / step - 1) * step;
  const north = Math.ceil(bounds.north / step + 1) * step;
  for (let lat = south; lat <= north; lat += step) {
    features.push({
      type: "Feature",
      properties: { axis: "lat", value: lat, label: label("lat", lat) },
      geometry: { type: "LineString", coordinates: [[west, lat], [east, lat]] },
    });
  }
  for (let lng = west; lng <= east; lng += step) {
    features.push({
      type: "Feature",
      properties: { axis: "lng", value: lng, label: label("lng", lng) },
      geometry: { type: "LineString", coordinates: [[lng, south], [lng, north]] },
    });
  }
  return { type: "FeatureCollection", features };
}
