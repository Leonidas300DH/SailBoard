"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { Anchor, ChevronRight, CloudOff, Gauge, Thermometer, Waves, Wind, X } from "lucide-react";
import type { SeasonRace } from "@/lib/season-data";
import type { StagePodiumEntry } from "@/lib/wdt-profiles";
import type { RaceWeatherSnapshot } from "@/lib/weather";
import { CountUpNumber } from "../map/CountUpNumber";
import { DecodeText } from "../map/DecodeText";

/**
 * Floating race HUD — appears only when a stage is picked on the map,
 * map or timeline. Carries the identity, the real conditions and the
 * one action that goes deeper: opening the race page.
 */
export function RaceHud({
  race,
  index,
  podium = [],
  weather,
  isToday = false,
  onClose,
}: {
  race: SeasonRace;
  index: number;
  podium?: StagePodiumEntry[];
  weather: RaceWeatherSnapshot | null;
  isToday?: boolean;
  onClose: () => void;
}) {
  const status = isToday
    ? "Jour d’étape"
    : race.winner
      ? `Vainqueur · ${race.winner}`
      : race.status === "upcoming" ? "Engagements ouverts" : race.result ?? "Résultats validés";

  return <section className="race-hud" aria-live="polite">
    <header className="race-hud-head">
      <i className="race-hud-hex"><CountUpNumber value={index + 1} duration={480} delay={240} /></i>
      <div className="race-hud-id">
        <span><DecodeText text={`Étape ${index + 1} · ${race.dateLabel} 2026`} speed={16} delay={180} /></span>
        <strong><DecodeText text={race.name} speed={20} delay={320} /></strong>
        <small>
          <DecodeText text={`${race.locationName} · `} speed={14} delay={520} />
          {isToday
            ? <em className="race-dossier-live"><DecodeText text={status} speed={14} delay={620} /></em>
            : <DecodeText text={status} speed={14} delay={620} />}
        </small>
      </div>
      <button type="button" className="race-hud-close" aria-label="Refermer la fiche" onClick={onClose}><X /></button>
    </header>

    {podium.length > 0 ? (
      <div className="race-hud-podium" aria-label="Premiers de l’étape">
        {podium.map((entry, podiumIndex) => (
          <Link
            key={entry.slug}
            href={`/classements?vue=bateaux&selection=${entry.slug}`}
            className="race-hud-podium-row"
            style={{ "--hud-row": podiumIndex } as CSSProperties}
          >
            <b className="mono"><CountUpNumber value={entry.place} duration={520} delay={620 + podiumIndex * 90} /></b>
            <span><DecodeText text={entry.name} speed={16} delay={660 + podiumIndex * 90} /></span>
          </Link>
        ))}
      </div>
    ) : null}

    {weather ? (
      <div className="race-hud-weather" aria-label="Conditions météo du jour de l’étape">
        <span tabIndex={0} data-tooltip="Vent moyen : vitesse en nœuds et direction en degrés." aria-label={`Vent moyen : ${weather.windKnots.toFixed(1)} nœuds, direction ${Math.round(weather.windDirection)} degrés.`}><Wind aria-hidden /><strong className="mono"><CountUpNumber value={weather.windKnots} decimals={1} delay={820} /> ND · <CountUpNumber value={Math.round(weather.windDirection)} delay={860} />°</strong></span>
        <span tabIndex={0} data-tooltip="Rafales : vitesse maximale du vent, en nœuds." aria-label={`Rafales : ${Math.round(weather.gustKnots)} nœuds.`}><Gauge aria-hidden /><strong className="mono"><CountUpNumber value={Math.round(weather.gustKnots)} delay={900} /> ND</strong></span>
        <span tabIndex={0} data-tooltip="Mer : hauteur significative des vagues, en mètres." aria-label={`Mer : vagues de ${weather.waveHeight.toFixed(1)} mètre.`}><Waves aria-hidden /><strong className="mono"><CountUpNumber value={weather.waveHeight} decimals={1} delay={960} /> M</strong></span>
        <span tabIndex={0} data-tooltip="Marée : état et horaire de la prochaine basse ou pleine mer." aria-label={`Marée : ${weather.tideLabel}.`}><Anchor aria-hidden /><strong className="mono"><DecodeText text={weather.tideLabel} speed={22} delay={980} /></strong></span>
        <span tabIndex={0} data-tooltip="Eau : température de la mer, en degrés Celsius." aria-label={`Température de l’eau : ${Math.round(weather.seaTemperature)} degrés Celsius.`}><Thermometer aria-hidden /><strong className="mono"><CountUpNumber value={Math.round(weather.seaTemperature)} delay={1020} />°C</strong></span>
      </div>
    ) : (
      <div className="race-hud-weather race-hud-weather--pending">
        <span><CloudOff aria-hidden /><small>Conditions réelles à J-15</small></span>
      </div>
    )}

    <footer className="race-hud-actions">
      <Link className="button primary race-hud-open" href={`/courses/${race.slug}`}>
        <DecodeText text="Explorer l’étape" speed={18} delay={1080} />
        <ChevronRight aria-hidden />
      </Link>
    </footer>
  </section>;
}
