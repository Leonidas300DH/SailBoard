"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Map as MaplibreMap, Marker } from "maplibre-gl";
import type { SeasonRace } from "@/lib/season-data";
import { attachGraticule } from "@/lib/map/graticule";
import { buildCurvedChronology, chronologyFeatures } from "@/lib/map/season-chronology";
import { applySeasonMapMode } from "@/lib/map/style";
import { useMapLibre } from "../map/useMapLibre";
import { useCameraDirector } from "../map/useCameraDirector";
import { useSeasonChronologyAnimation } from "../map/useSeasonChronologyAnimation";
import { useTacticalMapLayers } from "../map/useTacticalMapLayers";
import { MapHud } from "../map/MapHud";
import { CloudLayer } from "../map/CloudLayer";
import type { MapDisplaySettings } from "@/lib/map-settings";
import { useMapDisplaySettings } from "@/lib/map-settings-client";

const INK = "#010a10";
const LABEL_POSITIONS: Partial<Record<string, "top" | "right" | "left">> = {
  "spi-ouest-france": "left",
  "semaine-la-rochelle": "right",
  "trophee-ycca": "right",
  "challenge-an-avel-braz": "top",
};

// Several WDT stages share the same stretch of coast. At circuit scale their
// exact coordinates collapse into a single hit target, so those markers are
// spread by a few screen pixels while remaining anchored to their real place.
const MARKER_OFFSETS: Partial<Record<string, [number, number]>> = {
  "spi-ouest-france": [-32, 22],
  "trophee-ycca": [30, 30],
  "challenge-an-avel-braz": [32, -22],
};

export function SeasonMap({
  races,
  selectedRace,
  windDirection = 250,
  windKnots = 12,
  mapSettings,
  onSelect,
}: {
  races: SeasonRace[];
  selectedRace: SeasonRace | null;
  windDirection?: number;
  windKnots?: number;
  mapSettings: MapDisplaySettings;
  onSelect: (raceId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const displaySettings = useMapDisplaySettings(mapSettings);
  const [desktopEffectsAllowed, setDesktopEffectsAllowed] = useState(false);
  const effectiveMapMode = displaySettings.defaultMode;
  const onSelectRef = useRef(onSelect);
  const racesRef = useRef(races);
  useEffect(() => {
    onSelectRef.current = onSelect;
    racesRef.current = races;
  }, [onSelect, races]);

  const markersRef = useRef(new Map<string, Marker>());
  const chronologyLegs = useMemo(
    () => buildCurvedChronology(races.map((race) => race.coordinates)),
    [races],
  );

  const handleLoad = useCallback((map: MaplibreMap) => {
    const allRaces = racesRef.current;
    const curvedLegs = buildCurvedChronology(allRaces.map((race) => race.coordinates));
    const chronology = chronologyFeatures(curvedLegs);

    attachGraticule(map);

    map.addSource("season-chronology", { type: "geojson", data: chronology });
    map.addLayer({
      id: "season-chronology-depth",
      type: "line",
      source: "season-chronology",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": INK, "line-width": 2.8, "line-opacity": 0.24, "line-translate": [0, 1] },
    });
    map.addLayer({
      id: "season-chronology-glow",
      type: "line",
      source: "season-chronology",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#6bb9d5", "line-width": 2.4, "line-opacity": 0.08, "line-blur": 2.5 },
    });
    map.addLayer({
      id: "season-chronology",
      type: "line",
      source: "season-chronology",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#83b9cc", "line-width": 1.15, "line-opacity": 0.52 },
    });

    map.addSource("season-flow", { type: "geojson", lineMetrics: true, data: emptyCollection() });
    map.addLayer({
      id: "season-flow-glint",
      type: "line",
      source: "season-flow",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-width": 2.5,
        "line-blur": 1.2,
        "line-gradient": ["interpolate", ["linear"], ["line-progress"], 0, "rgba(72,185,230,0)", 1, "rgba(72,185,230,0)"],
      },
    });

    // Stage markers are DOM elements: sober dots with native-type labels —
    // cyan for sailed stages, acid yellow for upcoming, red when selected.
    void import("maplibre-gl").then(({ default: maplibregl }) => {
      const nextRaceId = allRaces.find((race) => race.status === "upcoming")?.id;
      allRaces.forEach((race, raceIndex) => {
        const element = document.createElement("button");
        element.type = "button";
        element.className = "race-marker";
        element.setAttribute("aria-label", `${race.name}, ${race.dateLabel} 2026`);
        element.dataset.status = race.status;
        const labelPosition = LABEL_POSITIONS[race.id];
        if (labelPosition) element.dataset.labelPosition = labelPosition;
        if (race.id === nextRaceId) element.classList.add("next");
        element.innerHTML = `<i aria-hidden="true">${raceIndex + 1}</i><span><strong>${race.shortName}</strong><small>${race.dateLabel}</small></span>`;
        element.addEventListener("click", (event) => {
          event.stopPropagation();
          onSelectRef.current(race.id);
        });
        const marker = new maplibregl.Marker({
          element,
          anchor: "center",
          offset: MARKER_OFFSETS[race.id] ?? [0, 0],
        })
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
  const tacticalEnabled = desktopEffectsAllowed && effectiveMapMode === "tactical";

  useEffect(() => {
    const query = window.matchMedia("(min-width: 761px) and (min-height: 560px)");
    const sync = () => setDesktopEffectsAllowed(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) return;
    applySeasonMapMode(map, effectiveMapMode);
  }, [effectiveMapMode, isReady, mapRef]);

  const trafficStatus = useTacticalMapLayers({
    mapRef,
    isReady,
    enabled: tacticalEnabled,
    showAircraft: displaySettings.showAircraft,
    showVessels: displaySettings.showVessels,
    showCityLights: displaySettings.showCityLights,
  });

  useSeasonChronologyAnimation({ mapRef, isReady, legs: chronologyLegs });

  // Selection restyles markers and directs the camera to the race area.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) return;
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

    flyToTarget({
      center: selectedRace.coordinates,
      zoom: 10.8,
      pitch: 52,
      bearing: 0,
    });
  }, [flyToBounds, flyToTarget, isReady, mapRef, races, selectedRace]);

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
    flyToTarget({
      center: selectedRace.coordinates,
      zoom: 10.8,
      pitch: 52,
      bearing: 0,
    });
  }, [flyToBounds, flyToTarget, mapRef, races, selectedRace]);

  return <div className="season-map-frame">
    <div ref={containerRef} className="race-map season-ocean-map" aria-label="Carte des étapes de la saison" />
    {displaySettings.showClouds ? <CloudLayer
      windDirection={windDirection}
      windKnots={windKnots}
      mapRef={mapRef}
      isReady={isReady}
      tactical={effectiveMapMode === "tactical"}
    /> : null}
    <MapHud
      mapRef={mapRef}
      isReady={isReady}
      target={selectedRace?.coordinates}
      targetOffset={selectedRace ? MARKER_OFFSETS[selectedRace.id] : undefined}
      targetLabel={selectedRace?.shortName}
      onRecenter={recenter}
    />
    {tacticalEnabled && (displaySettings.showAircraft || displaySettings.showVessels) ? (
      <div className="map-feed-status mono" aria-live="polite">
        {displaySettings.showAircraft ? <span data-state={trafficStatus.aircraft}>ADS-B {trafficStatus.aircraft === "live" ? "LIVE" : "MODEL"}</span> : null}
        {displaySettings.showVessels ? <span data-state={trafficStatus.vessels}>AIS {trafficStatus.vessels === "live" ? "LIVE" : "MODEL"}</span> : null}
      </div>
    ) : null}
  </div>;
}

function emptyCollection(): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}
