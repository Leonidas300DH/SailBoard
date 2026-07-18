"use client";

import { Sailboat, Trophy, Users, X } from "lucide-react";
import { useEffect, type CSSProperties } from "react";
import { CountUpNumber } from "@/components/map/CountUpNumber";
import { DecodeText } from "@/components/map/DecodeText";
import {
  snapshotSlug,
  standingColor,
  WDT_2026_EVENTS,
  wdt2026IndividualSnapshot,
  wdt2026TeamSnapshot,
  wdtCrewForEvent,
  wdtTeamForParticipantEvent,
} from "@/lib/wdt-2026";

export type NavProfileSelection = { type: "teams" | "sailors"; slug: string };

const LOWERCASE_WORDS = new Set(["de", "du", "des", "la", "le", "les"]);
const LAST_COMPLETED_EVENT = WDT_2026_EVENTS.findLastIndex((event) => event.status === "completed");

function titleCase(value: string) {
  if (value === "CENTRE DE MEDIATION") return "Centre de Médiation";
  return value
    .toLocaleLowerCase("fr-FR")
    .split(" ")
    .map((word, index) => {
      if (index > 0 && LOWERCASE_WORDS.has(word)) return word;
      return word.replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase("fr-FR"));
    })
    .join(" ");
}

export function participantDisplayName(value: string) {
  const words = value.trim().split(/\s+/);
  const givenNameIndex = words.findIndex((word) => word !== word.toLocaleUpperCase("fr-FR"));
  if (givenNameIndex <= 0) return titleCase(value);
  return titleCase([...words.slice(givenNameIndex), ...words.slice(0, givenNameIndex)].join(" "));
}

export function teamDisplayName(value: string) {
  return titleCase(value);
}

export function NavProfileHud({ selection, onClose, onSelect }: { selection: NavProfileSelection; onClose: () => void; onSelect: (selection: NavProfileSelection) => void }) {
  const isTeam = selection.type === "teams";
  const row = (isTeam ? wdt2026TeamSnapshot : wdt2026IndividualSnapshot).rows.find((entry) => snapshotSlug(entry.name) === selection.slug);
  const crew = isTeam && row ? wdtCrewForEvent(row.name, LAST_COMPLETED_EVENT) : [];
  const team = !isTeam && row ? wdtTeamForParticipantEvent(row.name, LAST_COMPLETED_EVENT) : null;
  const completedScores = row?.eventScores.slice(0, LAST_COMPLETED_EVENT + 1) ?? [];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!row) return null;

  const displayName = isTeam ? teamDisplayName(row.name) : participantDisplayName(row.name);
  const color = standingColor(row.rank);

  return <section
    key={`${selection.type}-${selection.slug}`}
    className={`nav-profile-hud nav-profile-hud--${selection.type}`}
    style={{ "--profile-color": color } as CSSProperties}
    role="dialog"
    aria-modal="false"
    aria-label={`HUD de ${displayName}`}
  >
    <header className="nav-profile-hud-head">
      <span>{isTeam ? <Sailboat aria-hidden /> : <Users aria-hidden />}<DecodeText text={isTeam ? "Équipage" : "Navigateur"} speed={18} delay={160} /></span>
      <span className="mono"><DecodeText text={`RANG · ${String(row.rank).padStart(2, "0")}`} speed={16} delay={250} /></span>
      <button type="button" onClick={onClose} aria-label="Fermer le HUD"><X aria-hidden /></button>
    </header>

    <div className="nav-profile-hud-identity">
      <span className="mono"><CountUpNumber value={row.rank} duration={480} delay={260} /><sup>{row.rank === 1 ? "er" : "e"}</sup></span>
      <strong><DecodeText text={displayName} speed={18} delay={320} /></strong>
      <span className="nav-profile-hud-total mono"><CountUpNumber value={row.points} decimals={Number.isInteger(row.points) ? 0 : 1} duration={760} delay={420} /><small>pts</small></span>
    </div>

    {isTeam ? <div className="nav-profile-hud-relations">
      <span><Users aria-hidden /><DecodeText text="Équipage · 4 Vents" speed={16} delay={510} /></span>
      {crew.length > 0 ? crew.map((member, memberIndex) => <button key={member.slug} type="button" style={{ "--hud-row": memberIndex } as CSSProperties} onClick={() => onSelect({ type: "sailors", slug: member.slug })}>
        <strong><DecodeText text={participantDisplayName(member.name)} speed={16} delay={560 + memberIndex * 80} /></strong><small><DecodeText text={member.role} speed={14} delay={620 + memberIndex * 80} /></small>
      </button>) : <p>Composition non publiée</p>}
    </div> : <div className="nav-profile-hud-relations nav-profile-hud-relations--single">
      <span><Sailboat aria-hidden /><DecodeText text="Équipage · 4 Vents" speed={16} delay={510} /></span>
      {team ? <button type="button" style={{ "--hud-row": 0 } as CSSProperties} onClick={() => onSelect({ type: "teams", slug: team.slug })}>
        <strong><DecodeText text={teamDisplayName(team.name)} speed={16} delay={560} /></strong><small><DecodeText text="Navigateur" speed={14} delay={620} /></small>
      </button> : <p>Affectation non publiée</p>}
    </div>}

    <div className="nav-profile-hud-stages" aria-label="Points des étapes courues">
      <span><Trophy aria-hidden /><DecodeText text="Étapes" speed={16} delay={760} /></span>
      {completedScores.map((score, index) => <span key={WDT_2026_EVENTS[index].id} title={WDT_2026_EVENTS[index].name} style={{ "--hud-row": index } as CSSProperties}>
        <small>E{index + 1}</small><strong className="mono">{score == null ? "—" : <CountUpNumber value={score} decimals={Number.isInteger(score) ? 0 : 1} duration={620} delay={810 + index * 90} />}</strong>
      </span>)}
    </div>
  </section>;
}
