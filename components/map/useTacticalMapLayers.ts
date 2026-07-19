"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { GeoJSONSource, Map as MaplibreMap, Marker } from "maplibre-gl";
import {
  destinationPoint,
  FALLBACK_AIR_ROUTES,
  haversineKm,
  pointAlongPath,
  SHIPPING_LANES,
  TACTICAL_CITIES,
  type LiveTrafficPoint,
  type MapCoordinate,
  type MotionPath,
} from "@/lib/map/tactical-data";

const OPEN_MAP_TILES = "https://tiles.openfreemap.org/planet";
const EMODNET_CONTOURS = "https://ows.emodnet-bathymetry.eu/wms?service=WMS&request=GetMap&version=1.1.1&layers=emodnet:contours&styles=&format=image/png&transparent=true&width=512&height=512&srs=EPSG:3857&bbox={bbox-epsg-3857}";
const TERRARIUM_DEM = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

const TACTICAL_BASE_LAYERS = [
  "tactical-bathymetry-contours",
  "tactical-land-contours",
  "tactical-road-network",
] as const;
const TACTICAL_CITY_LAYERS = ["tactical-city-glow", "tactical-city-core"] as const;
const TACTICAL_VESSEL_LAYERS = ["tactical-vessels-glow", "tactical-vessels-core"] as const;
const TACTICAL_AIRCRAFT_LAYERS = ["tactical-aircraft-glow", "tactical-aircraft-core"] as const;

type FeedMode = "idle" | "loading" | "live" | "simulated";

type TrafficKind = "aircraft" | "vessel";

type TrafficMarkerRecord = {
  marker: Marker;
  element: HTMLDivElement;
  icon: HTMLImageElement;
};

export type TacticalFeedStatus = {
  aircraft: FeedMode;
  vessels: FeedMode;
};

function createDemSource() {
  return Promise.all([import("maplibre-contour"), import("maplibre-gl")]).then(([contour, maplibre]) => {
    const demSource = new contour.default.DemSource({
      id: "sailboard-tactical-dem",
      url: TERRARIUM_DEM,
      encoding: "terrarium",
      maxzoom: 12,
      cacheSize: 72,
      timeoutMs: 10_000,
      worker: true,
    });
    demSource.setupMaplibre(maplibre.default);
    return demSource;
  });
}

let demSourcePromise: ReturnType<typeof createDemSource> | null = null;

function getDemSource() {
  demSourcePromise ??= createDemSource();
  return demSourcePromise;
}

function collection(features: GeoJSON.Feature[]): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features };
}

const CITY_LIGHT_OFFSETS = [
  [0, 0, 1, 0],
  [0.012, 0.008, 0.86, 1.7],
  [-0.014, 0.006, 0.74, 3.1],
  [0.009, -0.013, 0.7, 4.6],
  [-0.021, -0.008, 0.58, 5.8],
  [0.025, 0.015, 0.48, 2.4],
  [-0.032, 0.018, 0.42, 4.1],
  [0.031, -0.019, 0.4, 0.9],
  [-0.01, 0.029, 0.36, 5.2],
] as const;

function cityFeatures(now: number): GeoJSON.Feature[] {
  return TACTICAL_CITIES.flatMap((city, cityIndex) => {
    return CITY_LIGHT_OFFSETS.map(([lngOffset, latOffset, weight, phase], offsetIndex) => ({
      type: "Feature" as const,
      properties: {
        id: `${city.id}-${offsetIndex}`,
        intensity: Math.max(
          0.2,
          city.intensity * weight * (0.68 + Math.sin(now / (930 + offsetIndex * 83) + cityIndex * 1.31 + phase) * 0.32),
        ),
      },
      geometry: {
        type: "Point" as const,
        coordinates: [city.coordinates[0] + lngOffset, city.coordinates[1] + latOffset],
      },
    }));
  });
}

function totalPathDistance(path: MotionPath): number {
  let total = 0;
  for (let index = 1; index < path.coordinates.length; index += 1) {
    total += haversineKm(path.coordinates[index - 1], path.coordinates[index]);
  }
  return total;
}

const pathDistances = new Map<string, number>();
function movingPathFeatures(paths: MotionPath[], now: number, kind: string): GeoJSON.Feature[] {
  return paths.flatMap((path, pathIndex) => {
    const total = pathDistances.get(path.id) ?? totalPathDistance(path);
    pathDistances.set(path.id, total);
    const repeat = kind === "road" ? 10 : 2;
    // At circuit scale, literal motorway speeds amount to a fraction of a
    // pixel per minute. Compress elapsed time while preserving the real route
    // so the traffic remains calm but visibly alive.
    const displaySpeed = path.speedKph * (kind === "road" ? 32 : 1);
    return Array.from({ length: repeat }, (_, repeatIndex) => {
      const phase = (path.offset + repeatIndex / repeat + pathIndex * 0.071) % 1;
      const travelled = (now / 3_600_000 * displaySpeed + total * phase) % total;
      return {
        type: "Feature" as const,
        properties: { id: `${path.id}-${repeatIndex}`, kind },
        geometry: { type: "Point" as const, coordinates: pointAlongPath(path.coordinates, travelled) },
      };
    });
  });
}

function livePointPosition(point: LiveTrafficPoint, now: number, kind: TrafficKind): MapCoordinate {
  // AIS positions are map anchors, not an animation layer. Keeping the exact
  // reported coordinate prevents a vessel from drifting or snapping while
  // the user zooms; it only changes when a new AIS sample arrives.
  if (kind === "vessel") return point.coordinates;
  const elapsedHours = Math.max(0, Math.min(0.12, (now - point.updatedAt) / 3_600_000));
  return destinationPoint(point.coordinates, point.heading, point.speedKph * elapsedHours);
}

function liveFeatures(points: LiveTrafficPoint[], now: number, kind: TrafficKind): GeoJSON.Feature[] {
  return points.map((point) => {
    return {
      type: "Feature" as const,
      properties: { id: point.id, label: point.label ?? "", heading: point.heading, kind },
      geometry: {
        type: "Point" as const,
        coordinates: livePointPosition(point, now, kind),
      },
    };
  });
}

function trafficTooltip(kind: TrafficKind, point: LiveTrafficPoint) {
  if (kind === "aircraft") {
    const flightLevel = point.altitudeFt && point.altitudeFt > 0
      ? ` · FL${String(Math.round(point.altitudeFt / 100)).padStart(3, "0")}`
      : "";
    return `Vol ${point.label || point.id.toUpperCase()}${flightLevel}`;
  }
  return point.label ? `Navire ${point.label}` : `Navire · MMSI ${point.id}`;
}

function aircraftVisualAltitude(altitudeFt = 0) {
  const normalized = Math.max(0, Math.min(1, altitudeFt / 42_000));
  return {
    lift: 5 + normalized * 9,
    scale: 0.94 + normalized * 0.18,
    shadowBlur: 0.6 + normalized * 1.5,
    shadowOpacity: 0.5 - normalized * 0.18,
  };
}

function isInPaddedViewport(map: MaplibreMap, [longitude, latitude]: MapCoordinate) {
  const point = map.project([longitude, latitude]);
  const container = map.getContainer();
  const padding = 54;
  return point.x >= -padding
    && point.x <= container.clientWidth + padding
    && point.y >= -padding
    && point.y <= container.clientHeight + padding;
}

function syncTrafficMarkers({
  map,
  points,
  markers,
  kind,
  now,
  createMarker,
}: {
  map: MaplibreMap;
  points: LiveTrafficPoint[];
  markers: Map<string, TrafficMarkerRecord>;
  kind: TrafficKind;
  now: number;
  createMarker: (point: LiveTrafficPoint, kind: TrafficKind) => TrafficMarkerRecord;
}) {
  const visibleIds = new Set<string>();
  const occupiedCells = new Set<string>();
  for (const point of points) {
    const coordinates = livePointPosition(point, now, kind);
    if (!isInPaddedViewport(map, coordinates)) continue;
    if (kind === "aircraft") {
      const screenPoint = map.project(coordinates);
      const cell = `${Math.floor(screenPoint.x / 74)}:${Math.floor(screenPoint.y / 74)}`;
      if (occupiedCells.has(cell)) continue;
      occupiedCells.add(cell);
    }
    visibleIds.add(point.id);
    let record = markers.get(point.id);
    if (!record) {
      record = createMarker(point, kind);
      markers.set(point.id, record);
    }
    const tooltip = trafficTooltip(kind, point);
    const coordinateKey = `${coordinates[0].toFixed(6)}:${coordinates[1].toFixed(6)}`;
    if (kind === "aircraft" || record.element.dataset.coordinate !== coordinateKey) {
      record.marker.setLngLat(coordinates);
      record.element.dataset.coordinate = coordinateKey;
    }
    record.element.style.setProperty("--traffic-heading", `${point.heading + (kind === "aircraft" ? -45 : 0)}deg`);
    if (kind === "aircraft") {
      const altitude = aircraftVisualAltitude(point.altitudeFt);
      record.element.style.setProperty("--aircraft-lift", `${altitude.lift.toFixed(1)}px`);
      record.element.style.setProperty("--aircraft-scale", altitude.scale.toFixed(3));
      record.element.style.setProperty("--aircraft-shadow-blur", `${altitude.shadowBlur.toFixed(1)}px`);
      record.element.style.setProperty("--aircraft-shadow-opacity", altitude.shadowOpacity.toFixed(3));
    }
    record.element.dataset.tooltip = tooltip;
    record.element.setAttribute("aria-label", tooltip);
  }
  for (const [id, record] of markers) {
    if (visibleIds.has(id)) continue;
    record.marker.remove();
    markers.delete(id);
  }
}

function removeTrafficMarkers(markers: Map<string, TrafficMarkerRecord>) {
  for (const record of markers.values()) record.marker.remove();
  markers.clear();
}

function source(map: MaplibreMap, id: string): GeoJSONSource | undefined {
  return map.getSource(id) as GeoJSONSource | undefined;
}

function setLayersVisibility(map: MaplibreMap, visible: boolean, options?: { showAircraft: boolean; showVessels: boolean; showCityLights: boolean }) {
  const groups = [
    [TACTICAL_BASE_LAYERS, visible],
    [TACTICAL_CITY_LAYERS, visible && (options?.showCityLights ?? true)],
    [TACTICAL_VESSEL_LAYERS, visible && (options?.showVessels ?? true)],
    [TACTICAL_AIRCRAFT_LAYERS, visible && (options?.showAircraft ?? true)],
  ] as const;
  for (const [layers, groupVisible] of groups) {
    for (const id of layers) {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", groupVisible ? "visible" : "none");
    }
  }
}

function addGeoJsonSource(map: MaplibreMap, id: string) {
  if (!map.getSource(id)) map.addSource(id, { type: "geojson", data: collection([]) });
}

async function installTacticalLayers(map: MaplibreMap) {
  const beforeId = map.getLayer("season-chronology-depth") ? "season-chronology-depth" : undefined;

  if (!map.getSource("tactical-openmaptiles")) {
    map.addSource("tactical-openmaptiles", { type: "vector", url: OPEN_MAP_TILES });
  }
  if (!map.getLayer("tactical-road-network")) {
    map.addLayer({
      id: "tactical-road-network",
      type: "line",
      source: "tactical-openmaptiles",
      "source-layer": "transportation",
      minzoom: 6,
      filter: ["all", ["match", ["get", "class"], ["motorway", "trunk", "primary"], true, false], ["!=", ["get", "brunnel"], "tunnel"]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#dceef4",
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 6, 0.07, 9, 0.18, 12, 0.26],
        "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.35, 10, 0.75, 13, 1.15],
      },
    }, beforeId);
  }

  if (!map.getSource("tactical-bathymetry")) {
    map.addSource("tactical-bathymetry", {
      type: "raster",
      tiles: [EMODNET_CONTOURS],
      tileSize: 512,
      minzoom: 5,
      maxzoom: 12,
      attribution: "Bathymetry © EMODnet",
    });
  }
  if (!map.getLayer("tactical-bathymetry-contours")) {
    map.addLayer({
      id: "tactical-bathymetry-contours",
      type: "raster",
      source: "tactical-bathymetry",
      paint: {
        "raster-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0.15, 8, 0.34, 11, 0.42],
        "raster-brightness-min": 1,
        "raster-brightness-max": 1,
        "raster-contrast": 0.4,
        "raster-fade-duration": 300,
      },
    }, beforeId);
  }

  const dem = await getDemSource();
  if (!map.getSource("tactical-land-contours-source")) {
    map.addSource("tactical-land-contours-source", {
      type: "vector",
      tiles: [dem.contourProtocolUrl({
        thresholds: { 6: [100, 500], 8: [50, 250], 10: [25, 100], 12: [10, 50] },
        contourLayer: "contours",
        elevationKey: "ele",
        levelKey: "level",
      })],
      maxzoom: 12,
    });
  }
  if (!map.getLayer("tactical-land-contours")) {
    map.addLayer({
      id: "tactical-land-contours",
      type: "line",
      source: "tactical-land-contours-source",
      "source-layer": "contours",
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#f2f7f9",
        "line-opacity": ["match", ["get", "level"], 1, 0.38, 0.19],
        "line-width": ["match", ["get", "level"], 1, 0.95, 0.52],
      },
    }, beforeId);
  }

  for (const id of ["tactical-city-lights", "tactical-vessels", "tactical-aircraft"]) {
    addGeoJsonSource(map, id);
  }

  const pointLayer = (
    id: string,
    sourceId: string,
    color: string,
    radius: number | unknown[],
    opacity: number | unknown[],
    blur: number,
  ) => {
    if (map.getLayer(id)) return;
    map.addLayer({
      id,
      type: "circle",
      source: sourceId,
      paint: {
        "circle-color": color,
        "circle-radius": radius as number,
        "circle-opacity": opacity as number,
        "circle-blur": blur,
        "circle-pitch-alignment": "map",
        "circle-pitch-scale": "map",
      },
    }, beforeId);
  };

  pointLayer("tactical-city-glow", "tactical-city-lights", "#ffd978", ["interpolate", ["linear"], ["zoom"], 6, 5.5, 10, 12], ["*", ["get", "intensity"], 0.52], 0.84);
  pointLayer("tactical-city-core", "tactical-city-lights", "#fff8d6", ["interpolate", ["linear"], ["zoom"], 6, 1.15, 10, 2.1], ["*", ["get", "intensity"], 0.96], 0.08);
  pointLayer("tactical-vessels-glow", "tactical-vessels", "#42d4ff", 7.2, 0.38, 0.78);
  pointLayer("tactical-vessels-core", "tactical-vessels", "#dff8ff", 1.55, 0.94, 0.04);
  pointLayer("tactical-aircraft-glow", "tactical-aircraft", "#bcecff", 6.2, 0.34, 0.8);
  pointLayer("tactical-aircraft-core", "tactical-aircraft", "#ffffff", 1.35, 0.92, 0.03);
}

async function readTraffic(url: string): Promise<{ mode: FeedMode; points: LiveTrafficPoint[] }> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return { mode: "simulated", points: [] };
  const payload = await response.json() as { mode?: FeedMode; aircraft?: LiveTrafficPoint[]; vessels?: LiveTrafficPoint[] };
  return {
    mode: payload.mode === "live" ? "live" : "simulated",
    points: payload.aircraft ?? payload.vessels ?? [],
  };
}

/**
 * Installs all high-cost tactical layers lazily and only on desktop. The race
 * chronology hook is deliberately not a dependency here: its source, layers,
 * timing and animation remain untouched when this mode is toggled.
 */
export function useTacticalMapLayers({
  mapRef,
  isReady,
  enabled,
  showAircraft,
  showVessels,
  showCityLights,
}: {
  mapRef: RefObject<MaplibreMap | null>;
  isReady: boolean;
  enabled: boolean;
  showAircraft: boolean;
  showVessels: boolean;
  showCityLights: boolean;
}) {
  const [status, setStatus] = useState<TacticalFeedStatus>({ aircraft: "idle", vessels: "idle" });
  const liveAircraftRef = useRef<LiveTrafficPoint[]>([]);
  const liveVesselsRef = useRef<LiveTrafficPoint[]>([]);

  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) return;
    if (!enabled) {
      setLayersVisibility(map, false);
      return;
    }

    let cancelled = false;
    let frame = 0;
    let lastRender = 0;
    let lastMarkerRender = 0;
    let trafficTimer = 0;
    let createMarker: ((point: LiveTrafficPoint, kind: TrafficKind) => TrafficMarkerRecord) | null = null;
    const aircraftMarkers = new Map<string, TrafficMarkerRecord>();
    const vesselMarkers = new Map<string, TrafficMarkerRecord>();

    const refreshTraffic = async () => {
      setStatus((current) => ({
        aircraft: showAircraft ? (current.aircraft === "live" ? "live" : "loading") : "idle",
        vessels: showVessels ? (current.vessels === "live" ? "live" : "loading") : "idle",
      }));
      const [aircraft, vessels] = await Promise.all([
        showAircraft ? readTraffic("/api/map-traffic/aircraft") : Promise.resolve({ mode: "idle" as const, points: [] }),
        showVessels ? readTraffic("/api/map-traffic/vessels") : Promise.resolve({ mode: "idle" as const, points: [] }),
      ]);
      if (cancelled) return;
      liveAircraftRef.current = aircraft.points;
      liveVesselsRef.current = vessels.points;
      setStatus({ aircraft: aircraft.mode, vessels: vessels.mode });
    };

    const animate = (now: number) => {
      frame = requestAnimationFrame(animate);
      if (now - lastRender < 100) return;
      lastRender = now;
      source(map, "tactical-city-lights")?.setData(collection(showCityLights ? cityFeatures(now) : []));
      const vesselFeatures = !showVessels ? [] : liveVesselsRef.current.length > 0
        ? liveFeatures(liveVesselsRef.current, Date.now(), "vessel")
        : movingPathFeatures(SHIPPING_LANES, Date.now(), "vessel");
      const aircraftFeatures = !showAircraft ? [] : liveAircraftRef.current.length > 0
        ? liveFeatures(liveAircraftRef.current, Date.now(), "aircraft")
        : movingPathFeatures(FALLBACK_AIR_ROUTES, Date.now(), "aircraft");
      source(map, "tactical-vessels")?.setData(collection(vesselFeatures));
      source(map, "tactical-aircraft")?.setData(collection(aircraftFeatures));
      if (createMarker && now - lastMarkerRender >= 250) {
        lastMarkerRender = now;
        syncTrafficMarkers({ map, points: showAircraft ? liveAircraftRef.current : [], markers: aircraftMarkers, kind: "aircraft", now: Date.now(), createMarker });
        syncTrafficMarkers({ map, points: showVessels ? liveVesselsRef.current : [], markers: vesselMarkers, kind: "vessel", now: Date.now(), createMarker });
      }
    };

    void Promise.all([installTacticalLayers(map), import("maplibre-gl")]).then(([, { default: maplibregl }]) => {
      if (cancelled) return;
      createMarker = (point, kind) => {
        const element = document.createElement("div");
        element.className = `tactical-traffic-marker tactical-traffic-marker--${kind}`;
        element.dataset.trafficId = point.id;
        element.dataset.tooltip = trafficTooltip(kind, point);
        element.setAttribute("role", "img");
        element.setAttribute("aria-label", trafficTooltip(kind, point));
        element.tabIndex = 0;
        const icon = document.createElement("img");
        icon.className = "tactical-traffic-marker__icon";
        icon.src = kind === "aircraft" ? "/icons/tactical-plane.svg" : "/icons/tactical-ship.svg";
        icon.alt = "";
        icon.setAttribute("aria-hidden", "true");
        icon.draggable = false;
        if (kind === "aircraft") {
          const shadow = icon.cloneNode() as HTMLImageElement;
          shadow.className = "tactical-aircraft-shadow";
          element.append(shadow);
        }
        element.append(icon);
        const marker = new maplibregl.Marker({
          element,
          anchor: "center",
          offset: [0, 0],
        })
          .setLngLat(point.coordinates)
          .addTo(map);
        return { marker, element, icon };
      };
      setLayersVisibility(map, true, { showAircraft, showVessels, showCityLights });
      frame = requestAnimationFrame(animate);
      void refreshTraffic();
      trafficTimer = window.setInterval(refreshTraffic, 5 * 60_000);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.clearInterval(trafficTimer);
      removeTrafficMarkers(aircraftMarkers);
      removeTrafficMarkers(vesselMarkers);
    };
  }, [enabled, isReady, mapRef, showAircraft, showCityLights, showVessels]);

  return status;
}
