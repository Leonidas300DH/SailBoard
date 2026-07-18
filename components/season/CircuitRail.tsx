"use client";

import { Anchor, X } from "lucide-react";
import type { SeasonRace } from "@/lib/season-data";

/** Roadbook drawer: the six stages of the season as a linked circuit. */
export function CircuitRail({
  races,
  selectedId,
  open,
  onClose,
  onSelect,
}: {
  races: SeasonRace[];
  selectedId: string;
  open: boolean;
  onClose: () => void;
  onSelect: (raceId: string) => void;
}) {
  return <aside
    id="season-circuit"
    className={`season-circuit-rail ${open ? "open" : ""}`}
    aria-label="Roadbook de la saison"
    aria-hidden={!open}
  >
    <header className="circuit-rail-head">
      <div>
        <span>Roadbook 2026</span>
        <strong>Le circuit atlantique</strong>
        <small>6 étapes · avril — octobre</small>
      </div>
      <button type="button" aria-label="Refermer la vue circuit" onClick={onClose}><X /></button>
    </header>
    <div className="circuit-stage-list">
      {races.map((race, index) => {
        const isSelected = race.id === selectedId;
        const statusLabel = race.status === "completed" ? "ARRIVÉE" : race.status === "selected" ? "COURSE DU JOUR" : "À VENIR";
        return <div className="circuit-stage-wrap" key={race.id}>
          <button
            type="button"
            className={`circuit-stage ${isSelected ? "selected" : ""} ${race.status}`}
            aria-pressed={isSelected}
            onClick={() => onSelect(race.id)}
          >
            <span className="circuit-stage-number mono">{String(index + 1).padStart(2, "0")}</span>
            <span className="circuit-stage-copy">
              <small>ÉTAPE {index + 1} · {race.dateLabel}</small>
              <strong>{race.name}</strong>
              <em>{race.locationName}</em>
            </span>
            <span className="circuit-stage-state"><i />{statusLabel}</span>
          </button>
          {index < races.length - 1 ? (
            <div className="circuit-transfer" aria-hidden>
              <i />
              <span>Ralliement · prochaine étape</span>
            </div>
          ) : null}
        </div>;
      })}
    </div>
    <footer className="circuit-rail-foot">
      <Anchor aria-hidden />
      <div>
        <span>Façade Atlantique</span>
        <strong>6 champs de course reliés</strong>
      </div>
      <b className="mono">2026</b>
    </footer>
  </aside>;
}
