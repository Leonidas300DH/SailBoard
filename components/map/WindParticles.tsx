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
    if (window.innerWidth < 760) return;
    const context = canvas.getContext("2d");
    if (!context) return;

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

    const count = Math.min(460, Math.max(180, Math.round((width * height) / 3200)));
    const particles: Particle[] = Array.from({ length: count }, () => spawn(width, height));

    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(now - previous, 90) / 1000;
      previous = now;
      const { direction, knots } = windRef.current;
      // Meteorological direction is where the wind comes FROM.
      const heading = ((direction + 180) * Math.PI) / 180;
      const speed = 30 + knots * 3.6;
      const vx = Math.sin(heading) * speed;
      const vy = -Math.cos(heading) * speed;

      context.globalCompositeOperation = "destination-out";
      context.fillStyle = "rgba(0, 0, 0, 0.06)";
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = "source-over";
      context.strokeStyle = "rgba(220, 240, 248, 0.55)";
      context.lineWidth = 1.2;
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
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
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
