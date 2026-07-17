"use client";

import Link from "next/link";
import { Flag, ListOrdered, Map, Settings, Trophy, Users } from "lucide-react";
import type { ReactNode } from "react";

type PublicSection = "map" | "course" | "rankings" | "sailors";

export function PublicCockpitShell({
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
  const nav = [
    { href: "/", label: "Carte", icon: Map, id: "map" },
    { href: `/courses/${raceSlug}`, label: "Course", icon: Flag, id: "course" },
    { href: "/classements", label: "Classements", icon: ListOrdered, id: "rankings" },
    { href: "/classements?vue=individuel", label: "Marins", icon: Users, id: "sailors" },
    { href: "/admin", label: "Admin", icon: Settings, id: "admin" },
  ];

  return <main className="public-shell control-shell">
    <aside className="side-nav" aria-label="Navigation principale">
      <Link className="side-brand" href="/" aria-label="Accueil SailBoard"><span className="brand"><span>SailBoard</span><span>Race</span></span></Link>
      <nav className="nav-stack">
        {nav.map(({ href, label, icon: Icon, id }) => <Link key={label} href={href} aria-label={label} className={`nav-link ${active === id ? "active" : ""}`}><Icon aria-hidden /><span>{label}</span></Link>)}
      </nav>
      <div className="nav-season"><strong>{eventName}</strong><small>17 JUIL. 2026</small></div>
    </aside>

    <section className="control-stage">
      <header className="control-topbar">
        <div className="control-heading"><span>{eyebrow}</span><h1>{title}</h1></div>
        <div className="control-status"><span className="status-dot status-dot--locked" /><span>Résultats officiels</span><strong className="mono">DATA · V1</strong></div>
        <div className="top-actions">
          <Link className="button primary" href={`/courses/${raceSlug}`}><Flag />Voir la course</Link>
          <Link className="button" href="/classements"><Trophy />Championnat</Link>
        </div>
      </header>
      {children}
    </section>
  </main>;
}
