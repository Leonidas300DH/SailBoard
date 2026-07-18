"use client";

import Link from "next/link";
import { ArrowRight, Check, ChevronDown, ChevronRight, Flag, Map, Sailboat, Settings, Trophy, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import { SEASON_RACES } from "@/lib/season-data";
import type { PublicSection } from "@/lib/navigation";
import { snapshotSlug, wdt2026IndividualSnapshot, wdt2026TeamSnapshot } from "@/lib/wdt-2026";
import { participantDisplayName, teamDisplayName, type NavProfileSelection } from "./NavProfileHud";

type NavExtras = Partial<Record<PublicSection, ReactNode>>;

const TEAM_PODIUM = wdt2026TeamSnapshot.rows.slice(0, 3);
const SAILOR_PODIUM = wdt2026IndividualSnapshot.rows.slice(0, 3);
const NEXT_RACE = SEASON_RACES.find((race) => race.status === "upcoming") ?? SEASON_RACES.at(-1);
function nextRaceDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" })
    .format(new Date(`${date}T12:00:00`))
    .replace(".", "")
    .toLocaleUpperCase("fr-FR");
}

function DisclosureButton({ open, controls, label, onClick }: { open: boolean; controls: string; label: string; onClick: () => void }) {
  return <button
    type="button"
    className="nav-disclosure"
    aria-expanded={open}
    aria-controls={controls}
    aria-label={`${open ? "Replier" : "Déplier"} ${label}`}
    onClick={onClick}
  >
    <ChevronDown className={open ? "open" : ""} aria-hidden />
  </button>;
}

function PodiumPreview({
  id,
  type,
  rows,
  onSelect,
}: {
  id: string;
  type: "teams" | "sailors";
  rows: Array<{ rank: number; name: string; points: number }>;
  onSelect: (selection: NavProfileSelection) => void;
}) {
  const rankingHref = type === "teams" ? "/classements?vue=bateaux" : "/classements?vue=individuel";
  return <div id={id} className="nav-context nav-context--podium">
    <span className="nav-context-guide" aria-hidden />
    <div className="nav-podium-list">
      {rows.map((row, index) => {
        const displayName = type === "teams" ? teamDisplayName(row.name) : participantDisplayName(row.name);
        return <button key={`${type}-${row.name}`} type="button" className="nav-podium-row" onClick={() => onSelect({ type, slug: snapshotSlug(row.name) })} title={`Ouvrir le HUD de ${displayName}`}>
          <span className="nav-podium-rank">
            {index === 0 ? <Check aria-hidden /> : null}
            <span>{row.rank}</span>
          </span>
          <span className="nav-podium-name">{displayName}</span>
          <span className="nav-podium-points mono">{row.points}</span>
        </button>;
      })}
      <Link className="nav-context-all" href={rankingHref}>
        <span>Classement</span><ArrowRight aria-hidden />
      </Link>
    </div>
  </div>;
}

export function ChampionshipNav({
  active,
  extras,
  onProfileSelect,
}: {
  active: PublicSection;
  extras?: NavExtras;
  onProfileSelect: (selection: NavProfileSelection) => void;
}) {
  const seasonActive = active === "season" || active === "course";
  const [seasonOpen, setSeasonOpen] = useState(seasonActive);
  const [teamsOpen, setTeamsOpen] = useState(active !== "sailors");
  const [sailorsOpen, setSailorsOpen] = useState(active !== "rankings");

  return <nav className="nav-stack" aria-label="Sections principales">
    <div className="nav-slot nav-rich-section">
      <div className="nav-rich-row">
        <Link href="/" aria-label="Saison" className={`nav-link ${seasonActive ? "active" : ""}`}>
          <Map aria-hidden /><span>Saison</span>
        </Link>
        <DisclosureButton open={seasonOpen} controls="nav-next-race" label="la prochaine course" onClick={() => setSeasonOpen((value) => !value)} />
      </div>
      {seasonOpen && NEXT_RACE ? <div id="nav-next-race" className="nav-context nav-context--race">
        <span className="nav-context-guide" aria-hidden />
        <Link className="nav-next-race" href={`/courses/${NEXT_RACE.slug}`}>
          <Flag aria-hidden />
          <span className="nav-next-copy">
            <small>Prochaine · {nextRaceDate(NEXT_RACE.date)}</small>
            <strong>{NEXT_RACE.shortName}</strong>
            <span>{NEXT_RACE.locationName}</span>
          </span>
          <ArrowRight aria-hidden />
        </Link>
      </div> : null}
      {extras?.season ?? null}
    </div>

    <div className="nav-slot nav-ranking-tree">
      <Link href="/classements" className={`nav-group-title${active === "rankings" || active === "sailors" ? " active" : ""}`}>
        <Trophy aria-hidden />
        <span>Classement Général</span>
        <ChevronRight className="nav-group-chevron" aria-hidden />
      </Link>

      <div className="nav-rich-section nav-rich-section--ranking">
        <div className="nav-rich-row nav-rich-row--sub">
          <Link href="/classements?vue=bateaux" aria-label="Équipages" className={`nav-sublink${active === "rankings" ? " active" : ""}`}>
            <Sailboat aria-hidden /><span>Équipages</span>
          </Link>
          <DisclosureButton open={teamsOpen} controls="nav-team-podium" label="le podium des équipages" onClick={() => setTeamsOpen((value) => !value)} />
        </div>
        {teamsOpen ? <PodiumPreview id="nav-team-podium" type="teams" rows={TEAM_PODIUM} onSelect={onProfileSelect} /> : null}
        {extras?.rankings ?? null}
      </div>

      <div className="nav-rich-section nav-rich-section--ranking">
        <div className="nav-rich-row nav-rich-row--sub">
          <Link href="/classements?vue=individuel" aria-label="Navigateurs" className={`nav-sublink${active === "sailors" ? " active" : ""}`}>
            <Users aria-hidden /><span>Navigateurs</span>
          </Link>
          <DisclosureButton open={sailorsOpen} controls="nav-sailor-podium" label="le podium des navigateurs" onClick={() => setSailorsOpen((value) => !value)} />
        </div>
        {sailorsOpen ? <PodiumPreview id="nav-sailor-podium" type="sailors" rows={SAILOR_PODIUM} onSelect={onProfileSelect} /> : null}
        {extras?.sailors ?? null}
      </div>
    </div>

    <div className="nav-slot nav-admin-slot">
      <Link href="/admin" aria-label="Admin" className={`nav-link ${active === "admin" ? "active" : ""}`}>
        <Settings aria-hidden /><span>Admin</span>
        <ChevronRight className="nav-admin-chevron" aria-hidden />
      </Link>
      {extras?.admin ?? null}
    </div>
  </nav>;
}
