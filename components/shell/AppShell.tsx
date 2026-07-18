"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Flag, Trophy } from "lucide-react";
import type { PublicSection } from "@/lib/navigation";
import { PersistentSeasonTimeline } from "../season/PersistentSeasonTimeline";
import { ChampionshipNav } from "./ChampionshipNav";
import { NavProfileHud, type NavProfileSelection } from "./NavProfileHud";

export function AppShell({
  active,
  shellClassName,
  navClassName,
  navFooter,
  showPersistentTimeline = true,
  timelineSelectedSlug,
  children,
}: {
  active: PublicSection;
  shellClassName?: string;
  navClassName?: string;
  navFooter?: ReactNode;
  /** The season home owns its interactive timeline; other public rooms share this one. */
  showPersistentTimeline?: boolean;
  timelineSelectedSlug?: string | null;
  children: ReactNode;
}) {
  const [profileHud, setProfileHud] = useState<NavProfileSelection | null>(null);

  return <main className={`public-shell${shellClassName ? ` ${shellClassName}` : ""}`}>
    <aside className={`side-nav${navClassName ? ` ${navClassName}` : ""}`} aria-label="Navigation principale">
      <Link className="side-brand" href="/" aria-label="Accueil SailBoard">
        <span className="brand"><span>SailBoard</span><span>Race</span></span>
      </Link>
      <ChampionshipNav key={active} active={active} onProfileSelect={setProfileHud} />
      {navFooter}
    </aside>
    {profileHud ? <NavProfileHud selection={profileHud} onClose={() => setProfileHud(null)} onSelect={setProfileHud} /> : null}
    <div className={`app-shell-content${showPersistentTimeline ? " app-shell-content--timeline" : ""}`}>
      {children}
      {showPersistentTimeline ? <PersistentSeasonTimeline selectedSlug={timelineSelectedSlug} /> : null}
    </div>
  </main>;
}

export function ControlShell({
  active,
  raceSlug,
  eventName,
  title,
  eyebrow,
  children,
}: {
  active: PublicSection;
  raceSlug: string;
  eventName: string;
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return <AppShell
    active={active}
    shellClassName="control-shell"
    navFooter={<div className="nav-season"><strong>{eventName}</strong><small>17 JUIL. 2026</small></div>}
  >
    <section className="control-stage">
      <header className="control-topbar">
        <div className="control-heading"><span>{eyebrow}</span><h1>{title}</h1></div>
        <div className="control-status">
          <span className="status-dot status-dot--locked" />
          <span>Résultats officiels</span>
          <strong className="mono">DATA · V1</strong>
        </div>
        <div className="top-actions">
          <Link className="button primary" href={`/courses/${raceSlug}`}><Flag />Voir l’étape</Link>
          <Link className="button" href="/classements"><Trophy />Championnat</Link>
        </div>
      </header>
      {children}
    </section>
  </AppShell>;
}
