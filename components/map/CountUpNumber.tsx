"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "./useMapLibre";

export function CountUpNumber({
  value,
  decimals = 0,
  duration = 720,
  delay = 0,
}: {
  value: number;
  decimals?: number;
  duration?: number;
  delay?: number;
}) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    let frame = 0;
    const timer = window.setTimeout(() => {
      const startedAt = performance.now();
      setDisplay(0);

      const tick = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(progress === 1 ? value : value * eased);
        if (progress < 1) frame = requestAnimationFrame(tick);
      };

      frame = requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [delay, duration, value]);

  return <>
    <span aria-hidden="true">{display.toFixed(decimals)}</span>
    <span className="sr-only">{value.toFixed(decimals)}</span>
  </>;
}
