"use client";

import { Anchor, CloudOff, Gauge, Pause, Play, Thermometer, Waves, Wind } from "lucide-react";
import type { SeasonRace } from "@/lib/season-data";
import type { RaceWeatherSnapshot } from "@/lib/weather";

const RELIABILITY_LABELS: Record<RaceWeatherSnapshot["reliability"], string> = {
  archive: "Archive ERA5",
  forecast: "Prévision",
  fallback: "Reconstitution",
};

/**
 * Compact mission card for the selected race: identity, playback control and
 * a single-row weather strip fed by real archive/forecast data.
 */
export function RaceDossier({
  race,
  weather,
  isPlaying,
  onTogglePlay,
}: {
  race: SeasonRace;
  weather: RaceWeatherSnapshot | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
}) {
  return <section className="race-dossier" aria-live="polite">
    <header className="race-dossier-head">
      <div className="race-dossier-date">
        <strong>{race.dateLabel}</strong>
        <small className="mono">2026</small>
      </div>
      <div className="race-dossier-identity">
        <span>{race.locationName} · {race.status === "upcoming" ? "À venir" : "Résultats validés"}</span>
        <h1>{race.name}</h1>
        <div className="race-dossier-meta mono">
          <span>{race.distanceNm.toFixed(1)} NM</span>
          <span>{race.winner ? `Vainqueur · ${race.winner}` : "Engagements ouverts"}</span>
        </div>
      </div>
      <button
        type="button"
        className={`race-dossier-play${isPlaying ? " playing" : ""}`}
        aria-label={isPlaying ? "Mettre l’animation du parcours en pause" : "Rejouer le parcours"}
        onClick={onTogglePlay}
      >
        {isPlaying ? <Pause aria-hidden /> : <Play aria-hidden />}
      </button>
    </header>
    {weather ? (
      <div className="race-dossier-weather" aria-label="Conditions météo du jour de la course">
        <span className="race-dossier-weather-cell">
          <Wind aria-hidden />
          <strong className="mono">{weather.windKnots.toFixed(1)} ND</strong>
          <small className="mono">{Math.round(weather.windDirection)}° {weather.windLabel}</small>
        </span>
        <span className="race-dossier-weather-cell">
          <Gauge aria-hidden />
          <strong className="mono">{Math.round(weather.gustKnots)} ND</strong>
          <small>Rafales</small>
        </span>
        <span className="race-dossier-weather-cell">
          <Waves aria-hidden />
          <strong className="mono">{weather.waveHeight.toFixed(1)} M</strong>
          <small>Mer</small>
        </span>
        <span className="race-dossier-weather-cell">
          <Anchor aria-hidden />
          <strong className="mono">{weather.tideLabel}</strong>
          <small>Marée</small>
        </span>
        <span className="race-dossier-weather-cell">
          <Thermometer aria-hidden />
          <strong className="mono">{Math.round(weather.seaTemperature)}°C</strong>
          <small>Eau</small>
        </span>
        <small className="race-dossier-source">
          <em className={`weather-badge weather-badge--${weather.reliability}`}>{RELIABILITY_LABELS[weather.reliability]}</em>
          {weather.source}
        </small>
      </div>
    ) : (
      <div className="race-dossier-weather race-dossier-weather--pending" aria-label="Conditions météo indisponibles">
        <span className="race-dossier-weather-cell">
          <CloudOff aria-hidden />
          <small>Conditions réelles publiées à l’approche de la course · prévision à J-15</small>
        </span>
      </div>
    )}
  </section>;
}
