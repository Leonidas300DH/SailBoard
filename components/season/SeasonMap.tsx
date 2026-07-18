"use client";

import { useCallback, useEffect, useRef } from "react";
import type { GeoJSONSource, Map as MaplibreMap } from "maplibre-gl";
import type { SeasonRace } from "@/lib/season-data";
import { MAP_FONT } from "@/lib/map/style";
import { bearingAt } from "@/lib/map/geo";
import { attachGraticule } from "@/lib/map/graticule";
import { useMapLibre } from "../map/useMapLibre";
import { useCameraDirector } from "../map/useCameraDirector";
import { useRouteAnimation } from "../map/useRouteAnimation";
import { MapHud } from "../map/MapHud";

const RACE_ACCENT = "#e8ff29";
const INK = "#010a10";

export function SeasonMap({
  races,
  selectedRace,
  circuitOpen,
  isPlaying,
  onSelect,
}: {
  races: SeasonRace[];
  selectedRace: SeasonRace;
  circuitOpen: boolean;
  isPlaying: boolean;
  onSelect: (raceId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  const racesRef = useRef(races);
  // Landing view is the whole circuit — the cinematic dive only happens once
  // the visitor explicitly picks a race.
  const hasEnteredRef = useRef(false);
  useEffect(() => {
    onSelectRef.current = onSelect;
    racesRef.current = races;
  }, [onSelect, races]);

  const handleLoad = useCallback((map: MaplibreMap) => {
    const allRaces = racesRef.current;
    const points: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: "FeatureCollection",
      features: allRaces.map((race) => ({
        type: "Feature",
        properties: { id: race.id, name: race.shortName, date: race.dateLabel, status: race.status },
        geometry: { type: "Point", coordinates: race.coordinates },
      })),
    };
    const chronology: GeoJSON.Feature<GeoJSON.LineString> = {
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: allRaces.map((race) => race.coordinates) },
    };

    attachGraticule(map);

    map.addSource("season-chronology", { type: "geojson", data: chronology });
    map.addLayer({
      id: "season-chronology",
      type: "line",
      source: "season-chronology",
      paint: { "line-color": "#9fb8c5", "line-width": 1.2, "line-opacity": 0.36, "line-dasharray": [2, 3] },
    });

    // Full route, faint and dashed — the animated comet draws on top of it.
    map.addSource("selected-route", { type: "geojson", data: emptyCollection() });
    map.addLayer({
      id: "selected-route-shadow",
      type: "line",
      source: "selected-route",
      paint: { "line-color": INK, "line-width": 7, "line-opacity": 0.7 },
    });
    map.addLayer({
      id: "selected-route-track",
      type: "line",
      source: "selected-route",
      paint: { "line-color": RACE_ACCENT, "line-width": 1.6, "line-opacity": 0.4, "line-dasharray": [1.5, 2.2] },
    });

    map.addSource("route-anim", { type: "geojson", lineMetrics: true, data: emptyCollection() });
    map.addLayer({
      id: "route-anim",
      type: "line",
      source: "route-anim",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-width": 3.6, "line-gradient": ["interpolate", ["linear"], ["line-progress"], 0, "rgba(0,0,0,0)", 1, "rgba(0,0,0,0)"] },
    });

    map.addSource("selected-boat", { type: "geojson", data: emptyCollection() });
    map.addLayer({
      id: "selected-boat-halo",
      type: "circle",
      source: "selected-boat",
      paint: { "circle-radius": 13, "circle-color": RACE_ACCENT, "circle-opacity": 0.18 },
    });
    map.addLayer({
      id: "selected-boat",
      type: "circle",
      source: "selected-boat",
      paint: { "circle-radius": 4.5, "circle-color": "#ffffff", "circle-stroke-color": RACE_ACCENT, "circle-stroke-width": 2.5 },
    });

    map.addSource("season-races", { type: "geojson", data: points });
    map.addLayer({
      id: "race-location-halo",
      type: "circle",
      source: "season-races",
      paint: { "circle-radius": 16, "circle-color": "#55e6c4", "circle-opacity": 0.14 },
    });
    map.addLayer({
      id: "race-locations",
      type: "circle",
      source: "season-races",
      paint: {
        // Completed = solid white dot; upcoming = white ring. Both must read
        // clearly against dark open water.
        "circle-radius": 6.5,
        "circle-color": ["match", ["get", "status"], "completed", "#f2f7f9", INK],
        "circle-stroke-color": ["match", ["get", "status"], "completed", INK, "#f2f7f9"],
        "circle-stroke-width": ["match", ["get", "status"], "completed", 2.5, 2],
      },
    });
    map.addLayer({
      id: "race-location-labels",
      type: "symbol",
      source: "season-races",
      layout: {
        "text-field": ["format", ["get", "name"], { "font-scale": 1 }, "\n", {}, ["get", "date"], { "font-scale": 0.76 }],
        "text-size": 12,
        "text-font": MAP_FONT,
        "text-offset": [0, 1.45],
        "text-anchor": "top",
        "text-allow-overlap": false,
      },
      paint: { "text-color": "#f2f7f9", "text-halo-color": INK, "text-halo-width": 2 },
    });

    map.on("mouseenter", "race-locations", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "race-locations", () => { map.getCanvas().style.cursor = ""; });
    map.on("click", "race-locations", (event) => {
      const id = event.features?.[0]?.properties?.id;
      if (typeof id === "string") onSelectRef.current(id);
    });
  }, []);

  const compact = typeof window !== "undefined" && window.innerWidth < 760;
  const { mapRef, isReady } = useMapLibre(containerRef, {
    preset: "season",
    center: compact ? [-3.05, 47.82] : [-3.05, 48.05],
    zoom: compact ? 6.45 : 6.85,
    minZoom: 6.2,
    onLoad: handleLoad,
  });
  const { flyToTarget, flyToBounds } = useCameraDirector(mapRef, isReady);

  // Selection: swap route geometry, restyle markers, direct the camera.
  // Races without an officially traced course show no line at all — the
  // geometry is never invented.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) return;
    const routeSource = map.getSource("selected-route") as GeoJSONSource | undefined;
    const animSource = map.getSource("route-anim") as GeoJSONSource | undefined;
    const boatSource = map.getSource("selected-boat") as GeoJSONSource | undefined;
    if (!routeSource || !animSource) return;
    routeSource.setData(selectedRace.route ?? emptyCollection());
    animSource.setData(selectedRace.route ?? emptyCollection());
    if (!selectedRace.route) boatSource?.setData(emptyCollection());
    const isSelected = ["==", ["get", "id"], selectedRace.id];
    map.setPaintProperty("race-location-halo", "circle-color", ["case", isSelected, RACE_ACCENT, "#55e6c4"]);
    map.setPaintProperty("race-location-halo", "circle-radius", ["case", isSelected, 24, 16]);
    map.setPaintProperty("race-location-halo", "circle-opacity", ["case", isSelected, 0.22, 0.14]);
    map.setPaintProperty("race-locations", "circle-radius", ["case", isSelected, 8.5, 6.5]);
    map.setPaintProperty("race-locations", "circle-color", [
      "case",
      isSelected,
      RACE_ACCENT,
      ["match", ["get", "status"], "completed", "#f2f7f9", INK],
    ]);
    map.setPaintProperty("race-locations", "circle-stroke-color", [
      "case",
      isSelected,
      INK,
      ["match", ["get", "status"], "completed", INK, "#f2f7f9"],
    ]);

    const overview = (rightPadding: number) => {
      const longitudes = races.map((race) => race.coordinates[0]);
      const latitudes = races.map((race) => race.coordinates[1]);
      const isCompact = map.getContainer().clientWidth < 760;
      flyToBounds(
        [[Math.min(...longitudes), Math.min(...latitudes)], [Math.max(...longitudes), Math.max(...latitudes)]],
        isCompact ? 46 : { top: 96, right: rightPadding, bottom: 150, left: 90 },
        7.4,
      );
    };

    if (!hasEnteredRef.current) {
      hasEnteredRef.current = true;
      overview(circuitOpen ? 400 : 90);
      return;
    }

    if (circuitOpen) {
      overview(400);
    } else {
      const coordinates = selectedRace.route?.geometry.coordinates;
      flyToTarget({
        center: selectedRace.coordinates,
        zoom: coordinates ? 10.4 : 10.8,
        pitch: 48,
        bearing: coordinates ? bearingAt(coordinates, 0) - 18 : 0,
      });
    }
  }, [circuitOpen, flyToBounds, flyToTarget, isReady, mapRef, races, selectedRace]);

  useRouteAnimation({
    mapRef,
    isReady,
    coordinates: selectedRace.route?.geometry.coordinates ?? [],
    playing: isPlaying && Boolean(selectedRace.route),
    gradientLayerId: "route-anim",
    boatSourceId: "selected-boat",
  });

  const recenter = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const coordinates = selectedRace.route?.geometry.coordinates;
    flyToTarget({
      center: selectedRace.coordinates,
      zoom: coordinates ? 10.4 : 10.8,
      pitch: 48,
      bearing: coordinates ? bearingAt(coordinates, 0) - 18 : 0,
    });
  }, [flyToTarget, mapRef, selectedRace]);

  return <div className="season-map-frame">
    <div ref={containerRef} className="race-map season-ocean-map" aria-label="Carte tactique des courses de la saison" />
    <MapHud
      mapRef={mapRef}
      isReady={isReady}
      target={selectedRace.coordinates}
      targetLabel={selectedRace.shortName}
      onRecenter={recenter}
    />
  </div>;
}

function emptyCollection(): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}
