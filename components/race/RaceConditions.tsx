"use client";

import { CloudOff, Gauge, Thermometer, Waves } from "lucide-react";
import type { CSSProperties } from "react";
import { CountUpNumber } from "@/components/map/CountUpNumber";
import { DecodeText } from "@/components/map/DecodeText";
import type { RaceWeatherSnapshot } from "@/lib/weather";

export function RaceConditions({ weather, pending = false }: { weather: RaceWeatherSnapshot; pending?: boolean }) {
  if (pending) {
    return <section className="race-conditions-overlay race-conditions-overlay--pending" aria-label="Conditions météo de l’étape">
      <div>
        <span><DecodeText text="Conditions du jour" speed={16} delay={180} /></span>
        <strong><DecodeText text="À venir" speed={20} delay={300} /></strong>
        <small><DecodeText text="Prévisions réelles publiées à J-15 · archive après l’étape" speed={12} delay={420} /></small>
      </div>
      <div style={{ "--hud-row": 1 } as CSSProperties}><CloudOff /><span><DecodeText text="Modèles" speed={16} delay={420} /></span><strong className="mono"><DecodeText text="HORS PORTÉE" speed={18} delay={510} /></strong></div>
    </section>;
  }
  return <section className="race-conditions-overlay" aria-label="Conditions météo de l’étape">
    <div>
      <span><DecodeText text="Conditions du jour" speed={16} delay={180} /></span>
      <strong><DecodeText text={weather.observedAt} speed={18} delay={300} /></strong>
      <small><DecodeText text={weather.source} speed={12} delay={420} /></small>
    </div>
    <div style={{ "--hud-row": 1 } as CSSProperties}><Gauge /><span><DecodeText text="Rafales" speed={16} delay={420} /></span><strong className="mono"><CountUpNumber value={weather.gustKnots} delay={480} /> ND</strong></div>
    <div style={{ "--hud-row": 2 } as CSSProperties}><Waves /><span><DecodeText text="Houle" speed={16} delay={500} /></span><strong className="mono"><CountUpNumber value={weather.waveHeight} decimals={1} delay={560} /> M · <CountUpNumber value={weather.wavePeriod} decimals={1} delay={600} /> S</strong></div>
    <div style={{ "--hud-row": 3 } as CSSProperties}><Thermometer /><span><DecodeText text="Eau" speed={16} delay={580} /></span><strong className="mono"><CountUpNumber value={weather.seaTemperature} delay={660} />°C</strong></div>
  </section>;
}
