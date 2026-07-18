"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { Map as MaplibreMap } from "maplibre-gl";
import { buildIgnStyle, type IgnStylePreset } from "@/lib/map/style";

export type MapLibreOptions = {
  preset: IgnStylePreset;
  center: [number, number];
  zoom: number;
  pitch?: number;
  bearing?: number;
  minZoom?: number;
  maxPitch?: number;
  interactive?: boolean;
  onLoad?: (map: MaplibreMap) => void;
};

// MapLibre's style loader waits on requestAnimationFrame, which browsers
// suspend in hidden tabs — in dev (incl. headless verification) fall back to a
// timer so the map still boots in a background tab. Must run before the
// maplibre module is evaluated, because it captures rAF at module scope.
let rafShimInstalled = false;
export function installBackgroundRafShim() {
  if (rafShimInstalled || process.env.NODE_ENV === "production" || typeof window === "undefined") return;
  rafShimInstalled = true;
  const nativeRaf = window.requestAnimationFrame.bind(window);
  const nativeCancel = window.cancelAnimationFrame.bind(window);
  const timerIds = new Set<number>();
  window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
    if (document.visibilityState === "visible") return nativeRaf(callback);
    const id = window.setTimeout(() => {
      timerIds.delete(id);
      callback(performance.now());
    }, 33);
    timerIds.add(id);
    return id;
  };
  window.cancelAnimationFrame = (id: number) => {
    if (timerIds.delete(id)) window.clearTimeout(id);
    else nativeCancel(id);
  };
}

/**
 * Boots a MapLibre map once (dynamic import, controls, cleanup) and reports
 * readiness so downstream effects can wait for layers to be addable.
 * The options object is read once at creation, except onLoad which stays live.
 */
export function useMapLibre(containerRef: RefObject<HTMLDivElement | null>, options: MapLibreOptions) {
  const mapRef = useRef<MaplibreMap | null>(null);
  const [isReady, setIsReady] = useState(false);
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    installBackgroundRafShim();
    void import("maplibre-gl").then(({ default: maplibregl }) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const initial = optionsRef.current;
      const map = new maplibregl.Map({
        container: containerRef.current,
        center: initial.center,
        zoom: initial.zoom,
        pitch: initial.pitch ?? 0,
        bearing: initial.bearing ?? 0,
        minZoom: initial.minZoom,
        maxPitch: initial.maxPitch ?? 60,
        attributionControl: false,
        interactive: initial.interactive ?? true,
        style: buildIgnStyle(initial.preset),
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-left");
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
      map.on("load", () => {
        if (cancelled) return;
        // Catch up on any layout that settled while the style was loading —
        // hidden tabs don't deliver ResizeObserver callbacks.
        map.resize();
        optionsRef.current.onLoad?.(map);
        setIsReady(true);
      });
      if (process.env.NODE_ENV !== "production") {
        // Hidden tabs never fire ResizeObserver: poll for container/canvas
        // drift so dev verification in a background tab stays accurate.
        const resizeWatch = window.setInterval(() => {
          const container = containerRef.current;
          const canvas = map.getCanvas();
          if (!container) return;
          if (canvas.clientWidth !== container.clientWidth || canvas.clientHeight !== container.clientHeight) {
            map.resize();
          }
        }, 600);
        map.once("remove", () => window.clearInterval(resizeWatch));
      }
    });
    return () => {
      cancelled = true;
      setIsReady(false);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [containerRef]);

  return { mapRef, isReady };
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
