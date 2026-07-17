"use client";

import { useEffect, useRef } from "react";
import type { SeasonRace } from "@/lib/season-data";

const IGN_TILES = "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}";

function partialLine(coordinates: GeoJSON.Position[], progress: number): GeoJSON.Feature<GeoJSON.LineString> {
  if (coordinates.length < 2) return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates } };
  const scaled = Math.max(0, Math.min(1, progress)) * (coordinates.length - 1);
  const index = Math.min(coordinates.length - 2, Math.floor(scaled));
  const local = scaled - index;
  const next = coordinates.slice(0, index + 1);
  const from = coordinates[index];
  const to = coordinates[index + 1];
  next.push([from[0] + (to[0] - from[0]) * local, from[1] + (to[1] - from[1]) * local]);
  return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: next } };
}

function boatPoint(coordinates: GeoJSON.Position[], progress: number): GeoJSON.Feature<GeoJSON.Point> {
  const line = partialLine(coordinates, progress).geometry.coordinates;
  return { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: line.at(-1) ?? coordinates[0] } };
}

export function EventLocatorMap({
  races,
  selectedRaceId,
  isPlaying,
  onSelect,
}: {
  races: SeasonRace[];
  selectedRaceId: string;
  isPlaying: boolean;
  onSelect: (raceId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const animationRef = useRef<number | null>(null);
  const onSelectRef = useRef(onSelect);
  const racesRef = useRef(races);
  const selectedRaceIdRef = useRef(selectedRaceId);

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { racesRef.current = races; }, [races]);
  useEffect(() => { selectedRaceIdRef.current = selectedRaceId; }, [selectedRaceId]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    void import("maplibre-gl").then(({ default: maplibregl }) => {
      if (cancelled || !containerRef.current) return;
      const points: GeoJSON.FeatureCollection<GeoJSON.Point> = {
        type: "FeatureCollection",
        features: racesRef.current.map((race) => ({
          type: "Feature",
          properties: { id: race.id, name: race.shortName, date: race.dateLabel, status: race.status },
          geometry: { type: "Point", coordinates: race.coordinates },
        })),
      };
      const chronology: GeoJSON.Feature<GeoJSON.LineString> = {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: racesRef.current.map((race) => race.coordinates) },
      };
      const compact = containerRef.current.clientWidth < 760;
      const map = new maplibregl.Map({
        container: containerRef.current,
        center: compact ? [-3.05, 47.82] : [-3.05, 48.05],
        zoom: compact ? 6.45 : 6.85,
        minZoom: 6.2,
        attributionControl: false,
        style: {
          version: 8,
          sources: { ign: { type: "raster", tiles: [IGN_TILES], tileSize: 256, attribution: "© IGN / Géoplateforme" } },
          layers: [{ id: "ign", type: "raster", source: "ign", paint: { "raster-saturation": -0.3, "raster-contrast": 0.38, "raster-brightness-max": 0.62, "raster-brightness-min": 0.02 } }],
        },
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-left");
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
      map.on("load", () => {
        map.addSource("season-chronology", { type: "geojson", data: chronology });
        map.addLayer({ id: "season-chronology", type: "line", source: "season-chronology", paint: { "line-color": "#9fb8c5", "line-width": 1.3, "line-opacity": 0.42, "line-dasharray": [2, 3] } });
        map.addSource("season-races", { type: "geojson", data: points });
        map.addLayer({ id: "race-location-halo", type: "circle", source: "season-races", paint: { "circle-radius": ["case", ["==", ["get", "id"], selectedRaceIdRef.current], 25, 14], "circle-color": "#d9ff00", "circle-opacity": ["case", ["==", ["get", "id"], selectedRaceIdRef.current], 0.2, 0.07] } });
        map.addLayer({ id: "race-locations", type: "circle", source: "season-races", paint: { "circle-radius": ["case", ["==", ["get", "id"], selectedRaceIdRef.current], 9, 5], "circle-color": ["case", ["==", ["get", "id"], selectedRaceIdRef.current], "#d9ff00", "#d7e4e8"], "circle-stroke-color": "#00101a", "circle-stroke-width": 3 } });
        map.addLayer({ id: "race-location-labels", type: "symbol", source: "season-races", layout: { "text-field": ["format", ["get", "name"], { "font-scale": 1 }, "\n", {}, ["get", "date"], { "font-scale": 0.76 }], "text-size": 12, "text-font": ["Open Sans Bold"], "text-offset": [0, 1.45], "text-anchor": "top", "text-allow-overlap": false }, paint: { "text-color": "#f5f8f7", "text-halo-color": "#00101a", "text-halo-width": 2 } });
        map.addSource("selected-route", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "selected-route-shadow", type: "line", source: "selected-route", paint: { "line-color": "#00101a", "line-width": 8, "line-opacity": 0.8 } });
        map.addLayer({ id: "selected-route-line", type: "line", source: "selected-route", paint: { "line-color": "#d9ff00", "line-width": 3.3, "line-opacity": 0.95 } });
        map.addSource("selected-route-progress", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "selected-route-progress", type: "line", source: "selected-route-progress", paint: { "line-color": "#ffffff", "line-width": 4.4, "line-opacity": 0.96 } });
        map.addSource("selected-boat", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "selected-boat-halo", type: "circle", source: "selected-boat", paint: { "circle-radius": 14, "circle-color": "#d9ff00", "circle-opacity": 0.2 } });
        map.addLayer({ id: "selected-boat", type: "circle", source: "selected-boat", paint: { "circle-radius": 5, "circle-color": "#ffffff", "circle-stroke-color": "#d9ff00", "circle-stroke-width": 3 } });
        map.on("mouseenter", "race-locations", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "race-locations", () => { map.getCanvas().style.cursor = ""; });
        map.on("click", "race-locations", (event) => {
          const id = event.features?.[0]?.properties?.id;
          if (typeof id === "string") onSelectRef.current(id);
        });
      });
    });
    return () => {
      cancelled = true;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const race = races.find((item) => item.id === selectedRaceId);
    if (!map || !race) return;
    const update = () => {
      const routeSource = map.getSource("selected-route") as import("maplibre-gl").GeoJSONSource | undefined;
      if (!routeSource) return false;
      routeSource.setData(race.route);
      map.setPaintProperty("race-location-halo", "circle-radius", ["case", ["==", ["get", "id"], selectedRaceId], 25, 14]);
      map.setPaintProperty("race-location-halo", "circle-opacity", ["case", ["==", ["get", "id"], selectedRaceId], 0.2, 0.07]);
      map.setPaintProperty("race-locations", "circle-radius", ["case", ["==", ["get", "id"], selectedRaceId], 9, 5]);
      map.setPaintProperty("race-locations", "circle-color", ["case", ["==", ["get", "id"], selectedRaceId], "#d9ff00", "#d7e4e8"]);
      map.easeTo({ center: race.coordinates, zoom: 8.85, duration: 900, essential: true });
      return true;
    };
    if (!update()) map.once("load", update);
  }, [races, selectedRaceId]);

  useEffect(() => {
    const map = mapRef.current;
    const race = races.find((item) => item.id === selectedRaceId);
    if (!map || !race) return;
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    const coordinates = race.route.geometry.coordinates;
    const started = performance.now();
    let frozenProgress = 0.72;
    const frame = (now: number) => {
      const progress = isPlaying ? ((now - started) % 9000) / 9000 : frozenProgress;
      if (isPlaying) frozenProgress = progress;
      const progressSource = map.getSource("selected-route-progress") as import("maplibre-gl").GeoJSONSource | undefined;
      const boatSource = map.getSource("selected-boat") as import("maplibre-gl").GeoJSONSource | undefined;
      progressSource?.setData(partialLine(coordinates, progress));
      boatSource?.setData(boatPoint(coordinates, progress));
      animationRef.current = requestAnimationFrame(frame);
    };
    animationRef.current = requestAnimationFrame(frame);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, races, selectedRaceId]);

  return <div ref={containerRef} className="race-map season-ocean-map" aria-label="Carte interactive des courses de la saison" />;
}
