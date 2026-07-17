"use client";

import { useEffect, useRef } from "react";

export type LocatedRace = {
  id: string;
  name: string;
  locationName: string;
  coordinates: [number, number];
  href: string;
  status: string;
};

const IGN_TILES = "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}";

export function EventLocatorMap({ races }: { races: LocatedRace[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    let map: import("maplibre-gl").Map | undefined;
    void import("maplibre-gl").then(({ default: maplibregl }) => {
      if (cancelled || !containerRef.current) return;
      const data: GeoJSON.FeatureCollection<GeoJSON.Point> = {
        type: "FeatureCollection",
        features: races.map((race) => ({
          type: "Feature",
          properties: { id: race.id, name: race.name, locationName: race.locationName, href: race.href, status: race.status },
          geometry: { type: "Point", coordinates: race.coordinates },
        })),
      };
      map = new maplibregl.Map({
        container: containerRef.current,
        center: races.length === 1 ? [-3.35, 47.95] : [-3.02, 48.12],
        zoom: races.length === 1 ? 7.15 : 7.35,
        attributionControl: false,
        style: {
          version: 8,
          sources: { ign: { type: "raster", tiles: [IGN_TILES], tileSize: 256, attribution: "© IGN / Géoplateforme" } },
          layers: [{ id: "ign", type: "raster", source: "ign", paint: { "raster-saturation": -0.28, "raster-contrast": 0.3, "raster-brightness-max": 0.68 } }],
        },
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
      map.on("load", () => {
        if (!map) return;
        map.addSource("located-races", { type: "geojson", data });
        map.addLayer({ id: "race-location-halo", type: "circle", source: "located-races", paint: { "circle-radius": 22, "circle-color": "#d9ff00", "circle-opacity": .14 } });
        map.addLayer({ id: "race-locations", type: "circle", source: "located-races", paint: { "circle-radius": 9, "circle-color": "#d9ff00", "circle-stroke-color": "#02131f", "circle-stroke-width": 4 } });
        map.addLayer({ id: "race-location-labels", type: "symbol", source: "located-races", layout: { "text-field": ["get", "name"], "text-size": 13, "text-font": ["Open Sans Bold"], "text-offset": [0, 1.8], "text-anchor": "top", "text-allow-overlap": true }, paint: { "text-color": "#f5f8f7", "text-halo-color": "#02131f", "text-halo-width": 2 } });
        map.on("mouseenter", "race-locations", () => { if (map) map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "race-locations", () => { if (map) map.getCanvas().style.cursor = ""; });
        map.on("click", "race-locations", (event) => {
          const href = event.features?.[0]?.properties?.href;
          if (typeof href === "string") window.location.assign(href);
        });
      });
    });
    return () => { cancelled = true; map?.remove(); };
  }, [races]);

  return <div ref={containerRef} className="race-map" aria-label="Carte globale des courses" />;
}
