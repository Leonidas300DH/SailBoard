import type { RasterDEMSourceSpecification } from "maplibre-gl";

export const TERRAIN_SOURCE_ID = "terrain-dem";

// A pitched viewport requests a much wider tile footprint than a flat map.
// z14 still resolves harbours clearly while avoiding incomplete IGN patches.
export const MAX_INTERACTIVE_ZOOM = 14;
export const MAX_TERRAIN_ZOOM = 12.25;

export const TERRAIN_SOURCE: RasterDEMSourceSpecification = {
  type: "raster-dem",
  // The AWS/Mapzen Terrarium set includes zero-elevation ocean tiles. A DEM
  // that only covers land leaves holes in MapLibre's terrain mesh at the coast.
  tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
  tileSize: 256,
  maxzoom: 15,
  encoding: "terrarium",
  attribution: "Terrain: <a href='https://registry.opendata.aws/terrain-tiles/'>AWS Open Data / Mapzen</a>",
};

const STAGE_EXAGGERATION: Record<string, number> = {
  "spi-ouest-france": 1.3,
  "semaine-la-rochelle": 1.18,
  "semaine-la-rochelle-tour-ile-de-re": 1.18,
  "yc-oleron-cup": 1.08,
  "yc-oleron-diam-24od-cup": 1.08,
  "quatre-vents-cup": 1.48,
  "4-vents-cup": 1.48,
  "trophee-ycca": 1.28,
  "trophee-diam-24od-ycca": 1.28,
  "challenge-an-avel-braz": 1.3,
};

export function terrainExaggerationForStage(stageId?: string): number {
  return stageId ? STAGE_EXAGGERATION[stageId] ?? 1.25 : 1.12;
}
