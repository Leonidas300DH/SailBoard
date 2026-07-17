"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  Flag,
  Gauge,
  ListOrdered,
  Map,
  PanelRightClose,
  Pause,
  Play,
  Settings,
  ShieldCheck,
  Thermometer,
  Users,
  Waves,
  Wind,
} from "lucide-react";
import type { RaceView } from "@/lib/domain";
import type { RaceWeatherSnapshot } from "@/lib/weather";
import { RaceMap } from "./RaceMap";

function formatTime(seconds: number | null) {
  if (seconds == null) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return [hours, minutes, secs].map((value) => String(value).padStart(2, "0")).join(":");
}

export function RaceExperience({ race, weather, context = "map" }: { race: RaceView; weather: RaceWeatherSnapshot; context?: "map" | "course" }) {
  const nav = [
    { href: "/", label: "Saison", icon: Map, id: "map" },
    { href: `/courses/${race.slug}`, label: "Course", icon: Flag, id: "course" },
    { href: "/classements", label: "Classements", icon: ListOrdered, id: "rankings" },
    { href: "/classements?vue=individuel", label: "Marins", icon: Users, id: "sailors" },
    { href: "/admin", label: "Admin", icon: Settings, id: "admin" },
  ];
  const [selectedEntryId, setSelectedEntryId] = useState(race.leaderboard[1]?.entryId ?? race.leaderboard[0]?.entryId);
  const [isRailExpanded, setIsRailExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [replayProgress, setReplayProgress] = useState(.68);
  const selected = useMemo(() => race.leaderboard.find((row) => row.entryId === selectedEntryId) ?? race.leaderboard[0], [race.leaderboard, selectedEntryId]);
  const leader = race.leaderboard[0];
  const gap = selected && leader && selected.elapsedSeconds && leader.elapsedSeconds ? selected.elapsedSeconds - leader.elapsedSeconds : 0;
  const bestTime = leader?.elapsedSeconds ?? 7_200;
  const replaySeconds = Math.round(bestTime * replayProgress);

  useEffect(() => {
    if (!isPlaying) return;
    let frame = 0;
    let previous = performance.now();
    const animate = (now: number) => {
      const delta = now - previous;
      previous = now;
      setReplayProgress((value) => (value + delta / 24_000) % 1);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying]);

  const openRail = (entryId: string) => {
    setSelectedEntryId(entryId);
    setIsRailExpanded(true);
    if (window.matchMedia("(max-width: 760px)").matches) window.setTimeout(() => document.getElementById("selected-boat-rail")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  return <main className="public-shell">
    <aside className="side-nav" aria-label="Navigation principale">
      <Link className="side-brand" href="/" aria-label="Accueil SailBoard"><span className="brand"><span>SailBoard</span><span>Race</span></span></Link>
      <nav className="nav-stack">{nav.map(({ href, label, icon: Icon, id }) => <Link key={label} href={href} aria-label={label} className={`nav-link ${context === id ? "active" : ""}`}><Icon aria-hidden /><span>{label}</span></Link>)}</nav>
      <div className="nav-season"><strong>{race.eventName}</strong><small>17 JUIL. 2026</small></div>
    </aside>

    <section className="race-stage immersive-replay-stage">
      <div className={`race-main ${isRailExpanded ? "rail-expanded" : ""}`}>
        <div className="map-wrap">
          <RaceMap center={race.center} geojson={race.courseGeoJson} progress={replayProgress} leaderboard={race.leaderboard} selectedEntryId={selectedEntryId} />
          <div className="map-shade" />
          <div className="race-wind-field" aria-hidden>{Array.from({ length: 15 }, (_, index) => <i key={index} style={{ "--wind-index": index, "--wind-angle": `${weather.windDirection + 180}deg` } as React.CSSProperties} />)}</div>
          <div className="map-caption" aria-label="Contexte de la course">
            <span className="map-chip map-chip-status"><span className="status-dot" />Replay · {formatTime(replaySeconds)}</span>
            <span className="map-chip map-chip-metric"><Wind aria-hidden />{weather.windKnots.toFixed(1)} ND · {Math.round(weather.windDirection)}° {weather.windLabel}</span>
            <span className="map-chip map-chip-meta">{race.locationName} · parcours officiel</span>
          </div>
          <Link className="map-return" href="/"><ArrowLeft aria-hidden />Saison 2026</Link>

          <section className="race-conditions-overlay" aria-label="Conditions météo de la course">
            <div><span>Conditions du jour</span><strong>{weather.observedAt}</strong><small>{weather.source}</small></div>
            <div><Gauge /><span>Rafales</span><strong className="mono">{weather.gustKnots.toFixed(0)} ND</strong></div>
            <div><Waves /><span>Houle</span><strong className="mono">{weather.waveHeight.toFixed(1)} M · {weather.wavePeriod.toFixed(1)} S</strong></div>
            <div><Thermometer /><span>Eau</span><strong className="mono">{weather.seaTemperature.toFixed(0)}°C</strong></div>
          </section>
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
            <div className="rail-metrics"><div><span>Temps</span><strong className="mono">{formatTime(selected.elapsedSeconds)}</strong></div><div><span>Écart 1er</span><strong className="mono">{gap ? `+${formatTime(gap)}` : "—"}</strong></div><div><span>Points bateau</span><strong className="mono">{selected.points.toFixed(1)}</strong></div></div>
            <div className="rail-crew-points"><span className="rail-section-label">Attribution individuelle</span>{selected.crew.map((member) => <Link key={member.id} href={`/participants/${member.slug}`}><span><strong>{member.name}</strong><small>{member.role}</small></span><span className="mono">{(member.points ?? selected.points).toFixed(1)} PTS</span></Link>)}</div>
            <Link className="rail-profile-link" href={`/bateaux/${selected.boatSlug}`}>Ouvrir la fiche bateau <ChevronLeft /></Link>
          </section> : null}
        </aside>
      </div>

      <footer className="race-timeline replay-timeline">
        <div className="replay-transport"><button type="button" onClick={() => setIsPlaying((value) => !value)} aria-label={isPlaying ? "Mettre le replay en pause" : "Lire le replay"}>{isPlaying ? <Pause /> : <Play />}</button><div><span>Replay du parcours</span><strong className="mono">{formatTime(replaySeconds)}</strong></div></div>
        <div className="replay-scrubber">
          <div className="replay-event-labels"><span style={{ left: "18%" }}>Départ</span><span style={{ left: "43%" }}>Marque 1</span><span style={{ left: "67%" }}>Dépassement</span><span style={{ left: "88%" }}>Dernier bord</span></div>
          <input type="range" min="0" max="1000" value={Math.round(replayProgress * 1000)} aria-label="Position dans le replay" onChange={(event) => { setReplayProgress(Number(event.target.value) / 1000); setIsPlaying(false); }} style={{ "--replay-progress": `${replayProgress * 100}%` } as React.CSSProperties} />
          <div className="replay-ticks">{Array.from({ length: 17 }, (_, index) => <i key={index} />)}</div>
        </div>
        <div className="timeline-total"><span className="label">Temps vainqueur</span><strong>{formatTime(leader?.elapsedSeconds ?? null)}</strong><small>Animation illustrative, sans trace GPS</small></div>
      </footer>
    </section>
  </main>;
}
