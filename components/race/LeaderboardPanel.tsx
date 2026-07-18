"use client";

import { ChevronLeft, ShieldCheck } from "lucide-react";
import type { LeaderboardRow } from "@/lib/domain";

export function LeaderboardPanel({
  leaderboard,
  selectedEntryId,
  isRailExpanded,
  upcoming = false,
  onOpen,
}: {
  leaderboard: LeaderboardRow[];
  selectedEntryId?: string;
  isRailExpanded: boolean;
  upcoming?: boolean;
  onOpen: (entryId: string) => void;
}) {
  if (leaderboard.length === 0) {
    return <div className="leaderboard-core">
      <div className="panel-title">
        <span>Classement</span>
        <span className="mono muted">— / —</span>
      </div>
      <div className="leaderboard-empty">
        <strong>{upcoming ? "Engagements ouverts" : "Résultats en attente"}</strong>
        <p>
          {upcoming
            ? "La flotte et le classement apparaîtront ici une fois les inscriptions closes et la course disputée."
            : "La direction de course n’a pas encore publié le classement de cette manche."}
        </p>
      </div>
      <div className="leader-foot">
        <strong><ShieldCheck size={15} /> Données officielles uniquement</strong>
        <span>Saisies et validées par la direction de course</span>
      </div>
    </div>;
  }

  return <div className="leaderboard-core">
    <div className="panel-title">
      <span>Classement</span>
      <span className="mono acid">{leaderboard.length} / {leaderboard.length}</span>
    </div>
    <div className="rank-head"><span>Pos</span><span>Bateau / équipage</span><span>Points</span><span /></div>
    <div className="rank-list">
      {leaderboard.map((row) => (
        <button
          type="button"
          key={row.entryId}
          aria-expanded={isRailExpanded && row.entryId === selectedEntryId}
          aria-controls="selected-boat-rail"
          className={`rank-row ${row.entryId === selectedEntryId ? "selected" : ""}`}
          style={{ "--boat-color": row.color } as React.CSSProperties}
          onClick={() => onOpen(row.entryId)}
        >
          <span className="rank-number">{row.position ?? "—"}</span>
          <span className="rank-boat">
            <strong>{row.boatName}</strong>
            <small>{row.crew.map((member) => member.name.split(" ").at(-1)).join(" · ")}</small>
          </span>
          <span className="rank-points">{row.points.toFixed(1)}</span>
          <ChevronLeft className="rank-expand-icon" aria-hidden />
        </button>
      ))}
    </div>
    <div className="leader-foot">
      <strong><ShieldCheck size={15} /> Résultats validés</strong>
      <span>World Diam Tour 2026 · le score le plus bas gagne</span>
    </div>
  </div>;
}
