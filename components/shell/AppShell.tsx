"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Flag, Trophy } from "lucide-react";
import { publicNav, type PublicSection } from "@/lib/navigation";

export function AppShell({
  active,
  raceSlug,
  shellClassName,
  navClassName,
  navFooter,
  children,
}: {
  active: PublicSection;
  raceSlug: string;
  shellClassName?: string;
  navClassName?: string;
  navFooter?: ReactNode;
  children: ReactNode;
}) {
  return <main className={`public-shell${shellClassName ? ` ${shellClassName}` : ""}`}>
    <aside className={`side-nav${navClassName ? ` ${navClassName}` : ""}`} aria-label="Navigation principale">
      <Link className="side-brand" href="/" aria-label="Accueil SailBoard">
        <span className="brand"><span>SailBoard</span><span>Race</span></span>
      </Link>
      <nav className="nav-stack">
        {publicNav(raceSlug).map(({ id, href, label, icon: Icon }) => (
          <Link key={id} href={href} aria-label={label} className={`nav-link ${active === id ? "active" : ""}`}>
            <Icon aria-hidden />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      {navFooter}
    </aside>
    {children}
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
    raceSlug={raceSlug}
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
          <Link className="button primary" href={`/courses/${raceSlug}`}><Flag />Voir la course</Link>
          <Link className="button" href="/classements"><Trophy />Championnat</Link>
        </div>
      </header>
      {children}
    </section>
  </AppShell>;
}
