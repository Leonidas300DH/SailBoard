"use client";

import { CloudOff, Gauge, Thermometer, Waves } from "lucide-react";
import type { RaceWeatherSnapshot } from "@/lib/weather";

export function RaceConditions({ weather, pending = false }: { weather: RaceWeatherSnapshot; pending?: boolean }) {
  if (pending) {
    return <section className="race-conditions-overlay race-conditions-overlay--pending" aria-label="Conditions météo de l’étape">
      <div>
        <span>Conditions du jour</span>
        <strong>À venir</strong>
        <small>Prévisions réelles publiées à J-15 · archive après l’étape</small>
      </div>
      <div><CloudOff /><span>Modèles</span><strong className="mono">HORS PORTÉE</strong></div>
    </section>;
  }
  return <section className="race-conditions-overlay" aria-label="Conditions météo de l’étape">
    <div>
      <span>Conditions du jour</span>
      <strong>{weather.observedAt}</strong>
      <small>{weather.source}</small>
    </div>
    <div><Gauge /><span>Rafales</span><strong className="mono">{weather.gustKnots.toFixed(0)} ND</strong></div>
    <div><Waves /><span>Houle</span><strong className="mono">{weather.waveHeight.toFixed(1)} M · {weather.wavePeriod.toFixed(1)} S</strong></div>
    <div><Thermometer /><span>Eau</span><strong className="mono">{weather.seaTemperature.toFixed(0)}°C</strong></div>
  </section>;
}
