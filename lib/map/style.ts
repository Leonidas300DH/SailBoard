import type { StyleSpecification } from "maplibre-gl";
import { TERRAIN_SOURCE, TERRAIN_SOURCE_ID } from "./terrain";

const IGN_TILES = "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}";

// The IGN ortho WMTS serves tiles up to z19; past that the requests 404 and the
// map goes blank unless the source declares maxzoom (MapLibre then overzooms).
const IGN_MAX_ZOOM = 19;

export type IgnStylePreset = "season" | "course" | "editor";

const RASTER_PRESETS: Record<IgnStylePreset, Record<string, number>> = {
  season: { "raster-saturation": -0.3, "raster-contrast": 0.38, "raster-brightness-max": 0.62, "raster-brightness-min": 0.02 },
  course: { "raster-saturation": -0.18, "raster-contrast": 0.3, "raster-brightness-max": 0.68, "raster-brightness-min": 0.02 },
  editor: { "raster-saturation": -0.15, "raster-contrast": 0.18, "raster-brightness-max": 0.7 },
};

export function buildIgnStyle(preset: IgnStylePreset, terrain = false): StyleSpecification {
  return {
    version: 8,
    // Symbol layers with text-field silently render nothing without a glyph endpoint.
    glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
    sources: {
      ign: {
        type: "raster",
        tiles: [IGN_TILES],
        tileSize: 256,
        maxzoom: IGN_MAX_ZOOM,
        attribution: "© IGN / Géoplateforme",
      },
      ...(terrain ? { [TERRAIN_SOURCE_ID]: TERRAIN_SOURCE } : {}),
    },
    ...(terrain ? { terrain: { source: TERRAIN_SOURCE_ID, exaggeration: 1.12 } } : {}),
    layers: [
      {
        id: "ign",
        type: "raster",
        source: "ign",
        paint: RASTER_PRESETS[preset],
      },
    ],
  };
}

export const MAP_FONT = ["Open Sans Bold"];
