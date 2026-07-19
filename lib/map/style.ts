import type { StyleSpecification } from "maplibre-gl";

const IGN_TILES = "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}";

// The IGN ortho WMTS serves tiles up to z19; past that the requests 404 and the
// map goes blank unless the source declares maxzoom (MapLibre then overzooms).
const IGN_MAX_ZOOM = 19;

export type IgnStylePreset = "season" | "course" | "editor";
export type SeasonMapMode = "natural" | "tactical";

const RASTER_PRESETS: Record<IgnStylePreset, Record<string, number>> = {
  season: { "raster-saturation": -0.3, "raster-contrast": 0.38, "raster-brightness-max": 0.62, "raster-brightness-min": 0.02 },
  course: { "raster-saturation": -0.18, "raster-contrast": 0.3, "raster-brightness-max": 0.68, "raster-brightness-min": 0.02 },
  editor: { "raster-saturation": -0.15, "raster-contrast": 0.18, "raster-brightness-max": 0.7 },
};

export function buildIgnStyle(preset: IgnStylePreset): StyleSpecification {
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
    },
    layers: [
      {
        id: "map-background",
        type: "background",
        paint: { "background-color": "#010a10" },
      },
      {
        id: "ign",
        type: "raster",
        source: "ign",
        paint: RASTER_PRESETS[preset],
      },
    ],
  };
}

/**
 * Switches the season basemap without replacing the style document. Keeping
 * the existing style alive is important: replacing it would destroy the race
 * chronology source and restart its carefully staged animation.
 */
export function applySeasonMapMode(map: import("maplibre-gl").Map, mode: SeasonMapMode) {
  const tactical = mode === "tactical";
  map.setPaintProperty("map-background", "background-color", tactical ? "#001827" : "#010a10");
  map.setPaintProperty("ign", "raster-saturation", tactical ? -1 : RASTER_PRESETS.season["raster-saturation"]);
  map.setPaintProperty("ign", "raster-contrast", tactical ? 0.62 : RASTER_PRESETS.season["raster-contrast"]);
  map.setPaintProperty("ign", "raster-brightness-max", tactical ? 0.92 : RASTER_PRESETS.season["raster-brightness-max"]);
  map.setPaintProperty("ign", "raster-brightness-min", tactical ? 0 : RASTER_PRESETS.season["raster-brightness-min"]);
  map.setPaintProperty("ign", "raster-opacity", tactical ? 0.82 : 1);
  map.getContainer().classList.toggle("map-mode-tactical", tactical);
}

export const MAP_FONT = ["Open Sans Bold"];
