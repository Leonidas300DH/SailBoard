"use client";

import Link from "next/link";
import { Anchor, ChevronRight, CloudOff, Gauge, Pause, Play, Thermometer, Waves, Wind, X } from "lucide-react";
import type { SeasonRace } from "@/lib/season-data";
import type { StagePodiumEntry } from "@/lib/wdt-profiles";
import type { RaceWeatherSnapshot } from "@/lib/weather";

const RELIABILITY_LABELS: Record<RaceWeatherSnapshot["reliability"], string> = {
  archive: "Archive ERA5",
  forecast: "Prévision",
  fallback: "Reconstitution",
};

/**
 * Floating race HUD — appears only when a stage is picked on the map,
 * timeline or roadbook. Carries the identity, the real conditions and the
 * one action that goes deeper: opening the race page.
 */
export function RaceHud({
  race,
  index,
  podium = [],
  weather,
  isPlaying,
  isToday = false,
  onTogglePlay,
  onClose,
}: {
  race: SeasonRace;
  index: number;
  podium?: StagePodiumEntry[];
  weather: RaceWeatherSnapshot | null;
  isPlaying: boolean;
  isToday?: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
}) {
  const status = isToday
    ? "Jour d’étape"
    : race.winner
      ? `Vainqueur · ${race.winner}`
      : race.status === "upcoming" ? "Engagements ouverts" : race.result ?? "Résultats validés";

  return <section className="race-hud" aria-live="polite">
    <header className="race-hud-head">
      <i className="race-hud-hex">{index + 1}</i>
      <div className="race-hud-id">
        <span>Étape {index + 1} · {race.dateLabel} 2026</span>
        <strong>{race.name}</strong>
        <small>
          {race.locationName} · {isToday ? <em className="race-dossier-live">{status}</em> : status}
          {race.route ? null : " · Tracé non publié"}
        </small>
      </div>
      <button type="button" className="race-hud-close" aria-label="Refermer la fiche" onClick={onClose}><X /></button>
    </header>

    {podium.length > 0 ? (
      <div className="race-hud-podium" aria-label="Premiers de l’étape">
        {podium.map((entry) => (
          <Link key={entry.slug} href={`/bateaux/${entry.slug}`} className="race-hud-podium-row">
            <b className="mono">{entry.place}</b>
            <span>{entry.name}</span>
          </Link>
        ))}
      </div>
    ) : null}

    {weather ? (
      <div className="race-hud-weather" aria-label="Conditions météo du jour de l’étape">
        <span title="Vent"><Wind aria-hidden /><strong className="mono">{weather.windKnots.toFixed(1)} ND · {Math.round(weather.windDirection)}°</strong></span>
        <span title="Rafales"><Gauge aria-hidden /><strong className="mono">{Math.round(weather.gustKnots)} ND</strong></span>
        <span title="Mer"><Waves aria-hidden /><strong className="mono">{weather.waveHeight.toFixed(1)} M</strong></span>
        <span title="Marée"><Anchor aria-hidden /><strong className="mono">{weather.tideLabel}</strong></span>
        <span title="Eau"><Thermometer aria-hidden /><strong className="mono">{Math.round(weather.seaTemperature)}°C</strong></span>
        <em className={`weather-badge weather-badge--${weather.reliability}`} title={weather.source}>
          {RELIABILITY_LABELS[weather.reliability]}
        </em>
      </div>
    ) : (
      <div className="race-hud-weather race-hud-weather--pending">
        <span><CloudOff aria-hidden /><small>Conditions réelles à J-15</small></span>
      </div>
    )}

    <footer className="race-hud-actions">
      {race.route ? (
        <button
          type="button"
          className="race-hud-play"
          aria-label={isPlaying ? "Mettre l’animation du parcours en pause" : "Rejouer le parcours"}
          onClick={onTogglePlay}
        >
          {isPlaying ? <Pause aria-hidden /> : <Play aria-hidden />}
        </button>
      ) : null}
      <Link className="button primary race-hud-open" href={`/courses/${race.slug}`}>
        Explorer l’étape
        <ChevronRight aria-hidden />
      </Link>
    </footer>
  </section>;
}
