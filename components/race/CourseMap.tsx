"use client";

import { useCallback, useRef } from "react";
import type { Map as MaplibreMap } from "maplibre-gl";
import { attachGraticule } from "@/lib/map/graticule";
import { useMapLibre } from "../map/useMapLibre";
import { MapHud } from "../map/MapHud";
import { CloudLayer } from "../map/CloudLayer";
import { useAdaptiveTerrain } from "../map/useAdaptiveTerrain";

const SELECTED_RACE = "#ff1e1e";
const INK = "#010a10";

/**
 * Geographic context for a stage: satellite imagery, its race area and the
 * documented weather. SailBoard does not imply that an official route exists.
 */
export function CourseMap({
  center,
  stageId,
  windDirection = 250,
  windKnots = 12,
}: {
  center: [number, number];
  stageId: string;
  windDirection?: number;
  windKnots?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terrainEnabled = typeof window !== "undefined" && window.innerWidth >= 760;

  const handleLoad = useCallback((map: MaplibreMap) => {
    attachGraticule(map);
    map.addSource("stage-location", {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: center } },
    });
    map.addLayer({
      id: "stage-location-halo",
      type: "circle",
      source: "stage-location",
      paint: { "circle-radius": 18, "circle-color": SELECTED_RACE, "circle-opacity": 0.2 },
    });
    map.addLayer({
      id: "stage-location-dot",
      type: "circle",
      source: "stage-location",
      paint: { "circle-radius": 7, "circle-color": SELECTED_RACE, "circle-stroke-color": INK, "circle-stroke-width": 3 },
    });
  }, [center]);

  const { mapRef, isReady } = useMapLibre(containerRef, {
    preset: "course",
    center,
    zoom: 11.7,
    pitch: 42,
    bearing: -10,
    maxPitch: 65,
    terrain: terrainEnabled,
    onLoad: handleLoad,
  });
  useAdaptiveTerrain(mapRef, isReady, stageId);

  return <div className="season-map-frame">
    <div ref={containerRef} className="race-map" aria-label="Carte satellite du plan d’eau" />
    <CloudLayer windDirection={windDirection} windKnots={windKnots} mapRef={mapRef} isReady={isReady} />
    <MapHud mapRef={mapRef} isReady={isReady} target={center} targetLabel="Zone de course" />
  </div>;
}
