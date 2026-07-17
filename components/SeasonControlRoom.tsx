"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Anchor,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flag,
  Gauge,
  ListOrdered,
  Map,
  Pause,
  Play,
  Settings,
  Thermometer,
  Trophy,
  Users,
  Waves,
  Wind,
} from "lucide-react";
import type { RaceView } from "@/lib/domain";
import { SEASON_RACES } from "@/lib/season-data";
import type { RaceWeatherSnapshot } from "@/lib/weather";
import { EventLocatorMap } from "./EventLocatorMap";

type Leader = { id: string; name: string; slug: string; points: number; color: string };

export function SeasonControlRoom({ race, leaders, weather }: { race: RaceView; leaders: Leader[]; weather: RaceWeatherSnapshot }) {
  const [selectedRaceId, setSelectedRaceId] = useState("trophee-golfe");
  const [isPlaying, setIsPlaying] = useState(true);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const selectedRace = useMemo(() => SEASON_RACES.find((item) => item.id === selectedRaceId) ?? SEASON_RACES[2], [selectedRaceId]);
  const selectedIndex = SEASON_RACES.findIndex((item) => item.id === selectedRace.id);

  useEffect(() => {
    if (!timelineScrollRef.current || window.innerWidth > 760) return;
    timelineScrollRef.current.scrollTo({ left: Math.max(0, selectedIndex * 178 - 95), behavior: "smooth" });
  }, [selectedIndex]);
  const selectedWeather = selectedRace.id === "trophee-golfe" ? {
    windKnots: weather.windKnots,
    windDirection: weather.windDirection,
    windLabel: weather.windLabel,
    gustKnots: weather.gustKnots,
    waveHeight: weather.waveHeight,
    seaTemperature: weather.seaTemperature,
    tideLabel: weather.tideLabel,
    source: weather.source,
  } : {
    windKnots: selectedRace.windKnots,
    windDirection: selectedRace.windDirection,
    windLabel: selectedRace.windLabel,
    gustKnots: selectedRace.gustKnots,
    waveHeight: selectedRace.waveHeight,
    seaTemperature: selectedRace.seaTemperature,
    tideLabel: selectedRace.tideLabel,
    source: "Aperçu saisonnier",
  };

  const selectOffset = (offset: number) => {
    const next = (selectedIndex + offset + SEASON_RACES.length) % SEASON_RACES.length;
    setSelectedRaceId(SEASON_RACES[next].id);
  };

  const nav = [
    { href: "/", label: "Saison", icon: Map, active: true },
    { href: `/courses/${race.slug}`, label: "Courses", icon: Flag },
    { href: "/classements", label: "Classements", icon: ListOrdered },
    { href: "/classements?vue=individuel", label: "Marins", icon: Users },
    { href: "/admin", label: "Admin", icon: Settings },
  ];

  return <main className="public-shell season-ocean-shell">
    <aside className="side-nav season-ocean-nav" aria-label="Navigation principale">
      <Link className="side-brand" href="/" aria-label="Accueil SailBoard"><span className="brand"><span>SailBoard</span><span>Race</span></span></Link>
      <nav className="nav-stack">{nav.map(({ href, label, icon: Icon, active }) => <Link key={label} href={href} className={`nav-link ${active ? "active" : ""}`}><Icon aria-hidden /><span>{label}</span></Link>)}</nav>
      <div className="season-nav-progress"><span>SAISON</span><strong className="mono">03<span>/06</span></strong><small>AVR. — OCT. 2026</small></div>
    </aside>

    <section className="season-ocean-stage">
      <div className="season-map-canvas">
        <EventLocatorMap races={SEASON_RACES} selectedRaceId={selectedRace.id} isPlaying={isPlaying} onSelect={setSelectedRaceId} />
        <div className="season-ocean-shade" />
        <div className="wind-field" aria-hidden>{Array.from({ length: 18 }, (_, index) => <i key={index} style={{ "--wind-index": index, "--wind-angle": `${selectedWeather.windDirection + 180}deg` } as React.CSSProperties} />)}</div>

        <header className="season-ocean-top">
          <div><span>Championnat 2026</span><strong>La saison en mouvement</strong></div>
          <div className="season-top-meta"><span className="status-dot status-dot--locked" /> <span>6 régates · Bretagne</span></div>
          <Link className="button primary season-primary-action" href={selectedRace.href ?? `/courses/${race.slug}`}><Flag />Explorer la course</Link>
        </header>

        <div className="season-map-index"><span>BRETAGNE</span><strong className="mono">47°55’ N</strong><small>05°06’ O — 01°58’ O</small></div>

        <section className="selected-race-dossier" aria-live="polite">
          <div className="selected-race-date"><span>{selectedRace.dateLabel}</span><small>2026</small></div>
          <div className="selected-race-title">
            <span>{selectedRace.locationName} · {selectedRace.status === "upcoming" ? "À VENIR" : "RÉSULTATS VALIDÉS"}</span>
            <h1>{selectedRace.name}</h1>
            <div><span>{selectedRace.distanceNm.toFixed(1)} NM</span><span>{selectedRace.winner ? `VAINQUEUR · ${selectedRace.winner}` : "ENGAGEMENTS OUVERTS"}</span></div>
          </div>
          <div className="route-playback-control">
            <button type="button" aria-label={isPlaying ? "Mettre l’animation en pause" : "Rejouer le parcours"} onClick={() => setIsPlaying((value) => !value)}>{isPlaying ? <Pause /> : <Play />}</button>
            <div><strong>{isPlaying ? "PARCOURS EN MOUVEMENT" : "REJOUER LE PARCOURS"}</strong><span><i className={isPlaying ? "playing" : ""} /></span><small>Animation illustrative · parcours officiel</small></div>
          </div>
        </section>

        <section className="race-day-weather" aria-label="Conditions météo du jour de la course">
          <div className="weather-heading"><span>Conditions du jour</span><strong>{selectedRace.dateLabel} · 15:00</strong><small>{selectedWeather.source}</small></div>
          <div className="weather-wind"><Wind /><span>Vent</span><strong className="mono">{selectedWeather.windKnots.toFixed(1)} ND</strong><small className="mono">{Math.round(selectedWeather.windDirection)}° {selectedWeather.windLabel}</small></div>
          <div><Gauge /><span>Rafales</span><strong className="mono">{Math.round(selectedWeather.gustKnots)} ND</strong></div>
          <div><Waves /><span>Mer</span><strong className="mono">{selectedWeather.waveHeight.toFixed(1)} M</strong></div>
          <div><Anchor /><span>Marée</span><strong className="mono">{selectedWeather.tideLabel}</strong></div>
          <div><Thermometer /><span>Eau</span><strong className="mono">{Math.round(selectedWeather.seaTemperature)}°C</strong></div>
        </section>
      </div>

      <section className="season-chronology" aria-label="Calendrier des courses 2026">
        <div className="season-timeline-head">
          <div><CalendarDays /><span>Calendrier 2026</span><strong>Une saison, six champs de course</strong></div>
          <div className="season-stepper"><button type="button" aria-label="Course précédente" onClick={() => selectOffset(-1)}><ChevronLeft /></button><span className="mono">{String(selectedIndex + 1).padStart(2, "0")} / {String(SEASON_RACES.length).padStart(2, "0")}</span><button type="button" aria-label="Course suivante" onClick={() => selectOffset(1)}><ChevronRight /></button></div>
        </div>
        <div className="season-timeline-scroll" ref={timelineScrollRef}>
          <div className="season-timeline-axis"><span>AVR.</span><span>MAI</span><span>JUIN</span><span>JUIL.</span><span>AOÛT</span><span>SEPT.</span><span>OCT.</span></div>
          <div className="season-timeline-line" />
          <div className="season-race-events">{SEASON_RACES.map((item, index) => <button type="button" key={item.id} aria-pressed={item.id === selectedRace.id} className={`season-race-event ${item.id === selectedRace.id ? "selected" : ""} ${item.status}`} onClick={() => setSelectedRaceId(item.id)}>
            <span className="season-event-marker"><i />{index + 1}</span>
            <span className="season-event-copy"><small>{item.dateLabel} · {item.locationName}</small><strong>{item.shortName}</strong><em>{item.winner ? `${item.winner} · ${item.result}` : item.result}</em></span>
          </button>)}</div>
        </div>
        <div className="championship-ribbon">
          <span><Trophy /> Championnat</span>
          {leaders.slice(0, 3).map((leader, index) => <Link key={leader.id} href={`/bateaux/${leader.slug}`} style={{ "--competitor-color": leader.color } as React.CSSProperties}><b>{index + 1}</b><i /><strong>{leader.name}</strong><small className="mono">{leader.points.toFixed(1)} PTS</small></Link>)}
          <Link href="/classements" className="championship-all">Tout le classement <ChevronRight /></Link>
        </div>
      </section>
    </section>
  </main>;
}
