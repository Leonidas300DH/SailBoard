"use client";

import Link from "next/link";
import { Flag, Map } from "lucide-react";

/** One slim strip: context on the left, the two actions on the right. */
export function SeasonTopBar({
  circuitOpen,
  onToggleCircuit,
  exploreHref,
}: {
  circuitOpen: boolean;
  onToggleCircuit: () => void;
  exploreHref: string;
}) {
  return <header className="season-ocean-top">
    <div className="season-top-id">
      <span className="status-dot status-dot--locked" aria-hidden />
      <span>Championnat 2026 · 6 régates · Bretagne</span>
    </div>
    <button
      className={`circuit-toggle ${circuitOpen ? "active" : ""}`}
      type="button"
      aria-expanded={circuitOpen}
      aria-controls="season-circuit"
      onClick={onToggleCircuit}
    >
      <Map aria-hidden />
      <span>{circuitOpen ? "Refermer" : "Vue circuit"}</span>
    </button>
    <Link className="button season-primary-action" href={exploreHref}>
      <Flag aria-hidden />
      Explorer la course
    </Link>
  </header>;
}
