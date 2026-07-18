"use client";

import { useEffect, type RefObject } from "react";
import type { Map as MaplibreMap } from "maplibre-gl";
import {
  MAX_TERRAIN_ZOOM,
  TERRAIN_SOURCE_ID,
  terrainExaggerationForStage,
} from "@/lib/map/terrain";

/**
 * Keeps terrain where it improves geographic reading, then switches back to
 * the complete flat IGN raster for close inspection of a harbour or coastline.
 */
export function useAdaptiveTerrain(
  mapRef: RefObject<MaplibreMap | null>,
  isReady: boolean,
  stageId?: string,
) {
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map?.getSource(TERRAIN_SOURCE_ID)) return;
    const exaggeration = terrainExaggerationForStage(stageId);

    const syncTerrain = () => {
      const terrain = map.getTerrain();
      if (map.getZoom() > MAX_TERRAIN_ZOOM) {
        if (terrain) map.setTerrain(null);
        return;
      }
      if (!terrain || terrain.exaggeration !== exaggeration) {
        map.setTerrain({ source: TERRAIN_SOURCE_ID, exaggeration });
      }
    };

    syncTerrain();
    map.on("zoom", syncTerrain);
    return () => {
      map.off("zoom", syncTerrain);
    };
  }, [isReady, mapRef, stageId]);
}
