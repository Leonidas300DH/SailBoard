"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "./useMapLibre";

const GLYPHS = "▮▯/\\|<>+=*#·";

/**
 * Terminal-style decode: characters resolve left to right with a short
 * scramble head, like a system printing an incoming feed. Server render and
 * reduced motion show the plain text.
 */
export function DecodeText({ text, speed = 18, delay = 0 }: { text: string; speed?: number; delay?: number }) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    // Server render and reduced motion keep the plain text already in state.
    if (prefersReducedMotion()) return;
    let step = 0;
    let clear = 0;
    let interval = 0;
    const timer = window.setTimeout(() => {
      clear = requestAnimationFrame(() => setDisplay(""));
      interval = window.setInterval(() => {
        step += 1;
        if (step >= text.length + 4) {
          setDisplay(text);
          window.clearInterval(interval);
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
    }, delay);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(clear);
      window.clearInterval(interval);
    };
  }, [delay, speed, text]);

  return <>
    <span aria-hidden="true">{display}</span>
    <span className="sr-only">{text}</span>
  </>;
}
