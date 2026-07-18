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
  const gap = selected.elapsedSeconds && leader?.elapsedSeconds
    ? selected.elapsedSeconds - leader.elapsedSeconds
    : 0;

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
    <div className="rail-crew-summary">{selected.crew.map((member) => member.name).join(" · ")}</div>
    <div className="rail-metrics">
      <div><span>Temps</span><strong className="mono">{formatTime(selected.elapsedSeconds)}</strong></div>
      <div><span>Écart 1er</span><strong className="mono">{gap ? `+${formatTime(gap)}` : "—"}</strong></div>
      <div><span>Points WDT</span><strong className="mono">{selected.points.toFixed(1)}</strong></div>
    </div>
    <div className="rail-crew-points">
      <span className="rail-section-label">Points des navigateurs</span>
      {selected.crew.map((member) => (
        <Link key={member.id} href={`/participants/${member.slug}`}>
          <span>
            <strong>{member.name}</strong>
            <small>{member.role}</small>
          </span>
          <span className="mono">{(member.points ?? selected.points).toFixed(1)} PTS</span>
        </Link>
      ))}
    </div>
  </section>;
}

export { formatTime };
