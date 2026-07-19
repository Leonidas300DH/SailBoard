"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { GeoJSONSource, Map as MaplibreMap } from "maplibre-gl";
import {
  destinationPoint,
  FALLBACK_AIR_ROUTES,
  haversineKm,
  pointAlongPath,
  ROAD_MOTION_PATHS,
  SHIPPING_LANES,
  TACTICAL_CITIES,
  type LiveTrafficPoint,
  type MapCoordinate,
  type MotionPath,
} from "@/lib/map/tactical-data";

const OPEN_MAP_TILES = "https://tiles.openfreemap.org/planet";
const EMODNET_CONTOURS = "https://ows.emodnet-bathymetry.eu/wms?service=WMS&request=GetMap&version=1.1.1&layers=emodnet:contours&styles=&format=image/png&transparent=true&width=512&height=512&srs=EPSG:3857&bbox={bbox-epsg-3857}";
const TERRARIUM_DEM = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

const TACTICAL_LAYERS = [
  "tactical-bathymetry-contours",
  "tactical-land-contours",
  "tactical-road-network",
  "tactical-city-glow",
  "tactical-city-core",
  "tactical-road-traffic-glow",
  "tactical-road-traffic-core",
  "tactical-vessels-glow",
  "tactical-vessels-core",
  "tactical-aircraft-glow",
  "tactical-aircraft-core",
] as const;

type FeedMode = "idle" | "loading" | "live" | "simulated";

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

function cityFeatures(now: number): GeoJSON.Feature[] {
  return TACTICAL_CITIES.flatMap((city, cityIndex) => {
    const pulse = 0.48 + Math.sin(now / 1_900 + cityIndex * 1.73) * 0.22;
    const offsets: MapCoordinate[] = [[0, 0], [0.035, 0.018], [-0.025, 0.013], [0.017, -0.021]];
    return offsets.map(([lngOffset, latOffset], offsetIndex) => ({
      type: "Feature" as const,
      properties: {
        id: `${city.id}-${offsetIndex}`,
        intensity: Math.max(0.18, city.intensity * pulse * (offsetIndex === 0 ? 1 : 0.46)),
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
    const repeat = kind === "road" ? 3 : 2;
    return Array.from({ length: repeat }, (_, repeatIndex) => {
      const phase = (path.offset + repeatIndex / repeat + pathIndex * 0.071) % 1;
      const travelled = (now / 3_600_000 * path.speedKph + total * phase) % total;
      return {
        type: "Feature" as const,
        properties: { id: `${path.id}-${repeatIndex}`, kind },
        geometry: { type: "Point" as const, coordinates: pointAlongPath(path.coordinates, travelled) },
      };
    });
  });
}

function liveFeatures(points: LiveTrafficPoint[], now: number, kind: string): GeoJSON.Feature[] {
  return points.map((point) => {
    const elapsedHours = Math.max(0, Math.min(0.12, (now - point.updatedAt) / 3_600_000));
    return {
      type: "Feature" as const,
      properties: { id: point.id, label: point.label ?? "", heading: point.heading, kind },
      geometry: {
        type: "Point" as const,
        coordinates: destinationPoint(point.coordinates, point.heading, point.speedKph * elapsedHours),
      },
    };
  });
}

function source(map: MaplibreMap, id: string): GeoJSONSource | undefined {
  return map.getSource(id) as GeoJSONSource | undefined;
}

function setLayersVisibility(map: MaplibreMap, visible: boolean) {
  for (const id of TACTICAL_LAYERS) {
    if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
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

  for (const id of ["tactical-city-lights", "tactical-road-traffic", "tactical-vessels", "tactical-aircraft"]) {
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

  pointLayer("tactical-city-glow", "tactical-city-lights", "#fff4c6", ["interpolate", ["linear"], ["zoom"], 6, 4, 10, 10], ["*", ["get", "intensity"], 0.34], 0.9);
  pointLayer("tactical-city-core", "tactical-city-lights", "#fffdf1", ["interpolate", ["linear"], ["zoom"], 6, 0.7, 10, 1.4], ["*", ["get", "intensity"], 0.8], 0.18);
  pointLayer("tactical-road-traffic-glow", "tactical-road-traffic", "#fff4c6", 3.2, 0.23, 0.86);
  pointLayer("tactical-road-traffic-core", "tactical-road-traffic", "#fffbea", 0.85, 0.74, 0.08);
  pointLayer("tactical-vessels-glow", "tactical-vessels", "#5ad8ff", 4.2, 0.24, 0.82);
  pointLayer("tactical-vessels-core", "tactical-vessels", "#dff8ff", 1.15, 0.82, 0.08);
  pointLayer("tactical-aircraft-glow", "tactical-aircraft", "#f2f7f9", 3.5, 0.2, 0.88);
  pointLayer("tactical-aircraft-core", "tactical-aircraft", "#ffffff", 0.9, 0.76, 0.06);
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
}: {
  mapRef: RefObject<MaplibreMap | null>;
  isReady: boolean;
  enabled: boolean;
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
    let trafficTimer = 0;

    const refreshTraffic = async () => {
      setStatus((current) => ({
        aircraft: current.aircraft === "live" ? "live" : "loading",
        vessels: current.vessels === "live" ? "live" : "loading",
      }));
      const [aircraft, vessels] = await Promise.all([
        readTraffic("/api/map-traffic/aircraft"),
        readTraffic("/api/map-traffic/vessels"),
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
      source(map, "tactical-city-lights")?.setData(collection(cityFeatures(now)));
      source(map, "tactical-road-traffic")?.setData(collection(movingPathFeatures(ROAD_MOTION_PATHS, Date.now(), "road")));
      const vesselFeatures = liveVesselsRef.current.length > 0
        ? liveFeatures(liveVesselsRef.current, Date.now(), "vessel")
        : movingPathFeatures(SHIPPING_LANES, Date.now(), "vessel");
      const aircraftFeatures = liveAircraftRef.current.length > 0
        ? liveFeatures(liveAircraftRef.current, Date.now(), "aircraft")
        : movingPathFeatures(FALLBACK_AIR_ROUTES, Date.now(), "aircraft");
      source(map, "tactical-vessels")?.setData(collection(vesselFeatures));
      source(map, "tactical-aircraft")?.setData(collection(aircraftFeatures));
    };

    void installTacticalLayers(map).then(() => {
      if (cancelled) return;
      setLayersVisibility(map, true);
      frame = requestAnimationFrame(animate);
      void refreshTraffic();
      trafficTimer = window.setInterval(refreshTraffic, 5 * 60_000);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.clearInterval(trafficTimer);
    };
  }, [enabled, isReady, mapRef]);

  return status;
}
