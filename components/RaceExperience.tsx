"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CircleGauge, Flag, ListOrdered, Map, Sailboat, Settings, ShieldCheck, Trophy, Users } from "lucide-react";
import type { RaceView } from "@/lib/domain";
import { RaceMap } from "./RaceMap";

function formatTime(seconds: number | null) {
  if (seconds == null) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hours, minutes, secs].map((value) => String(value).padStart(2, "0")).join(":");
}

const nav = [
  { href: "/", label: "Carte", icon: Map },
  { href: "/classements", label: "Classements", icon: ListOrdered },
  { href: "/classements?vue=bateaux", label: "Bateaux", icon: Sailboat },
  { href: "/classements?vue=individuel", label: "Équipages", icon: Users },
  { href: "/admin", label: "Admin", icon: Settings },
];

export function RaceExperience({ race }: { race: RaceView }) {
  const [selectedEntryId, setSelectedEntryId] = useState(race.leaderboard[1]?.entryId ?? race.leaderboard[0]?.entryId);
  const selected = useMemo(() => race.leaderboard.find((row) => row.entryId === selectedEntryId) ?? race.leaderboard[0], [race.leaderboard, selectedEntryId]);
  const leader = race.leaderboard[0];
  const gap = selected && leader && selected.elapsedSeconds && leader.elapsedSeconds ? selected.elapsedSeconds - leader.elapsedSeconds : 0;

  return (
    <main className="public-shell">
      <aside className="side-nav" aria-label="Navigation principale">
        <Link className="side-brand" href="/" aria-label="Accueil SailBoard"><span className="brand"><span>SailBoard</span><span>Race</span></span></Link>
        <nav className="nav-stack">
          {nav.map(({ href, label, icon: Icon }, index) => <Link key={label} href={href} aria-label={label} className={`nav-link ${index === 0 ? "active" : ""}`}><Icon aria-hidden /><span>{label}</span></Link>)}
        </nav>
        <div className="nav-season"><strong>{race.eventName}</strong><small>17 JUIL. 2026</small></div>
      </aside>

      <section className="race-stage">
        <header className="race-topbar">
          <div className="status-block"><span className="status-dot" /><span>Course terminée · {race.name}</span></div>
          <div className="status-block"><Flag size={17} /><span>{race.distanceNm.toFixed(1)} NM · {race.laps} tour</span></div>
          <div className="top-actions">
            <Link className="button primary" href={`/courses/${race.slug}`}><CircleGauge />Détail course</Link>
            <Link className="button" href="/classements"><Trophy />Classements</Link>
          </div>
        </header>

        <div className="race-main">
          <div className="map-wrap">
            <RaceMap center={race.center} geojson={race.courseGeoJson} />
            <div className="map-shade" />
            <div className="map-caption"><span className="map-chip">Parcours officiel v1</span><span className="map-chip">{race.locationName}</span></div>
            {selected ? <article className="boat-detail" style={{ "--selected-color": selected.color } as React.CSSProperties}>
              <div className="boat-detail-head"><span className="boat-position">{selected.position ?? "—"}<sup>e</sup></span><span className="boat-name">{selected.boatName}</span><div className="boat-crew">{selected.crew.map((member) => member.name).join(" · ")}</div></div>
              <div className="boat-metrics">
                <div className="boat-metric"><span className="label">Temps</span><strong className="mono">{formatTime(selected.elapsedSeconds)}</strong></div>
                <div className="boat-metric"><span className="label">Écart 1er</span><strong className="mono">{gap ? `+${formatTime(gap)}` : "—"}</strong></div>
                <div className="boat-metric"><span className="label">Points bateau</span><strong className="mono">{selected.points.toFixed(1)}</strong></div>
              </div>
              <div className="crew-points">{selected.crew.map((member) => <div key={member.id} className="crew-point-row"><span>{member.name} · {member.role}</span><span>{(member.points ?? selected.points).toFixed(1)} PTS</span></div>)}</div>
            </article> : null}
          </div>

          <aside className="leaderboard">
            <div className="panel-title"><span>Classement</span><span className="mono acid">6 / 6</span></div>
            <div className="rank-head"><span>Pos</span><span>Bateau / équipage</span><span>Points</span></div>
            <div className="rank-list">{race.leaderboard.map((row) => <button type="button" key={row.entryId} className={`rank-row ${row.entryId === selected?.entryId ? "selected" : ""}`} style={{ "--boat-color": row.color } as React.CSSProperties} onClick={() => setSelectedEntryId(row.entryId)}>
              <span className="rank-number">{row.position ?? "—"}</span><span className="rank-boat"><strong>{row.boatName}</strong><small>{row.crew.map((member) => member.name.split(" ").at(-1)).join(" · ")}</small></span><span className="rank-points">{row.points.toFixed(1)}</span>
            </button>)}</div>
            <div className="leader-foot"><strong><ShieldCheck size={15} /> Résultats validés</strong><span>Barème championnat 2026 · version 1</span></div>
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
