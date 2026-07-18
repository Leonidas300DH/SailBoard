"use client";

import Link from "next/link";
import { Flag, Map } from "lucide-react";

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
    <div>
      <span>Championnat 2026</span>
      <strong>La saison en mouvement</strong>
    </div>
    <div className="season-top-meta">
      <span className="status-dot status-dot--locked" />
      <span>6 régates · Bretagne</span>
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
    <Link className="button primary season-primary-action" href={exploreHref}>
      <Flag aria-hidden />
      Explorer la course
    </Link>
  </header>;
}
