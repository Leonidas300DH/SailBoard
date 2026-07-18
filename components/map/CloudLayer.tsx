"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "./useMapLibre";

const TILE = 512;

/**
 * Tileable fractal value-noise rendered once into an offscreen canvas: soft
 * white masses on a transparent background. Tileability lets the layer drift
 * forever with seamless wrapping.
 */
function buildCloudTile(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = TILE;
  canvas.height = TILE;
  const context = canvas.getContext("2d");
  if (!context) return canvas;
  const image = context.createImageData(TILE, TILE);
  const octaves = [
    { cells: 4, amp: 0.5 },
    { cells: 8, amp: 0.26 },
    { cells: 16, amp: 0.15 },
    { cells: 32, amp: 0.09 },
  ];
  const grids = octaves.map((octave) => {
    const grid = new Float32Array(octave.cells * octave.cells);
    for (let index = 0; index < grid.length; index += 1) grid[index] = Math.random();
    return grid;
  });
  const sample = (grid: Float32Array, cells: number, u: number, v: number) => {
    const x = u * cells;
    const y = v * cells;
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
  for (let y = 0; y < TILE; y += 1) {
    for (let x = 0; x < TILE; x += 1) {
      const u = x / TILE;
      const v = y / TILE;
      let noise = 0;
      octaves.forEach((octave, index) => {
        noise += sample(grids[index], octave.cells, u, v) * octave.amp;
      });
      // Soft threshold carves distinct masses out of the noise field.
      const shaped = Math.min(1, Math.max(0, (noise - 0.52) * 3.1));
      const offset = (y * TILE + x) * 4;
      image.data[offset] = 226;
      image.data[offset + 1] = 238;
      image.data[offset + 2] = 246;
      image.data[offset + 3] = Math.round(shaped ** 1.5 * 255);
    }
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

/**
 * Live-satellite illusion: two parallax cloud sheets drifting with the real
 * wind (direction + speed), coverage swelling slightly with the breeze.
 * Deliberately faint — ambiance under the HUD, never against readability.
 * Static frame under reduced motion.
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
    // Back sheet: bigger, slower, fainter — cheap parallax depth.
    const sheets = (compact
      ? [{ scale: 1.5, speed: 1, alpha: 1, x: 0, y: 0 }]
      : [
        { scale: 2.1, speed: 0.55, alpha: 0.55, x: 0, y: 0 },
        { scale: 1.25, speed: 1, alpha: 1, x: 130, y: 260 },
      ]);

    const render = () => {
      const { knots } = windRef.current;
      // Coverage grows with the breeze — present enough to read as live sky.
      const baseAlpha = 0.16 + Math.min(knots, 30) / 30 * 0.14;
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
      // Meteorological direction = where the wind comes FROM; clouds go with it.
      const heading = ((direction + 180) * Math.PI) / 180;
      const speed = 1.5 + knots * 0.32;
      for (const sheet of sheets) {
        sheet.x += Math.sin(heading) * speed * sheet.speed * delta;
        sheet.y += -Math.cos(heading) * speed * sheet.speed * delta;
      }
      // Clouds do not need 60 fps — ~24 is invisible at this speed.
      if (now - lastDraw < 40) return;
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
