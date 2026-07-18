"use client";

import { Gauge, Thermometer, Waves } from "lucide-react";
import type { RaceWeatherSnapshot } from "@/lib/weather";

export function RaceConditions({ weather }: { weather: RaceWeatherSnapshot }) {
  return <section className="race-conditions-overlay" aria-label="Conditions météo de la course">
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
