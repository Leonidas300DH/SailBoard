"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { Map as MaplibreMap, MapLibreEvent } from "maplibre-gl";
import { prefersReducedMotion } from "./useMapLibre";

export type CameraTarget = {
  center: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
};

export type CameraOrientation = {
  pitch?: number;
  bearing?: number;
};

/**
 * Cinematic camera pilot. Programmatic moves use flyTo with pitch/bearing;
 * as soon as the user drags (movestart with an originalEvent), the director
 * stops recentering until the next explicit target — no camera fights.
 */
export function useCameraDirector(mapRef: RefObject<MaplibreMap | null>, isReady: boolean) {
  const userDroveRef = useRef(false);

  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) return;
    const onMoveStart = (event: MapLibreEvent<MouseEvent | TouchEvent | WheelEvent | undefined>) => {
      if (event.originalEvent) userDroveRef.current = true;
    };
    map.on("movestart", onMoveStart);
    return () => {
      map.off("movestart", onMoveStart);
    };
  }, [isReady, mapRef]);

  const flyToTarget = useCallback((target: CameraTarget) => {
    const map = mapRef.current;
    if (!map) return;
    userDroveRef.current = false;
    map.stop();
    const camera = {
      center: target.center,
      zoom: target.zoom ?? 11.5,
      pitch: target.pitch ?? 0,
      bearing: target.bearing ?? 0,
    };
    if (prefersReducedMotion()) {
      map.jumpTo(camera);
      return;
    }
    map.flyTo({ ...camera, duration: 2200, curve: 1.35, essential: true });
  }, [mapRef]);

  const flyToBounds = useCallback((
    bounds: [[number, number], [number, number]],
    padding: number | { top: number; right: number; bottom: number; left: number },
    maxZoom?: number,
    orientation: CameraOrientation = {},
  ) => {
    const map = mapRef.current;
    if (!map) return;
    userDroveRef.current = false;
    map.stop();
    const camera = map.cameraForBounds(bounds, { padding, maxZoom });
    if (!camera) return;
    if (prefersReducedMotion()) {
      map.jumpTo({ ...camera, pitch: orientation.pitch ?? 0, bearing: orientation.bearing ?? 0 });
      return;
    }
    map.easeTo({
      ...camera,
      pitch: orientation.pitch ?? 0,
      bearing: orientation.bearing ?? 0,
      duration: 1100,
      essential: true,
    });
  }, [mapRef]);

  return { flyToTarget, flyToBounds, userDroveRef };
}
