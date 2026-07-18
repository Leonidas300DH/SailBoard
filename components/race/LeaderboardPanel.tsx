"use client";

import { ChevronLeft, ShieldCheck } from "lucide-react";
import type { LeaderboardRow } from "@/lib/domain";

export function LeaderboardPanel({
  leaderboard,
  selectedEntryId,
  isRailExpanded,
  onOpen,
}: {
  leaderboard: LeaderboardRow[];
  selectedEntryId?: string;
  isRailExpanded: boolean;
  onOpen: (entryId: string) => void;
}) {
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
      <span>Barème championnat 2026 · version 1</span>
    </div>
  </div>;
}
