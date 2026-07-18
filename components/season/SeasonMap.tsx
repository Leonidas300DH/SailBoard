"use client";

import { useCallback, useEffect, useRef } from "react";
import type { GeoJSONSource, Map as MaplibreMap, Marker } from "maplibre-gl";
import type { SeasonRace } from "@/lib/season-data";
import { bearingAt } from "@/lib/map/geo";
import { attachGraticule } from "@/lib/map/graticule";
import { useMapLibre } from "../map/useMapLibre";
import { useCameraDirector } from "../map/useCameraDirector";
import { useRouteAnimation } from "../map/useRouteAnimation";
import { MapHud } from "../map/MapHud";
import { CloudLayer } from "../map/CloudLayer";

const RACE_ACCENT = "#e8ff29";
const INK = "#010a10";

export function SeasonMap({
  races,
  selectedRace,
  isPlaying,
  windDirection = 250,
  windKnots = 12,
  onSelect,
}: {
  races: SeasonRace[];
  selectedRace: SeasonRace | null;
  isPlaying: boolean;
  windDirection?: number;
  windKnots?: number;
  onSelect: (raceId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  const racesRef = useRef(races);
  useEffect(() => {
    onSelectRef.current = onSelect;
    racesRef.current = races;
  }, [onSelect, races]);

  const markersRef = useRef(new Map<string, Marker>());

  const handleLoad = useCallback((map: MaplibreMap) => {
    const allRaces = racesRef.current;
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

    // Stage markers are DOM elements: sober dots with native-type labels —
    // white for sailed stages, ringed for upcoming, yellow when selected.
    void import("maplibre-gl").then(({ default: maplibregl }) => {
      const nextRaceId = allRaces.find((race) => race.status === "upcoming")?.id;
      allRaces.forEach((race) => {
        const element = document.createElement("button");
        element.type = "button";
        element.className = "race-marker";
        element.setAttribute("aria-label", `${race.name}, ${race.dateLabel} 2026`);
        element.dataset.status = race.status;
        if (race.id === nextRaceId) element.classList.add("next");
        element.innerHTML = `<i aria-hidden></i><span><strong>${race.shortName}</strong><small>${race.dateLabel}</small></span>`;
        element.addEventListener("click", (event) => {
          event.stopPropagation();
          onSelectRef.current(race.id);
        });
        const marker = new maplibregl.Marker({ element, anchor: "center" })
          .setLngLat(race.coordinates)
          .addTo(map);
        markersRef.current.set(race.id, marker);
      });
    });
  }, []);

  const compact = typeof window !== "undefined" && window.innerWidth < 760;
  const { mapRef, isReady } = useMapLibre(containerRef, {
    preset: "season",
    center: compact ? [-3.05, 47.82] : [-3.05, 48.05],
    zoom: compact ? 6.45 : 6.85,
    pitch: compact ? 26 : 34,
    bearing: -8,
    minZoom: 6.2,
    maxPitch: 65,
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
    routeSource.setData(selectedRace?.route ?? emptyCollection());
    animSource.setData(selectedRace?.route ?? emptyCollection());
    if (!selectedRace?.route) boatSource?.setData(emptyCollection());
    markersRef.current.forEach((marker, raceId) => {
      marker.getElement().classList.toggle("selected", raceId === selectedRace?.id);
    });

    if (!selectedRace) {
      // No selection = the whole circuit. This is also the landing view.
      const longitudes = races.map((race) => race.coordinates[0]);
      const latitudes = races.map((race) => race.coordinates[1]);
      const isCompact = map.getContainer().clientWidth < 760;
      flyToBounds(
        [[Math.min(...longitudes), Math.min(...latitudes)], [Math.max(...longitudes), Math.max(...latitudes)]],
        isCompact ? 46 : { top: 96, right: 90, bottom: 150, left: 90 },
        7.4,
        { pitch: isCompact ? 26 : 34, bearing: -8 },
      );
      return;
    }

    const coordinates = selectedRace.route?.geometry.coordinates;
    flyToTarget({
      center: selectedRace.coordinates,
      zoom: coordinates ? 10.4 : 10.8,
      pitch: 52,
      bearing: coordinates ? bearingAt(coordinates, 0) - 18 : 0,
    });
  }, [flyToBounds, flyToTarget, isReady, mapRef, races, selectedRace]);

  useRouteAnimation({
    mapRef,
    isReady,
    coordinates: selectedRace?.route?.geometry.coordinates ?? [],
    playing: isPlaying && Boolean(selectedRace?.route),
    gradientLayerId: "route-anim",
    boatSourceId: "selected-boat",
  });

  const recenter = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!selectedRace) {
      const longitudes = races.map((race) => race.coordinates[0]);
      const latitudes = races.map((race) => race.coordinates[1]);
      flyToBounds(
        [[Math.min(...longitudes), Math.min(...latitudes)], [Math.max(...longitudes), Math.max(...latitudes)]],
        { top: 96, right: 90, bottom: 150, left: 90 },
        7.4,
        { pitch: map.getContainer().clientWidth < 760 ? 26 : 34, bearing: -8 },
      );
      return;
    }
    const coordinates = selectedRace.route?.geometry.coordinates;
    flyToTarget({
      center: selectedRace.coordinates,
      zoom: coordinates ? 10.4 : 10.8,
      pitch: 52,
      bearing: coordinates ? bearingAt(coordinates, 0) - 18 : 0,
    });
  }, [flyToBounds, flyToTarget, mapRef, races, selectedRace]);

  return <div className="season-map-frame">
    <div ref={containerRef} className="race-map season-ocean-map" aria-label="Carte des étapes de la saison" />
    <CloudLayer
      windDirection={windDirection}
      windKnots={windKnots}
      mapRef={mapRef}
      isReady={isReady}
    />
    <MapHud
      mapRef={mapRef}
      isReady={isReady}
      target={selectedRace?.coordinates}
      targetLabel={selectedRace?.shortName}
      onRecenter={recenter}
    />
  </div>;
}

function emptyCollection(): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}
