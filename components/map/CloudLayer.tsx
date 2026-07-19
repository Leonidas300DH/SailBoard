"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { Map as MaplibreMap } from "maplibre-gl";
import { prefersReducedMotion } from "./useMapLibre";

const TILE = 640;
const ATLANTIC_ANCHOR: [number, number] = [-3.05, 48.05];

type CloudSheet = {
  scale: number;
  speed: number;
  alpha: number;
  headingOffset: number;
  altitude: number;
  parallax: number;
  x: number;
  y: number;
};

type CloudTextureSet = {
  vapor: HTMLCanvasElement;
  shadow: HTMLCanvasElement;
  core: HTMLCanvasElement;
};

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * The atmosphere belongs to the wide-area circuit view. It fades almost
 * completely once the camera moves into race-scale detail so coastline,
 * marks and labels become progressively clearer as the user zooms in.
 */
export function atmosphereVisibilityAtZoom(zoom: number) {
  const detailProgress = smoothstep(6.4, 10.8, zoom);
  const minimumVisibility = 0.04;
  return minimumVisibility + (1 - detailProgress) * (1 - minimumVisibility);
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/**
 * Deterministic, tileable cloud field. The low-frequency domain warp bends
 * the fractal sampling coordinates into broad Atlantic cloud banks rather
 * than a repeated blurred-noise texture. Determinism prevents the sky from
 * changing whenever React remounts the map.
 */
function buildCloudTile(seed: number): CloudTextureSet {
  const makeCanvas = () => {
    const canvas = document.createElement("canvas");
    canvas.width = TILE;
    canvas.height = TILE;
    return canvas;
  };
  const vapor = makeCanvas();
  const shadow = makeCanvas();
  const core = makeCanvas();
  const vaporContext = vapor.getContext("2d");
  const shadowContext = shadow.getContext("2d");
  const coreContext = core.getContext("2d");
  if (!vaporContext || !shadowContext || !coreContext) return { vapor, shadow, core };
  const vaporImage = vaporContext.createImageData(TILE, TILE);
  const shadowImage = shadowContext.createImageData(TILE, TILE);
  const coreImage = coreContext.createImageData(TILE, TILE);
  const random = seededRandom(seed);

  const makeGrid = (cells: number) => {
    const grid = new Float32Array(cells * cells);
    for (let index = 0; index < grid.length; index += 1) grid[index] = random();
    return grid;
  };
  const sample = (grid: Float32Array, cells: number, u: number, v: number) => {
    const x = ((u % 1) + 1) % 1 * cells;
    const y = ((v % 1) + 1) % 1 * cells;
    const x0 = Math.floor(x) % cells;
    const y0 = Math.floor(y) % cells;
    const x1 = (x0 + 1) % cells;
    const y1 = (y0 + 1) % cells;
    const fx = x - Math.floor(x);
    const fy = y - Math.floor(y);
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = grid[y0 * cells + x0];
    const b = grid[y0 * cells + x1];
    const c = grid[y1 * cells + x0];
    const d = grid[y1 * cells + x1];
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };

  const octaves = [
    { cells: 3, amp: 0.44, grid: makeGrid(3) },
    { cells: 6, amp: 0.26, grid: makeGrid(6) },
    { cells: 12, amp: 0.16, grid: makeGrid(12) },
    { cells: 24, amp: 0.09, grid: makeGrid(24) },
    { cells: 48, amp: 0.05, grid: makeGrid(48) },
  ];
  const warpU = makeGrid(4);
  const warpV = makeGrid(4);

  for (let y = 0; y < TILE; y += 1) {
    for (let x = 0; x < TILE; x += 1) {
      const u = x / TILE;
      const v = y / TILE;
      const wu = u + (sample(warpU, 4, u, v) - 0.5) * 0.3;
      const wv = v + (sample(warpV, 4, u, v) - 0.5) * 0.3;
      let noise = 0;
      for (const { cells, amp, grid } of octaves) noise += sample(grid, cells, wu, wv) * amp;

      const density = smoothstep(0.43, 0.75, noise);
      const core = density ** 1.3;
      const offset = (y * TILE + x) * 4;
      const brightCore = smoothstep(0.62, 0.9, noise) ** 1.45;
      vaporImage.data[offset] = Math.round(202 + core * 46);
      vaporImage.data[offset + 1] = Math.round(220 + core * 31);
      vaporImage.data[offset + 2] = Math.round(233 + core * 21);
      vaporImage.data[offset + 3] = Math.round(core * 238);
      shadowImage.data[offset] = 1;
      shadowImage.data[offset + 1] = 10;
      shadowImage.data[offset + 2] = 17;
      shadowImage.data[offset + 3] = Math.round(core * 178);
      coreImage.data[offset] = 239;
      coreImage.data[offset + 1] = 248;
      coreImage.data[offset + 2] = 252;
      coreImage.data[offset + 3] = Math.round(brightCore * 190);
    }
  }
  vaporContext.putImageData(vaporImage, 0, 0);
  shadowContext.putImageData(shadowImage, 0, 0);
  coreContext.putImageData(coreImage, 0, 0);
  return { vapor, shadow, core };
}

function buildSheets(compact: boolean, tactical: boolean): CloudSheet[] {
  if (compact) {
    return [
      { scale: 2.5, speed: 0.52, alpha: 0.66, headingOffset: -5, altitude: 0.35, parallax: 0.74, x: 0, y: 0 },
      { scale: 1.7, speed: 0.92, alpha: 0.84, headingOffset: 7, altitude: 0.7, parallax: 0.58, x: 310, y: 140 },
    ];
  }
  const sheets: CloudSheet[] = [
    { scale: 3.2, speed: 0.38, alpha: 0.56, headingOffset: -9, altitude: 0.18, parallax: 0.86, x: 0, y: 0 },
    { scale: 2.25, speed: 0.68, alpha: 0.72, headingOffset: 2, altitude: 0.5, parallax: 0.7, x: 330, y: 170 },
    { scale: 1.55, speed: 1, alpha: 0.86, headingOffset: 11, altitude: 0.86, parallax: 0.52, x: 580, y: 410 },
  ];
  if (tactical) sheets.push(
    { scale: 4.4, speed: 0.24, alpha: 0.34, headingOffset: -15, altitude: 0.08, parallax: 0.94, x: 760, y: 260 },
  );
  return sheets;
}

/**
 * Multi-deck atmosphere inspired by Dropfleet's procedural cloud canvas.
 * Each deck has its own altitude and camera parallax. Map pitch compresses
 * the decks toward the horizon while altitude separates them vertically;
 * bearing and pan keep the texture anchored to the chart instead of the UI.
 */
export function CloudLayer({
  windDirection,
  windKnots,
  mapRef,
  isReady = true,
  tactical = false,
}: {
  windDirection: number;
  windKnots: number;
  mapRef?: RefObject<MaplibreMap | null>;
  isReady?: boolean;
  tactical?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const windRef = useRef({ direction: windDirection, knots: windKnots });

  useEffect(() => {
    windRef.current = { direction: windDirection, knots: windKnots };
  }, [windDirection, windKnots]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const map = mapRef?.current ?? null;
    if (!canvas || !context || (mapRef && (!map || !isReady))) return;

    const tile = buildCloudTile(2026);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const compact = (map?.getContainer().clientWidth ?? canvas.parentElement?.clientWidth ?? window.innerWidth) < 760;
    const sheets = buildSheets(compact, tactical);
    const reduceMotion = prefersReducedMotion();
    let width = 0;
    let height = 0;
    let frame = 0;
    let previous = performance.now();
    let lastDraw = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    const drawSheet = (sheet: CloudSheet, baseAlpha: number) => {
      const pitch = map?.getPitch() ?? 0;
      const zoom = map?.getZoom() ?? 7;
      const pitchRadians = pitch * Math.PI / 180;
      const bearingRadians = (map?.getBearing() ?? 0) * Math.PI / 180;
      const anchor = map?.project(ATLANTIC_ANCHOR) ?? { x: 0, y: 0 };
      const zoomScale = Math.min(1.5, Math.max(0.82, 2 ** ((zoom - 7) * 0.055)));
      const zoomVisibility = atmosphereVisibilityAtZoom(zoom);
      const size = TILE * sheet.scale * zoomScale;
      const horizonCompression = Math.max(0.55, 1 - pitch / 108);
      const altitudeLift = -Math.sin(pitchRadians) * sheet.altitude * Math.min(height * 0.18, 150);
      const originX = sheet.x + anchor.x * sheet.parallax;
      const originY = sheet.y + anchor.y * sheet.parallax;
      const overscan = Math.hypot(width, height) * 0.72 + size;

      context.save();
      context.translate(width / 2, height / 2 + altitudeLift);
      context.rotate(-bearingRadians);
      context.scale(1, horizonCompression);
      context.translate(-width / 2, -height / 2);
      const sheetAlpha = baseAlpha * zoomVisibility * sheet.alpha * (1 + Math.sin(pitchRadians) * 0.2);

      const startX = -overscan - ((originX % size) + size) % size;
      const startY = -overscan - ((originY % size) + size) % size;
      const endX = width + overscan;
      const endY = height + overscan;
      const drawTiled = (texture: HTMLCanvasElement, xOffset: number, yOffset: number) => {
        for (let x = startX; x < endX; x += size) {
          for (let y = startY; y < endY; y += size) {
            context.drawImage(texture, x + xOffset, y + yOffset, size, size);
          }
        }
      };

      // A displaced dark footprint gives each bank height; a sharper white
      // core above the softer vapor makes the deck read as volume rather than
      // a blurred texture pasted over the chart.
      context.globalCompositeOperation = "source-over";
      context.globalAlpha = sheetAlpha * (tactical ? 0.58 : 0.42);
      drawTiled(tile.shadow, 9 + sheet.altitude * 12, 13 + sheet.altitude * 17);
      context.globalCompositeOperation = "screen";
      context.globalAlpha = sheetAlpha;
      context.shadowColor = `rgba(185, 215, 230, ${0.09 + sheet.altitude * 0.07})`;
      context.shadowBlur = 8 + sheet.altitude * 10;
      drawTiled(tile.vapor, 0, 0);
      context.globalAlpha = sheetAlpha * 0.52;
      context.shadowBlur = 3 + sheet.altitude * 5;
      drawTiled(tile.core, -2 - sheet.altitude * 3, -3 - sheet.altitude * 5);
      context.restore();
    };

    const render = () => {
      const { knots } = windRef.current;
      // Present enough to read as weather, restrained enough to keep labels
      // and satellite detail legible even where several decks overlap.
      const baseAlpha = 0.09 + Math.min(knots, 30) / 30 * 0.06;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "source-over";
      for (const sheet of sheets) drawSheet(sheet, baseAlpha);
      context.globalCompositeOperation = "source-over";
      context.globalAlpha = 1;
    };

    const advanceWind = (delta: number) => {
      const { direction, knots } = windRef.current;
      const speed = 0.55 + Math.min(knots, 30) * 0.085;
      for (const sheet of sheets) {
        const heading = ((direction + 180 + sheet.headingOffset) * Math.PI) / 180;
        sheet.x += Math.sin(heading) * speed * sheet.speed * delta;
        sheet.y += -Math.cos(heading) * speed * sheet.speed * delta;
      }
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const delta = Math.min(now - previous, 120) / 1000;
      previous = now;
      advanceWind(delta);
      if (now - lastDraw < 50) return;
      lastDraw = now;
      render();
    };

    resize();
    render();
    const observer = new ResizeObserver(() => {
      resize();
      render();
    });
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    if (reduceMotion) {
      map?.on("move", render);
      map?.on("resize", render);
    } else {
      frame = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      map?.off("move", render);
      map?.off("resize", render);
    };
  }, [isReady, mapRef, tactical]);

  return <canvas ref={canvasRef} className={`cloud-layer${tactical ? " cloud-layer--tactical" : ""}`} aria-hidden />;
}
