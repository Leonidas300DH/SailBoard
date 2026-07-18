"use client";

import { useCallback, useMemo, useRef } from "react";
import type { Map as MaplibreMap } from "maplibre-gl";
import { MAP_FONT } from "@/lib/map/style";
import { markThresholds } from "@/lib/map/geo";
import { attachGraticule } from "@/lib/map/graticule";
import { useMapLibre } from "../map/useMapLibre";
import { useCameraDirector } from "../map/useCameraDirector";
import { useRouteAnimation } from "../map/useRouteAnimation";
import { MapHud } from "../map/MapHud";

const RACE_ACCENT = "#e8ff29";
const INK = "#010a10";
const MARK_IDLE = "#3b5662";

/**
 * The official traced course, animated: the comet redraws the route while
 * marks light up in rounding order. One simulated runner point — clearly a
 * simulation, no GPS tracks involved.
 */
export function CourseMap({
  center,
  geojson,
  isPlaying,
}: {
  center: [number, number];
  geojson: GeoJSON.FeatureCollection;
  isPlaying: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const litCountRef = useRef(-1);

  const routeCoordinates = useMemo(() => {
    const route = geojson.features.find((feature) => feature.properties?.kind === "route");
    return route?.geometry.type === "LineString" ? route.geometry.coordinates : [];
  }, [geojson]);

  const marks = useMemo(() => {
    return geojson.features
      .filter((feature) => feature.properties?.kind && !["route", "handle"].includes(String(feature.properties.kind)))
      .map((feature) => {
        const geometry = feature.geometry;
        const position = geometry.type === "Point"
          ? geometry.coordinates
          : geometry.type === "LineString"
            ? geometry.coordinates[0]
            : null;
        return position ? { id: String(feature.properties?.id ?? feature.properties?.label ?? ""), position } : null;
      })
      .filter((mark): mark is { id: string; position: GeoJSON.Position } => mark !== null && mark.id !== "");
  }, [geojson]);

  const thresholds = useMemo(
    () => markThresholds(routeCoordinates, marks.map((mark) => mark.position)),
    [marks, routeCoordinates],
  );

  const routeBounds = useMemo<[[number, number], [number, number]] | null>(() => {
    if (routeCoordinates.length < 2) return null;
    const longitudes = routeCoordinates.map((coordinate) => coordinate[0]);
    const latitudes = routeCoordinates.map((coordinate) => coordinate[1]);
    return [
      [Math.min(...longitudes), Math.min(...latitudes)],
      [Math.max(...longitudes), Math.max(...latitudes)],
    ];
  }, [routeCoordinates]);

  const handleLoad = useCallback((map: MaplibreMap) => {
    attachGraticule(map);

    map.addSource("course", { type: "geojson", data: geojson, promoteId: "id" });
    map.addLayer({
      id: "course-route-shadow",
      type: "line",
      source: "course",
      filter: ["==", ["get", "kind"], "route"],
      paint: { "line-color": INK, "line-width": 8, "line-opacity": 0.75 },
    });
    map.addLayer({
      id: "course-route",
      type: "line",
      source: "course",
      filter: ["==", ["get", "kind"], "route"],
      paint: { "line-color": "#9bb4c0", "line-width": 1.8, "line-dasharray": [2, 2.2], "line-opacity": 0.6 },
    });
    map.addSource("route-anim", {
      type: "geojson",
      lineMetrics: true,
      data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: routeCoordinates } },
    });
    map.addLayer({
      id: "route-anim",
      type: "line",
      source: "route-anim",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-width": 3.8, "line-gradient": ["interpolate", ["linear"], ["line-progress"], 0, "rgba(0,0,0,0)", 1, "rgba(0,0,0,0)"] },
    });
    map.addLayer({
      id: "course-lines",
      type: "line",
      source: "course",
      filter: ["in", ["get", "kind"], ["literal", ["start", "gate", "finish"]]],
      paint: { "line-color": "#f2f7f9", "line-width": 4 },
    });
    map.addLayer({
      id: "course-marks-halo",
      type: "circle",
      source: "course",
      filter: ["==", ["geometry-type"], "Point"],
      paint: {
        "circle-radius": 19,
        "circle-color": RACE_ACCENT,
        "circle-opacity": ["case", ["boolean", ["feature-state", "lit"], false], 0.22, 0],
      },
    });
    map.addLayer({
      id: "course-marks",
      type: "circle",
      source: "course",
      filter: ["==", ["geometry-type"], "Point"],
      paint: {
        "circle-radius": 11,
        "circle-color": ["case", ["boolean", ["feature-state", "lit"], false], RACE_ACCENT, MARK_IDLE],
        "circle-stroke-color": INK,
        "circle-stroke-width": 3,
      },
    });
    map.addLayer({
      id: "course-labels",
      type: "symbol",
      source: "course",
      filter: ["==", ["geometry-type"], "Point"],
      layout: { "text-field": ["get", "label"], "text-size": 12, "text-font": MAP_FONT },
      paint: {
        "text-color": ["case", ["boolean", ["feature-state", "lit"], false], INK, "#c8d6dc"],
      },
    });

    map.addSource("sim-boat", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    map.addLayer({
      id: "sim-boat-halo",
      type: "circle",
      source: "sim-boat",
      paint: { "circle-radius": 14, "circle-color": RACE_ACCENT, "circle-opacity": 0.18 },
    });
    map.addLayer({
      id: "sim-boat",
      type: "circle",
      source: "sim-boat",
      paint: { "circle-radius": 5, "circle-color": "#ffffff", "circle-stroke-color": RACE_ACCENT, "circle-stroke-width": 2.5 },
    });

    if (routeBounds) {
      map.fitBounds(routeBounds, { padding: { top: 96, right: 96, bottom: 110, left: 96 }, maxZoom: 13.5, duration: 0 });
    }
  }, [geojson, routeBounds, routeCoordinates]);

  const { mapRef, isReady } = useMapLibre(containerRef, {
    preset: "course",
    center,
    zoom: 11.7,
    onLoad: handleLoad,
  });
  const { flyToBounds } = useCameraDirector(mapRef, isReady);

  const handleProgress = useCallback((progress: number) => {
    const map = mapRef.current;
    if (!map) return;
    const litCount = thresholds.filter((threshold) => threshold <= progress).length;
    if (litCount === litCountRef.current) return;
    litCountRef.current = litCount;
    marks.forEach((mark, index) => {
      map.setFeatureState({ source: "course", id: mark.id }, { lit: thresholds[index] <= progress });
    });
  }, [mapRef, marks, thresholds]);

  useRouteAnimation({
    mapRef,
    isReady,
    coordinates: routeCoordinates,
    playing: isPlaying,
    durationMs: 18_000,
    gradientLayerId: "route-anim",
    boatSourceId: "sim-boat",
    onProgress: handleProgress,
  });

  const recenter = useCallback(() => {
    if (routeBounds) flyToBounds(routeBounds, { top: 96, right: 96, bottom: 110, left: 96 }, 13.5);
  }, [flyToBounds, routeBounds]);

  return <div className="season-map-frame">
    <div ref={containerRef} className="race-map" aria-label="Carte animée du parcours officiel" />
    <MapHud
      mapRef={mapRef}
      isReady={isReady}
      target={routeBounds ? undefined : center}
      onRecenter={routeBounds ? recenter : undefined}
    />
  </div>;
}
