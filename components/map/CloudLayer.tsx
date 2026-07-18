"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "./useMapLibre";

const TILE = 768;

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Tileable cloud field rendered once offscreen. Domain-warped fractal noise:
 * a low-frequency warp field bends the sampling coordinates before the fbm
 * lookup, which is what turns "blurry noise" into the stretched, organic
 * masses real cloud decks have. Soft smoothstep shaping keeps edges feathered.
 */
function buildCloudTile(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = TILE;
  canvas.height = TILE;
  const context = canvas.getContext("2d");
  if (!context) return canvas;
  const image = context.createImageData(TILE, TILE);

  const makeGrid = (cells: number) => {
    const grid = new Float32Array(cells * cells);
    for (let index = 0; index < grid.length; index += 1) grid[index] = Math.random();
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

  // Big, few structures: the lowest octave spans a third of the tile.
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
      // Domain warp: bend coordinates before the fbm lookup.
      const wu = u + (sample(warpU, 4, u, v) - 0.5) * 0.28;
      const wv = v + (sample(warpV, 4, u, v) - 0.5) * 0.28;
      let noise = 0;
      for (const { cells, amp, grid } of octaves) {
        noise += sample(grid, cells, wu, wv) * amp;
      }
      // Feathered coverage: clear sky below .52, dense core near .78.
      const density = smoothstep(0.52, 0.78, noise);
      const offset = (y * TILE + x) * 4;
      image.data[offset] = 238;
      image.data[offset + 1] = 245;
      image.data[offset + 2] = 250;
      image.data[offset + 3] = Math.round(density ** 1.25 * 255);
    }
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

/**
 * Discreet live-sky overlay: two parallax cloud decks drifting slowly with
 * the real wind (a couple of px/s — a deck crosses the view in minutes).
 * Their slightly diverging headings make the overlap evolve, so the sky
 * changes shape instead of sliding as a frozen picture. Static under
 * reduced motion.
 */
export function CloudLayer({
  windDirection,
  windKnots,
}: {
  windDirection: number;
  windKnots: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const windRef = useRef({ direction: windDirection, knots: windKnots });

  useEffect(() => {
    windRef.current = { direction: windDirection, knots: windKnots };
  }, [windDirection, windKnots]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const tile = buildCloudTile();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let width = 0;
    let height = 0;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    const compact = window.innerWidth < 760;
    const sheets = (compact
      ? [{ scale: 2.2, speed: 1, alpha: 1, headingOffset: 0, x: 0, y: 0 }]
      : [
        { scale: 3, speed: 0.55, alpha: 0.65, headingOffset: -6, x: 0, y: 0 },
        { scale: 1.9, speed: 1, alpha: 1, headingOffset: 7, x: 310, y: 140 },
      ]);

    const render = () => {
      const { knots } = windRef.current;
      // Quiet presence: 8% coverage in light air, 15% in a real breeze.
      const baseAlpha = 0.08 + Math.min(knots, 30) / 30 * 0.07;
      context.clearRect(0, 0, width, height);
      for (const sheet of sheets) {
        const size = TILE * sheet.scale;
        const ox = ((sheet.x % size) + size) % size;
        const oy = ((sheet.y % size) + size) % size;
        context.globalAlpha = baseAlpha * sheet.alpha;
        for (let x = -ox; x < width; x += size) {
          for (let y = -oy; y < height; y += size) {
            context.drawImage(tile, x, y, size, size);
          }
        }
      }
      context.globalAlpha = 1;
    };

    if (prefersReducedMotion()) {
      render();
      return () => observer.disconnect();
    }

    let frame = 0;
    let previous = performance.now();
    let lastDraw = 0;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const delta = Math.min(now - previous, 120) / 1000;
      previous = now;
      const { direction, knots } = windRef.current;
      // Slow drift: ~1 px/s in light air, ~3 px/s in 20 knots.
      const speed = 0.7 + Math.min(knots, 30) * 0.11;
      for (const sheet of sheets) {
        const heading = ((direction + 180 + sheet.headingOffset) * Math.PI) / 180;
        sheet.x += Math.sin(heading) * speed * sheet.speed * delta;
        sheet.y += -Math.cos(heading) * speed * sheet.speed * delta;
      }
      // At these speeds ~12 fps is indistinguishable from continuous.
      if (now - lastDraw < 80) return;
      lastDraw = now;
      render();
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="cloud-layer" aria-hidden />;
}
