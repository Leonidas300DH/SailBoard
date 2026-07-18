"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "./useMapLibre";

const GLYPHS = "▮▯/\\|<>+=*#·";

/**
 * Terminal-style decode: characters resolve left to right with a short
 * scramble head, like a system printing an incoming feed. Server render and
 * reduced motion show the plain text.
 */
export function DecodeText({ text, speed = 14 }: { text: string; speed?: number }) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    // Server render and reduced motion keep the plain text already in state.
    if (prefersReducedMotion()) return;
    let step = 0;
    const clear = requestAnimationFrame(() => setDisplay(""));
    const timer = window.setInterval(() => {
      step += 2;
      if (step >= text.length + 4) {
        setDisplay(text);
        window.clearInterval(timer);
        return;
      }
      const resolved = text.slice(0, Math.max(0, step));
      const scrambleLength = Math.min(3, text.length - resolved.length);
      let scramble = "";
      for (let index = 0; index < scrambleLength; index += 1) {
        scramble += GLYPHS[(step * 7 + index * 5) % GLYPHS.length];
      }
      setDisplay(resolved + scramble);
    }, speed);
    return () => {
      cancelAnimationFrame(clear);
      window.clearInterval(timer);
    };
  }, [text, speed]);

  return <>{display}</>;
}
