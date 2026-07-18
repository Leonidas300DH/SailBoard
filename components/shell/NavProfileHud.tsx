"use client";

import { Sailboat, Trophy, Users, X } from "lucide-react";
import { useEffect } from "react";
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
    className={`nav-profile-hud nav-profile-hud--${selection.type}`}
    style={{ "--profile-color": color } as React.CSSProperties}
    role="dialog"
    aria-modal="false"
    aria-label={`HUD de ${displayName}`}
  >
    <header className="nav-profile-hud-head">
      <span>{isTeam ? <Sailboat aria-hidden /> : <Users aria-hidden />}{isTeam ? "Équipage" : "Navigateur"}</span>
      <span className="mono">RANG · {String(row.rank).padStart(2, "0")}</span>
      <button type="button" onClick={onClose} aria-label="Fermer le HUD"><X aria-hidden /></button>
    </header>

    <div className="nav-profile-hud-identity">
      <span className="mono">{row.rank}<sup>{row.rank === 1 ? "er" : "e"}</sup></span>
      <strong>{displayName}</strong>
      <span className="nav-profile-hud-total mono">{row.points}<small>pts</small></span>
    </div>

    {isTeam ? <div className="nav-profile-hud-relations">
      <span><Users aria-hidden />Équipage · 4 Vents</span>
      {crew.length > 0 ? crew.map((member) => <button key={member.slug} type="button" onClick={() => onSelect({ type: "sailors", slug: member.slug })}>
        <strong>{participantDisplayName(member.name)}</strong><small>{member.role}</small>
      </button>) : <p>Composition non publiée</p>}
    </div> : <div className="nav-profile-hud-relations nav-profile-hud-relations--single">
      <span><Sailboat aria-hidden />Équipage · 4 Vents</span>
      {team ? <button type="button" onClick={() => onSelect({ type: "teams", slug: team.slug })}>
        <strong>{teamDisplayName(team.name)}</strong><small>Navigateur</small>
      </button> : <p>Affectation non publiée</p>}
    </div>}

    <div className="nav-profile-hud-stages" aria-label="Points des étapes courues">
      <span><Trophy aria-hidden />Étapes</span>
      {completedScores.map((score, index) => <span key={WDT_2026_EVENTS[index].id} title={WDT_2026_EVENTS[index].name}>
        <small>E{index + 1}</small><strong className="mono">{score ?? "—"}</strong>
      </span>)}
    </div>
  </section>;
}
