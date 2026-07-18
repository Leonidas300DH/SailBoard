"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import type { GeoJSONSource, Map as MaplibreMap } from "maplibre-gl";
import { cumulativeDistances, pointAtProgress } from "@/lib/map/geo";
import { prefersReducedMotion } from "./useMapLibre";

const HEAD = "#ffffff";
const TRAIL = "rgba(232, 255, 41, 0.9)";
const WAKE = "rgba(232, 255, 41, 0.22)";
const OFF = "rgba(0, 0, 0, 0)";

/**
 * Broadcast-style comet gradient: faint wake over the covered portion, hot
 * head at `progress`, nothing beyond. Stops are kept strictly increasing —
 * MapLibre rejects unsorted interpolate expressions.
 */
export function cometExpression(progress: number): unknown[] {
  const p = Math.min(0.999, Math.max(0.002, progress));
  const tail = Math.max(0.001, p - 0.1);
  const stops: Array<[number, string]> = [
    [0, WAKE],
    [tail, TRAIL],
    [p, HEAD],
    [Math.min(0.9995, p + 0.0005), OFF],
  ];
  const expression: unknown[] = ["interpolate", ["linear"], ["line-progress"]];
  let previous = -1;
  for (const [stop, color] of stops) {
    if (stop <= previous) continue;
    previous = stop;
    expression.push(stop, color);
  }
  return expression;
}

export function fullTrackExpression(): unknown[] {
  return ["interpolate", ["linear"], ["line-progress"], 0, TRAIL, 1, TRAIL];
}

/**
 * Time-based rAF loop driving a line-gradient layer and a boat point source.
 * Geometry is uploaded once by the caller; each frame only regenerates the
 * gradient (constant cost) and moves one point. Under reduced motion the
 * route is shown complete and static instead.
 */
export function useRouteAnimation({
  mapRef,
  isReady,
  coordinates,
  playing,
  durationMs = 14_000,
  gradientLayerId,
  boatSourceId,
  onProgress,
}: {
  mapRef: RefObject<MaplibreMap | null>;
  isReady: boolean;
  coordinates: GeoJSON.Position[];
  playing: boolean;
  durationMs?: number;
  gradientLayerId: string;
  boatSourceId?: string;
  onProgress?: (progress: number) => void;
}) {
  const progressRef = useRef(0.72);
  const distances = useMemo(() => cumulativeDistances(coordinates), [coordinates]);
  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map || coordinates.length < 2) return;

    const apply = (progress: number) => {
      if (map.getLayer(gradientLayerId)) {
        map.setPaintProperty(gradientLayerId, "line-gradient", cometExpression(progress), { validate: false });
      }
      if (boatSourceId) {
        const source = map.getSource(boatSourceId) as GeoJSONSource | undefined;
        source?.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: pointAtProgress(coordinates, progress, distances) },
        });
      }
      onProgressRef.current?.(progress);
    };

    if (prefersReducedMotion()) {
      if (map.getLayer(gradientLayerId)) {
        map.setPaintProperty(gradientLayerId, "line-gradient", fullTrackExpression(), { validate: false });
      }
      onProgressRef.current?.(1);
      return;
    }

    if (!playing) {
      apply(progressRef.current);
      return;
    }

    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      // Background tabs stop rAF; clamp the catch-up delta on return.
      const delta = Math.min(now - previous, 120);
      previous = now;
      progressRef.current = (progressRef.current + delta / durationMs) % 1;
      apply(progressRef.current);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [boatSourceId, coordinates, distances, durationMs, gradientLayerId, isReady, mapRef, playing]);

  return progressRef;
}
