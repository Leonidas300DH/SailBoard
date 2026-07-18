"use client";

import Link from "next/link";
import { PanelRightClose } from "lucide-react";
import type { CSSProperties } from "react";
import type { LeaderboardRow } from "@/lib/domain";
import { CountUpNumber } from "../map/CountUpNumber";
import { DecodeText } from "../map/DecodeText";

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
    key={selected.entryId}
    id="selected-boat-rail"
    className="leaderboard-detail"
    aria-label={`Détails de ${selected.boatName}`}
    style={{ "--boat-color": selected.color } as CSSProperties}
  >
    <div className="rail-detail-head">
      <span><DecodeText text="Dossier équipage" speed={16} delay={170} /></span>
      <button type="button" onClick={onClose} aria-label="Replier les détails"><PanelRightClose /></button>
    </div>
    <div className="rail-boat-identity">
      <span>{selected.position == null ? "—" : <CountUpNumber value={selected.position} duration={520} delay={280} />}<sup>e</sup></span>
      <div>
        <strong><DecodeText text={selected.boatName} speed={18} delay={320} /></strong>
        <small className="mono"><DecodeText text={selected.sailNumber} speed={14} delay={440} /></small>
      </div>
    </div>
    <div className={`rail-metrics ${hasTiming ? "" : "rail-metrics--single"}`}>
      {hasTiming ? <div style={{ "--hud-row": 0 } as CSSProperties}><span><DecodeText text="Temps" speed={14} delay={520} /></span><strong className="mono"><DecodeText text={formatTime(selected.elapsedSeconds)} speed={18} delay={580} /></strong></div> : null}
      {hasTiming && gap != null ? <div style={{ "--hud-row": 1 } as CSSProperties}><span><DecodeText text="Écart 1er" speed={14} delay={590} /></span><strong className="mono"><DecodeText text={gap === 0 ? "En tête" : `+${formatTime(gap)}`} speed={18} delay={650} /></strong></div> : null}
      <div style={{ "--hud-row": 2 } as CSSProperties}><span><DecodeText text="Points WDT" speed={14} delay={660} /></span><strong className="mono"><CountUpNumber value={selected.points} decimals={1} duration={720} delay={720} /></strong></div>
    </div>
    <div className="rail-crew-points">
      <span className="rail-section-label"><DecodeText text="Équipage de l’étape" speed={14} delay={790} /></span>
      {selected.crew.length > 0 ? selected.crew.map((member, memberIndex) => (
        <Link key={member.id} href={`/classements?vue=individuel&selection=${member.slug}`} style={{ "--hud-row": memberIndex } as CSSProperties}>
          <span>
            <strong><DecodeText text={member.name} speed={14} delay={850 + memberIndex * 80} /></strong>
            <small><DecodeText text={member.role} speed={12} delay={900 + memberIndex * 80} /></small>
          </span>
          {member.points != null ? <span className="mono"><CountUpNumber value={member.points} decimals={1} duration={620} delay={930 + memberIndex * 80} /> PTS</span> : null}
        </Link>
      )) : <div className="rail-crew-empty"><strong>Composition non publiée</strong><span>La source officielle ne permet pas d’associer ces navigateurs sans ambiguïté.</span></div>}
    </div>
  </section>;
}

export { formatTime };
