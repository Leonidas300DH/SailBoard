"use client";

import { useEffect, type RefObject } from "react";
import type { GeoJSONSource, Map as MaplibreMap } from "maplibre-gl";
import { prefersReducedMotion } from "./useMapLibre";

const OFF = "rgba(72, 185, 230, 0)";
const BLUE_GLINT = "rgba(117, 216, 255, 0.72)";

function smootherStep(progress: number) {
  return progress * progress * progress * (progress * (progress * 6 - 15) + 10);
}

export function chronologyGlintExpression(progress: number): unknown[] {
  const position = Math.min(0.998, Math.max(0.002, progress));
  const tail = Math.max(0.001, position - 0.085);
  const head = Math.min(0.999, position + 0.018);
  return [
    "interpolate", ["linear"], ["line-progress"],
    0, OFF,
    tail, OFF,
    position, BLUE_GLINT,
    head, OFF,
    1, OFF,
  ];
}

/**
 * A restrained blue glint travels stage 1 → 2, pauses, then continues 2 → 3.
 * Only the active leg is uploaded; each frame changes one small paint
 * expression, keeping the motion smooth without React render work.
 */
export function useSeasonChronologyAnimation({
  mapRef,
  isReady,
  legs,
  sourceId = "season-flow",
  layerId = "season-flow-glint",
  legDurationMs = 9_000,
}: {
  mapRef: RefObject<MaplibreMap | null>;
  isReady: boolean;
  legs: GeoJSON.Position[][];
  sourceId?: string;
  layerId?: string;
  legDurationMs?: number;
}) {
  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource(sourceId) as GeoJSONSource | undefined;
    if (!isReady || !map || !source || legs.length === 0 || prefersReducedMotion()) return;

    let frame = 0;
    let startedAt: number | null = null;
    let currentLeg = -1;
    const cycleDuration = legs.length * legDurationMs;

    const tick = (now: number) => {
      // A browser may deliver the current frame's timestamp just before an
      // effect's performance.now() reading. Anchoring on the first callback
      // keeps the initial leg index at zero in every rendering mode.
      startedAt ??= now;
      const cycleTime = (now - startedAt) % cycleDuration;
      const legIndex = Math.min(legs.length - 1, Math.floor(cycleTime / legDurationMs));
      const legTime = (cycleTime % legDurationMs) / legDurationMs;
      // A short, calm hold at the destination separates each stage.
      const progress = smootherStep(Math.min(1, legTime / 0.9));
      if (currentLeg !== legIndex) {
        source.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: legs[legIndex] },
        });
        currentLeg = legIndex;
      }
      if (map.getLayer(layerId)) {
        map.setPaintProperty(layerId, "line-gradient", chronologyGlintExpression(progress), { validate: false });
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      source.setData({ type: "FeatureCollection", features: [] });
    };
  }, [isReady, layerId, legDurationMs, legs, mapRef, sourceId]);
}
