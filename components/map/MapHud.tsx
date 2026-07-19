"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { Map as MaplibreMap } from "maplibre-gl";
import { Crosshair } from "lucide-react";
import { formatDMS } from "@/lib/map/geo";
import { graticuleStep } from "@/lib/map/graticule";
import { DecodeText } from "./DecodeText";

type EdgeLabel = { key: string; label: string; offset: number };

/**
 * Tactical overlay rendered in DOM (native typography, no glyph server):
 * graticule edge labels, a reticle locked on the selected target, and the
 * live center coordinates readout.
 */
export function MapHud({
  mapRef,
  isReady,
  target,
  targetOffset,
  targetLabel,
  onRecenter,
}: {
  mapRef: RefObject<MaplibreMap | null>;
  isReady: boolean;
  target?: [number, number];
  targetOffset?: readonly [number, number];
  targetLabel?: string;
  onRecenter?: () => void;
}) {
  const [latLabels, setLatLabels] = useState<EdgeLabel[]>([]);
  const [lngLabels, setLngLabels] = useState<EdgeLabel[]>([]);
  const [readout, setReadout] = useState<{ lat: string; lng: string } | null>(null);
  const [reticle, setReticle] = useState<{ x: number; y: number } | null>(null);
  const targetRef = useRef(target);
  const targetOffsetRef = useRef(targetOffset);
  useEffect(() => {
    targetRef.current = target;
    targetOffsetRef.current = targetOffset;
  }, [target, targetOffset]);

  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map) return;

    let frame = 0;
    const sync = () => {
      frame = 0;
      const center = map.getCenter();
      setReadout(formatDMS(center.lng, center.lat));

      const point = targetRef.current;
      if (point) {
        const projected = map.project(point);
        const [offsetX, offsetY] = targetOffsetRef.current ?? [0, 0];
        const visualTarget = { x: projected.x + offsetX, y: projected.y + offsetY };
        const { clientWidth, clientHeight } = map.getContainer();
        const inView = visualTarget.x >= 0 && visualTarget.x <= clientWidth && visualTarget.y >= 0 && visualTarget.y <= clientHeight;
        setReticle(inView ? visualTarget : null);
      } else {
        setReticle(null);
      }

      const bounds = map.getBounds();
      const step = graticuleStep(map.getZoom());
      const nextLat: EdgeLabel[] = [];
      const nextLng: EdgeLabel[] = [];
      for (let lat = Math.ceil(bounds.getSouth() / step) * step; lat <= bounds.getNorth(); lat += step) {
        const y = map.project([center.lng, lat]).y;
        const dms = formatDMS(center.lng, lat);
        nextLat.push({ key: `lat-${lat.toFixed(3)}`, label: dms.lat, offset: y });
      }
      for (let lng = Math.ceil(bounds.getWest() / step) * step; lng <= bounds.getEast(); lng += step) {
        const x = map.project([lng, center.lat]).x;
        const dms = formatDMS(lng, center.lat);
        nextLng.push({ key: `lng-${lng.toFixed(3)}`, label: dms.lng, offset: x });
      }
      setLatLabels(nextLat);
      setLngLabels(nextLng);
    };

    const requestSync = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };
    requestSync();
    map.on("move", requestSync);
    map.on("resize", requestSync);
    return () => {
      map.off("move", requestSync);
      map.off("resize", requestSync);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [isReady, mapRef, target]);

  const targetDms = target ? formatDMS(target[0], target[1]) : null;

  return <>
    <div className="map-hud" aria-hidden>
      {latLabels.map(({ key, label, offset }) => (
        <span key={key} className="hud-edge-label hud-edge-label--lat mono" style={{ top: offset }}>{label}</span>
      ))}
      {lngLabels.map(({ key, label, offset }) => (
        <span key={key} className="hud-edge-label hud-edge-label--lng mono" style={{ left: offset }}>{label}</span>
      ))}
      {reticle ? (
        <div className="hud-reticle" style={{ transform: `translate(${reticle.x}px, ${reticle.y}px)` }}>
          <svg viewBox="0 0 64 64" width="64" height="64">
            <circle cx="32" cy="32" r="21" fill="none" stroke="currentColor" strokeWidth="1" opacity=".85" />
            <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth=".6" opacity=".3" />
            <path d="M32 0v14M32 50v14M0 32h14M50 32h14" stroke="currentColor" strokeWidth="1" />
          </svg>
          {targetLabel && targetDms ? (
            <span className="hud-reticle-tag mono"><DecodeText text={targetLabel} speed={14} delay={120} /> · {targetDms.lat} {targetDms.lng}</span>
          ) : null}
        </div>
      ) : null}
      {readout ? (
        <div className="hud-readout mono">
          <span>{readout.lat}</span>
          <span>{readout.lng}</span>
        </div>
      ) : null}
    </div>
    {onRecenter ? (
      <button type="button" className="hud-recenter" onClick={onRecenter} aria-label="Recentrer la carte">
        <Crosshair aria-hidden />
        <span>Recentrer</span>
      </button>
    ) : null}
  </>;
}
