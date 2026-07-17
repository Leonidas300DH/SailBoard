"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, CircleGauge, Flag, ListOrdered, Map, PanelRightClose, Settings, ShieldCheck, Trophy, Users } from "lucide-react";
import type { RaceView } from "@/lib/domain";
import { RaceMap } from "./RaceMap";

function formatTime(seconds: number | null) {
  if (seconds == null) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hours, minutes, secs].map((value) => String(value).padStart(2, "0")).join(":");
}

export function RaceExperience({ race, context = "map" }: { race: RaceView; context?: "map" | "course" }) {
  const nav = [
    { href: "/", label: "Carte", icon: Map, id: "map" },
    { href: `/courses/${race.slug}`, label: "Course", icon: Flag, id: "course" },
    { href: "/classements", label: "Classements", icon: ListOrdered, id: "rankings" },
    { href: "/classements?vue=individuel", label: "Marins", icon: Users, id: "sailors" },
    { href: "/admin", label: "Admin", icon: Settings, id: "admin" },
  ];
  const [selectedEntryId, setSelectedEntryId] = useState(race.leaderboard[1]?.entryId ?? race.leaderboard[0]?.entryId);
  const [isRailExpanded, setIsRailExpanded] = useState(false);
  const selected = useMemo(() => race.leaderboard.find((row) => row.entryId === selectedEntryId) ?? race.leaderboard[0], [race.leaderboard, selectedEntryId]);
  const leader = race.leaderboard[0];
  const gap = selected && leader && selected.elapsedSeconds && leader.elapsedSeconds ? selected.elapsedSeconds - leader.elapsedSeconds : 0;
  const openRail = (entryId: string) => {
    setSelectedEntryId(entryId);
    setIsRailExpanded(true);
    if (window.matchMedia("(max-width: 760px)").matches) {
      window.setTimeout(() => document.getElementById("selected-boat-rail")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
  };

  return (
    <main className="public-shell">
      <aside className="side-nav" aria-label="Navigation principale">
        <Link className="side-brand" href="/" aria-label="Accueil SailBoard"><span className="brand"><span>SailBoard</span><span>Race</span></span></Link>
        <nav className="nav-stack">
          {nav.map(({ href, label, icon: Icon, id }) => <Link key={label} href={href} aria-label={label} className={`nav-link ${context === id ? "active" : ""}`}><Icon aria-hidden /><span>{label}</span></Link>)}
        </nav>
        <div className="nav-season"><strong>{race.eventName}</strong><small>17 JUIL. 2026</small></div>
      </aside>

      <section className="race-stage">
        <header className="race-topbar">
          <div className="status-block"><span className="status-dot" /><span>Course terminée · {race.name}</span></div>
          <div className="status-block"><Flag size={17} /><span>{race.distanceNm.toFixed(1)} NM · {race.laps} tour</span></div>
          <div className="top-actions">
            <Link className="button primary" href={context === "course" ? "/" : `/courses/${race.slug}`}><CircleGauge />{context === "course" ? "Retour carte" : "Détail course"}</Link>
            <Link className="button" href="/classements"><Trophy />Classements</Link>
          </div>
        </header>

        <div className={`race-main ${isRailExpanded ? "rail-expanded" : ""}`}>
          <div className="map-wrap">
            <RaceMap center={race.center} geojson={race.courseGeoJson} />
            <div className="map-shade" />
            <div className="map-caption"><span className="map-chip">Parcours officiel v1</span><span className="map-chip">{race.locationName}</span></div>
          </div>

          <aside className={`leaderboard ${isRailExpanded ? "expanded" : ""}`}>
            <div className="leaderboard-core">
              <div className="panel-title"><span>Classement</span><span className="mono acid">6 / 6</span></div>
              <div className="rank-head"><span>Pos</span><span>Bateau / équipage</span><span>Points</span><span /></div>
              <div className="rank-list">{race.leaderboard.map((row) => <button type="button" key={row.entryId} aria-expanded={isRailExpanded && row.entryId === selected?.entryId} aria-controls="selected-boat-rail" className={`rank-row ${row.entryId === selected?.entryId ? "selected" : ""}`} style={{ "--boat-color": row.color } as React.CSSProperties} onClick={() => openRail(row.entryId)}>
                <span className="rank-number">{row.position ?? "—"}</span><span className="rank-boat"><strong>{row.boatName}</strong><small>{row.crew.map((member) => member.name.split(" ").at(-1)).join(" · ")}</small></span><span className="rank-points">{row.points.toFixed(1)}</span><ChevronLeft className="rank-expand-icon" aria-hidden />
              </button>)}</div>
              <div className="leader-foot"><strong><ShieldCheck size={15} /> Résultats validés</strong><span>Barème championnat 2026 · version 1</span></div>
            </div>

            {selected ? <section id="selected-boat-rail" className="leaderboard-detail" aria-label={`Détails de ${selected.boatName}`} style={{ "--boat-color": selected.color } as React.CSSProperties}>
              <div className="rail-detail-head"><span>Dossier concurrent</span><button type="button" onClick={() => setIsRailExpanded(false)} aria-label="Replier les détails"><PanelRightClose /></button></div>
              <div className="rail-boat-identity"><span>{selected.position ?? "—"}<sup>e</sup></span><div><strong>{selected.boatName}</strong><small className="mono">{selected.sailNumber}</small></div></div>
              <div className="rail-crew-summary">{selected.crew.map((member) => member.name).join(" · ")}</div>
              <div className="rail-metrics">
                <div><span>Temps</span><strong className="mono">{formatTime(selected.elapsedSeconds)}</strong></div>
                <div><span>Écart 1er</span><strong className="mono">{gap ? `+${formatTime(gap)}` : "—"}</strong></div>
                <div><span>Points bateau</span><strong className="mono">{selected.points.toFixed(1)}</strong></div>
              </div>
              <div className="rail-crew-points"><span className="rail-section-label">Attribution individuelle</span>{selected.crew.map((member) => <Link key={member.id} href={`/participants/${member.slug}`}><span><strong>{member.name}</strong><small>{member.role}</small></span><span className="mono">{(member.points ?? selected.points).toFixed(1)} PTS</span></Link>)}</div>
              <Link className="rail-profile-link" href={`/bateaux/${selected.boatSlug}`}>Ouvrir la fiche bateau <ChevronLeft /></Link>
            </section> : null}
          </aside>
        </div>

        <footer className="race-timeline">
          <div className="timeline-label"><strong>Départ</strong><small>13:00:00</small></div>
          <div className="timeline-track"><div className="timeline-line" />
            {race.leaderboard.map((row, index) => <span key={row.entryId} className="timeline-event" data-label={row.boatName} style={{ "--event-x": `${12 + index * 15}%`, "--event-color": row.color } as React.CSSProperties} />)}
          </div>
          <div className="timeline-total"><span className="label">Meilleur temps</span><strong>{formatTime(leader?.elapsedSeconds ?? null)}</strong></div>
        </footer>
      </section>
    </main>
  );
}
