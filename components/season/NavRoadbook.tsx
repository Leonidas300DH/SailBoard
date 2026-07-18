"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { SeasonRace } from "@/lib/season-data";

/**
 * The season roadbook folded into the left rail: six stages under the
 * "Saison" entry. Selecting a stage drives the map and opens the race HUD.
 */
export function NavRoadbook({
  races,
  selectedId,
  onSelect,
}: {
  races: SeasonRace[];
  selectedId: string | null;
  onSelect: (raceId: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const nextRaceId = races.find((race) => race.status === "upcoming")?.id ?? null;

  return <div className="nav-roadbook">
    <button
      type="button"
      className="nav-roadbook-toggle"
      aria-expanded={open}
      aria-controls="nav-roadbook-stages"
      onClick={() => setOpen((value) => !value)}
    >
      <span>Roadbook · 6 étapes</span>
      <ChevronDown aria-hidden className={open ? "open" : ""} />
    </button>
    <div id="nav-roadbook-stages" className={`nav-roadbook-stages${open ? " open" : ""}`}>
      {races.map((race, index) => (
        <button
          type="button"
          key={race.id}
          className={`nav-stage${race.id === selectedId ? " selected" : ""}${race.id === nextRaceId ? " next" : ""}`}
          data-status={race.status}
          aria-pressed={race.id === selectedId}
          onClick={() => onSelect(race.id)}
        >
          <i className="nav-stage-hex">{index + 1}</i>
          <span className="nav-stage-copy">
            <strong>{race.shortName}</strong>
            <small className="mono">{race.dateLabel}</small>
          </span>
          <em className={`nav-stage-state ${race.status}`}>{race.status === "upcoming" ? "À venir" : "Terminée"}</em>
        </button>
      ))}
    </div>
  </div>;
}
