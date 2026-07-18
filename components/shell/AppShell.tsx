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
      <Link className="side-brand" href="/" aria-label="Accueil SailBoard">
        <span className="brand"><span>SailBoard</span><span>Race</span></span>
      </Link>
      <nav className="nav-stack">
        {publicNav().map(({ id, href, label, icon: Icon, children: subItems }) => (
          <div key={label} className="nav-slot">
            {subItems ? (
              <>
                <span className={`nav-group-title${subItems.some((child) => child.id === active) ? " active" : ""}`}>
                  <Icon aria-hidden />
                  <span>{label}</span>
                </span>
                <div className="nav-sublinks">
                  {subItems.map(({ id: childId, href: childHref, label: childLabel, icon: ChildIcon }) => (
                    <Link
                      key={childLabel}
                      href={childHref}
                      aria-label={childLabel}
                      className={`nav-sublink${active === childId ? " active" : ""}`}
                    >
                      <ChildIcon aria-hidden />
                      <span>{childLabel}</span>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <Link href={href} aria-label={label} className={`nav-link ${active === id ? "active" : ""}`}>
                <Icon aria-hidden />
                <span>{label}</span>
              </Link>
            )}
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
          <Link className="button primary" href={`/courses/${raceSlug}`}><Flag />Voir l’étape</Link>
          <Link className="button" href="/classements"><Trophy />Championnat</Link>
        </div>
      </header>
      {children}
    </section>
  </AppShell>;
}
