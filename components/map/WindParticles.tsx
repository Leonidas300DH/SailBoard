"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "./useMapLibre";

type Particle = { x: number; y: number; life: number; maxLife: number };

/**
 * Screen-space wind field: a few hundred particles advected by the real wind
 * vector (direction + speed from the weather snapshot), with fading trails.
 * Ambiance, not georeferenced data — so no reprojection on pan, which keeps
 * it nearly free. Skipped under reduced motion and on small screens (the
 * static CSS wind-field takes over there).
 */
export function WindParticles({
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
    if (!canvas || prefersReducedMotion()) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    // The static CSS wind-field owns small screens; pause rather than burn
    // CPU under it, and resume if the viewport grows back (rotation).
    const compactMedia = window.matchMedia("(max-width: 760px)");

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

    // A faint breath over the water, not a rain of streaks.
    const count = Math.min(150, Math.max(70, Math.round((width * height) / 9000)));
    const particles: Particle[] = Array.from({ length: count }, () => spawn(width, height));

    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(now - previous, 90) / 1000;
      previous = now;
      const { direction, knots } = windRef.current;
      // Meteorological direction is where the wind comes FROM.
      const heading = ((direction + 180) * Math.PI) / 180;
      const speed = 14 + knots * 1.7;
      const vx = Math.sin(heading) * speed;
      const vy = -Math.cos(heading) * speed;

      context.globalCompositeOperation = "destination-out";
      context.fillStyle = "rgba(0, 0, 0, 0.14)";
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = "source-over";
      context.strokeStyle = "rgba(214, 236, 244, 0.3)";
      context.lineWidth = 1;
      context.beginPath();
      for (const particle of particles) {
        const nx = particle.x + vx * delta;
        const ny = particle.y + vy * delta;
        context.moveTo(particle.x, particle.y);
        context.lineTo(nx, ny);
        particle.x = nx;
        particle.y = ny;
        particle.life += delta;
        if (particle.life > particle.maxLife || nx < -20 || nx > width + 20 || ny < -20 || ny > height + 20) {
          Object.assign(particle, spawn(width, height));
        }
      }
      context.stroke();
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (frame || compactMedia.matches) return;
      previous = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const syncToViewport = () => (compactMedia.matches ? stop() : start());
    compactMedia.addEventListener("change", syncToViewport);
    syncToViewport();
    return () => {
      stop();
      observer.disconnect();
      compactMedia.removeEventListener("change", syncToViewport);
    };
  }, []);

  return <canvas ref={canvasRef} className="wind-particles" aria-hidden />;
}

function spawn(width: number, height: number): Particle {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    life: Math.random() * 2,
    maxLife: 1.6 + Math.random() * 2.6,
  };
}
