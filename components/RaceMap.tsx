"use client";

import { useEffect, useRef } from "react";

type RaceMapProps = {
  center: [number, number];
  geojson: GeoJSON.FeatureCollection;
  interactive?: boolean;
};

const IGN_TILES = "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}";

export function RaceMap({ center, geojson, interactive = true }: RaceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    let map: import("maplibre-gl").Map | undefined;
    void import("maplibre-gl").then(({ default: maplibregl }) => {
      if (cancelled || !containerRef.current) return;
      map = new maplibregl.Map({
        container: containerRef.current,
        center,
        zoom: 11.7,
        attributionControl: false,
        interactive,
        style: {
          version: 8,
          sources: {
            ign: { type: "raster", tiles: [IGN_TILES], tileSize: 256, attribution: "© IGN / Géoplateforme" },
          },
          layers: [
            { id: "ign", type: "raster", source: "ign", paint: { "raster-saturation": -0.18, "raster-contrast": 0.22, "raster-brightness-max": 0.74 } },
          ],
        },
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-left");
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
      map.on("load", () => {
        if (!map) return;
        map.addSource("course", { type: "geojson", data: geojson });
        map.addLayer({
          id: "course-route-shadow", type: "line", source: "course", filter: ["==", ["get", "kind"], "route"],
          paint: { "line-color": "#02131f", "line-width": 7, "line-opacity": .8 },
        });
        map.addLayer({
          id: "course-route", type: "line", source: "course", filter: ["==", ["get", "kind"], "route"],
          paint: { "line-color": "#d9ff00", "line-width": 3, "line-dasharray": [2, 1] },
        });
        map.addLayer({
          id: "course-lines", type: "line", source: "course", filter: ["in", ["get", "kind"], ["literal", ["start", "gate", "finish"]]],
          paint: { "line-color": "#f5f8f7", "line-width": 4 },
        });
        map.addLayer({
          id: "course-marks", type: "circle", source: "course", filter: ["==", ["geometry-type"], "Point"],
          paint: { "circle-radius": 12, "circle-color": "#d9ff00", "circle-stroke-color": "#02131f", "circle-stroke-width": 3 },
        });
        map.addLayer({
          id: "course-labels", type: "symbol", source: "course", filter: ["==", ["geometry-type"], "Point"],
          layout: { "text-field": ["get", "label"], "text-size": 12, "text-font": ["Open Sans Bold"] },
          paint: { "text-color": "#02131f" },
        });
        const route = geojson.features.find((feature) => feature.properties?.kind === "route");
        if (route?.geometry.type === "LineString" && route.geometry.coordinates.length > 1) {
          const bounds = route.geometry.coordinates.reduce(
            (box, coordinate) => box.extend(coordinate as [number, number]),
            new maplibregl.LngLatBounds(route.geometry.coordinates[0] as [number, number], route.geometry.coordinates[0] as [number, number]),
          );
          map.fitBounds(bounds, { padding: { top: 90, right: 90, bottom: 100, left: 90 }, maxZoom: 13, duration: 0 });
        }
      });
    });
    return () => { cancelled = true; map?.remove(); };
  }, [center, geojson, interactive]);

  return <div ref={containerRef} className="race-map" aria-label="Carte du parcours de course" />;
}
