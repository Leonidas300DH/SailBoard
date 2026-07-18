"use client";

import Link from "next/link";
import { PanelRightClose } from "lucide-react";
import type { LeaderboardRow } from "@/lib/domain";

function formatTime(seconds: number | null) {
  if (seconds == null) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return [hours, minutes, secs].map((value) => String(value).padStart(2, "0")).join(":");
}

export function CompetitorRail({
  selected,
  leader,
  onClose,
}: {
  selected: LeaderboardRow;
  leader?: LeaderboardRow;
  onClose: () => void;
}) {
  const gap = selected.elapsedSeconds != null && leader?.elapsedSeconds != null
    ? selected.elapsedSeconds - leader.elapsedSeconds
    : null;
  const hasTiming = selected.elapsedSeconds != null;

  return <section
    id="selected-boat-rail"
    className="leaderboard-detail"
    aria-label={`Détails de ${selected.boatName}`}
    style={{ "--boat-color": selected.color } as React.CSSProperties}
  >
    <div className="rail-detail-head">
      <span>Dossier équipage</span>
      <button type="button" onClick={onClose} aria-label="Replier les détails"><PanelRightClose /></button>
    </div>
    <div className="rail-boat-identity">
      <span>{selected.position ?? "—"}<sup>e</sup></span>
      <div>
        <strong>{selected.boatName}</strong>
        <small className="mono">{selected.sailNumber}</small>
      </div>
    </div>
    <div className={`rail-metrics ${hasTiming ? "" : "rail-metrics--single"}`}>
      {hasTiming ? <div><span>Temps</span><strong className="mono">{formatTime(selected.elapsedSeconds)}</strong></div> : null}
      {hasTiming && gap != null ? <div><span>Écart 1er</span><strong className="mono">{gap === 0 ? "En tête" : `+${formatTime(gap)}`}</strong></div> : null}
      <div><span>Points WDT</span><strong className="mono">{selected.points.toFixed(1)}</strong></div>
    </div>
    <div className="rail-crew-points">
      <span className="rail-section-label">Équipage de l’étape</span>
      {selected.crew.length > 0 ? selected.crew.map((member) => (
        <Link key={member.id} href={`/classements?vue=individuel&selection=${member.slug}`}>
          <span>
            <strong>{member.name}</strong>
            <small>{member.role}</small>
          </span>
          {member.points != null ? <span className="mono">{member.points.toFixed(1)} PTS</span> : null}
        </Link>
      )) : <div className="rail-crew-empty"><strong>Composition non publiée</strong><span>La source officielle ne permet pas d’associer ces navigateurs sans ambiguïté.</span></div>}
    </div>
  </section>;
}

export { formatTime };
