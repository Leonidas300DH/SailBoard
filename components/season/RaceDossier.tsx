"use client";

import Link from "next/link";
import { Anchor, ChevronRight, CloudOff, Gauge, Pause, Play, Thermometer, Waves, Wind } from "lucide-react";
import type { SeasonRace } from "@/lib/season-data";
import type { RaceWeatherSnapshot } from "@/lib/weather";

const RELIABILITY_LABELS: Record<RaceWeatherSnapshot["reliability"], string> = {
  archive: "Archive ERA5",
  forecast: "Prévision",
  fallback: "Reconstitution",
};

/**
 * Broadcast lower-third for the selected race: one slim bar — playback,
 * identity, real conditions. The map stays the hero.
 */
export function RaceDossier({
  race,
  weather,
  isPlaying,
  isToday = false,
  onTogglePlay,
}: {
  race: SeasonRace;
  weather: RaceWeatherSnapshot | null;
  isPlaying: boolean;
  isToday?: boolean;
  onTogglePlay: () => void;
}) {
  const status = isToday
    ? "Jour de course"
    : race.winner
      ? `Vainqueur · ${race.winner}`
      : race.status === "upcoming" ? "Engagements ouverts" : "Résultats validés";

  return <section className="race-dossier" aria-live="polite">
    <button
      type="button"
      className="race-dossier-play"
      aria-label={isPlaying ? "Mettre l’animation du parcours en pause" : "Rejouer le parcours"}
      onClick={onTogglePlay}
    >
      {isPlaying ? <Pause aria-hidden /> : <Play aria-hidden />}
    </button>
    <div className="race-dossier-id">
      <Link className="race-dossier-title" href={`/courses/${race.slug}`} title={`Ouvrir ${race.name}`}>
        {race.name}
        <ChevronRight aria-hidden />
      </Link>
      <small>
        {race.dateLabel} 2026 · {race.locationName} · <span className="mono">{race.distanceNm.toFixed(1)} NM</span> · {isToday
          ? <span className="race-dossier-live">{status}</span>
          : status}
      </small>
    </div>
    {weather ? (
      <div className="race-dossier-weather" aria-label="Conditions météo du jour de la course">
        <span className="race-dossier-weather-cell" title="Vent">
          <Wind aria-hidden />
          <strong className="mono">{weather.windKnots.toFixed(1)} ND · {Math.round(weather.windDirection)}° {weather.windLabel}</strong>
        </span>
        <span className="race-dossier-weather-cell" title="Rafales">
          <Gauge aria-hidden />
          <strong className="mono">{Math.round(weather.gustKnots)} ND</strong>
        </span>
        <span className="race-dossier-weather-cell" title="Hauteur de mer">
          <Waves aria-hidden />
          <strong className="mono">{weather.waveHeight.toFixed(1)} M</strong>
        </span>
        <span className="race-dossier-weather-cell" title="Marée">
          <Anchor aria-hidden />
          <strong className="mono">{weather.tideLabel}</strong>
        </span>
        <span className="race-dossier-weather-cell" title="Température de l’eau">
          <Thermometer aria-hidden />
          <strong className="mono">{Math.round(weather.seaTemperature)}°C</strong>
        </span>
        <em className={`weather-badge weather-badge--${weather.reliability}`} title={weather.source}>
          {RELIABILITY_LABELS[weather.reliability]}
        </em>
      </div>
    ) : (
      <div className="race-dossier-weather race-dossier-weather--pending">
        <span className="race-dossier-weather-cell">
          <CloudOff aria-hidden />
          <small>Conditions réelles à J-15</small>
        </span>
      </div>
    )}
  </section>;
}
