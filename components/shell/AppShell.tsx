"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Flag, Trophy } from "lucide-react";
import { publicNav, type PublicSection } from "@/lib/navigation";

export function AppShell({
  active,
  shellClassName,
  navClassName,
  navFooter,
  navExtras,
  children,
}: {
  active: PublicSection;
  shellClassName?: string;
  navClassName?: string;
  navFooter?: ReactNode;
  /** Rendered right below the matching nav item — e.g. the season roadbook. */
  navExtras?: Partial<Record<PublicSection, ReactNode>>;
  children: ReactNode;
}) {
  return <main className={`public-shell${shellClassName ? ` ${shellClassName}` : ""}`}>
    <aside className={`side-nav${navClassName ? ` ${navClassName}` : ""}`} aria-label="Navigation principale">
      <Link className="side-brand" href="/" aria-label="Accueil — World Diam Tour France 2026">
        <span className="wdt-block cut-right">
          <svg className="wdt-hex" viewBox="0 0 100 100" aria-hidden>
            <polygon points="25,6.7 75,6.7 50,50" fill="#0033a0" />
            <polygon points="0,50 25,6.7 50,50" fill="#009cde" />
            <polygon points="75,6.7 100,50 50,50" fill="#e4002b" />
            <polygon points="100,50 75,93.3 50,50" fill="#efdf00" />
            <polygon points="75,93.3 25,93.3 50,50" fill="#f6eb61" />
            <polygon points="25,93.3 0,50 50,50" fill="#a09200" />
          </svg>
          <span className="wdt-word">
            <strong>WDT</strong>
            <small>World<br />Diam<br />Tour</small>
          </span>
          <span className="wdt-frieze wdt-block-frieze" aria-hidden />
        </span>
      </Link>
      <nav className="nav-stack">
        {publicNav().map(({ id, href, label, icon: Icon }) => (
          <div key={id} className="nav-slot">
            <Link href={href} aria-label={label} className={`nav-link ${active === id ? "active" : ""}`}>
              <Icon aria-hidden />
              <span>{label}</span>
            </Link>
            {navExtras?.[id] ?? null}
          </div>
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
