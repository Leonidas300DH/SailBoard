"use client";

import { useEffect, useMemo, useRef } from "react";
import type { LeaderboardRow } from "@/lib/domain";

type RaceMapProps = {
  center: [number, number];
  geojson: GeoJSON.FeatureCollection;
  interactive?: boolean;
  progress?: number;
  leaderboard?: LeaderboardRow[];
  selectedEntryId?: string;
};

const IGN_TILES = "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}";

function pointOnLine(coordinates: GeoJSON.Position[], progress: number, lateral = 0): GeoJSON.Position {
  const scaled = Math.max(0, Math.min(.999, progress)) * (coordinates.length - 1);
  const index = Math.min(coordinates.length - 2, Math.floor(scaled));
  const local = scaled - index;
  const from = coordinates[index];
  const to = coordinates[index + 1];
  const lng = from[0] + (to[0] - from[0]) * local;
  const lat = from[1] + (to[1] - from[1]) * local;
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  return [lng - (dy / length) * lateral, lat + (dx / length) * lateral];
}

function partialCoordinates(coordinates: GeoJSON.Position[], progress: number) {
  const scaled = Math.max(0, Math.min(.999, progress)) * (coordinates.length - 1);
  const index = Math.min(coordinates.length - 2, Math.floor(scaled));
  return [...coordinates.slice(0, index + 1), pointOnLine(coordinates, progress)];
}

export function RaceMap({ center, geojson, interactive = true, progress = .72, leaderboard = [], selectedEntryId }: RaceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const routeCoordinates = useMemo(() => {
    const route = geojson.features.find((feature) => feature.properties?.kind === "route");
    return route?.geometry.type === "LineString" ? route.geometry.coordinates : [];
  }, [geojson]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    void import("maplibre-gl").then(({ default: maplibregl }) => {
      if (cancelled || !containerRef.current) return;
      const map = new maplibregl.Map({
        container: containerRef.current,
        center,
        zoom: 11.7,
        attributionControl: false,
        interactive,
        style: {
          version: 8,
          sources: { ign: { type: "raster", tiles: [IGN_TILES], tileSize: 256, attribution: "© IGN / Géoplateforme" } },
          layers: [{ id: "ign", type: "raster", source: "ign", paint: { "raster-saturation": -0.18, "raster-contrast": 0.3, "raster-brightness-max": 0.68, "raster-brightness-min": .02 } }],
        },
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-left");
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
      map.on("load", () => {
        map.addSource("course", { type: "geojson", data: geojson });
        map.addLayer({ id: "course-route-shadow", type: "line", source: "course", filter: ["==", ["get", "kind"], "route"], paint: { "line-color": "#02131f", "line-width": 8, "line-opacity": .82 } });
        map.addLayer({ id: "course-route", type: "line", source: "course", filter: ["==", ["get", "kind"], "route"], paint: { "line-color": "#9bb4c0", "line-width": 2, "line-dasharray": [2, 2], "line-opacity": .75 } });
        map.addLayer({ id: "course-lines", type: "line", source: "course", filter: ["in", ["get", "kind"], ["literal", ["start", "gate", "finish"]]], paint: { "line-color": "#f5f8f7", "line-width": 4 } });
        map.addLayer({ id: "course-marks", type: "circle", source: "course", filter: ["==", ["geometry-type"], "Point"], paint: { "circle-radius": 12, "circle-color": "#d9ff00", "circle-stroke-color": "#02131f", "circle-stroke-width": 3 } });
        map.addLayer({ id: "course-labels", type: "symbol", source: "course", filter: ["==", ["geometry-type"], "Point"], layout: { "text-field": ["get", "label"], "text-size": 12, "text-font": ["Open Sans Bold"] }, paint: { "text-color": "#02131f" } });
        map.addSource("replay-route", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "replay-route", type: "line", source: "replay-route", paint: { "line-color": "#d9ff00", "line-width": 3.5, "line-opacity": .95 } });
        map.addSource("boat-trails", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "boat-trails", type: "line", source: "boat-trails", paint: { "line-color": ["get", "color"], "line-width": ["case", ["==", ["get", "selected"], true], 3.3, 1.4], "line-opacity": ["case", ["==", ["get", "selected"], true], .9, .35] } });
        map.addSource("replay-boats", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "replay-boat-halos", type: "circle", source: "replay-boats", paint: { "circle-radius": ["case", ["==", ["get", "selected"], true], 15, 8], "circle-color": ["get", "color"], "circle-opacity": ["case", ["==", ["get", "selected"], true], .22, .09] } });
        map.addLayer({ id: "replay-boats", type: "circle", source: "replay-boats", paint: { "circle-radius": ["case", ["==", ["get", "selected"], true], 6, 4], "circle-color": ["get", "color"], "circle-stroke-color": "#00101a", "circle-stroke-width": 2 } });
        map.addLayer({ id: "replay-boat-labels", type: "symbol", source: "replay-boats", layout: { "text-field": ["get", "shortName"], "text-size": 10, "text-font": ["Open Sans Bold"], "text-offset": [0, 1.5], "text-anchor": "top" }, paint: { "text-color": "#f5f8f7", "text-halo-color": "#00101a", "text-halo-width": 2 } });
        if (routeCoordinates.length > 1) {
          const bounds = routeCoordinates.reduce((box, coordinate) => box.extend(coordinate as [number, number]), new maplibregl.LngLatBounds(routeCoordinates[0] as [number, number], routeCoordinates[0] as [number, number]));
          map.fitBounds(bounds, { padding: { top: 90, right: 90, bottom: 100, left: 90 }, maxZoom: 13, duration: 0 });
        }
      });
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [center, geojson, interactive, routeCoordinates]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || routeCoordinates.length < 2) return;
    const update = () => {
      const routeSource = map.getSource("replay-route") as import("maplibre-gl").GeoJSONSource | undefined;
      const trailSource = map.getSource("boat-trails") as import("maplibre-gl").GeoJSONSource | undefined;
      const boatSource = map.getSource("replay-boats") as import("maplibre-gl").GeoJSONSource | undefined;
      if (!routeSource || !trailSource || !boatSource) return false;
      routeSource.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: partialCoordinates(routeCoordinates, progress) } });
      const leaders = leaderboard.map((row, index) => {
        const rankFactor = (leaderboard.length - index) * .008;
        const boatProgress = Math.max(.03, Math.min(.985, progress + rankFactor - .024));
        const lateral = (index - (leaderboard.length - 1) / 2) * .0018;
        return { row, index, boatProgress, lateral, point: pointOnLine(routeCoordinates, boatProgress, lateral) };
      });
      trailSource.setData({ type: "FeatureCollection", features: leaders.map(({ row, boatProgress, lateral }) => ({ type: "Feature", properties: { color: row.color, selected: row.entryId === selectedEntryId }, geometry: { type: "LineString", coordinates: partialCoordinates(routeCoordinates, boatProgress).map((coordinate) => [coordinate[0] - lateral * .1, coordinate[1] + lateral * .1]) } })) });
      boatSource.setData({ type: "FeatureCollection", features: leaders.map(({ row, point }) => ({ type: "Feature", properties: { id: row.entryId, color: row.color, selected: row.entryId === selectedEntryId, shortName: row.boatName.split(" ").slice(0, 2).join(" ") }, geometry: { type: "Point", coordinates: point } })) });
      return true;
    };
    if (!update()) map.once("load", update);
  }, [leaderboard, progress, routeCoordinates, selectedEntryId]);

  return <div ref={containerRef} className="race-map" aria-label="Carte animée du parcours de course" />;
}
