"use client";

import { useMemo, useState } from "react";
import type { RaceView } from "@/lib/domain";
import { SEASON_RACES } from "@/lib/season-data";
import type { RaceWeatherSnapshot } from "@/lib/weather";
import { AppShell } from "../shell/AppShell";
import { CloudLayer } from "../map/CloudLayer";
import { WindParticles } from "../map/WindParticles";
import { SeasonMap } from "./SeasonMap";
import { SeasonTopBar } from "./SeasonTopBar";
import { CircuitRail } from "./CircuitRail";
import { RaceDossier } from "./RaceDossier";
import { SeasonTimeline, type TimelineLeader } from "./SeasonTimeline";

/**
 * Season home orchestrator: full-bleed tactical map, compact race dossier,
 * roadbook drawer (closed by default) and the time-proportional calendar.
 */
export function SeasonControlRoom({
  race,
  leaders,
  weather,
  seasonWeather,
  nowIso,
}: {
  race: RaceView;
  leaders: TimelineLeader[];
  weather: RaceWeatherSnapshot;
  seasonWeather: Record<string, RaceWeatherSnapshot | null>;
  nowIso: string;
}) {
  const [selectedRaceId, setSelectedRaceId] = useState("trophee-golfe");
  const [isPlaying, setIsPlaying] = useState(true);
  const [isCircuitOpen, setIsCircuitOpen] = useState(false);

  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const selectedRace = useMemo(
    () => SEASON_RACES.find((item) => item.id === selectedRaceId) ?? SEASON_RACES[2],
    [selectedRaceId],
  );
  const pastCount = useMemo(
    () => SEASON_RACES.filter((item) => new Date(`${item.date}T00:00:00`) <= now).length,
    [now],
  );

  // Real per-race conditions: archive for past races, forecast when in reach,
  // null beyond the horizon. The reference race keeps its dedicated snapshot.
  const selectedWeather: RaceWeatherSnapshot | null = selectedRace.id === "trophee-golfe"
    ? weather
    : seasonWeather[selectedRace.id] ?? null;

  return <AppShell
    active="season"
    raceSlug={race.slug}
    shellClassName="season-ocean-shell"
    navClassName="season-ocean-nav"
    navFooter={
      <div className="season-nav-progress">
        <span>SAISON</span>
        <strong className="mono">{String(pastCount).padStart(2, "0")}<span>/{String(SEASON_RACES.length).padStart(2, "0")}</span></strong>
        <small>AVR. — OCT. 2026</small>
      </div>
    }
  >
    <section className="season-ocean-stage">
      <div className={`season-map-canvas ${isCircuitOpen ? "circuit-open" : ""}`}>
        <SeasonMap
          races={SEASON_RACES}
          selectedRace={selectedRace}
          circuitOpen={isCircuitOpen}
          isPlaying={isPlaying}
          onSelect={setSelectedRaceId}
        />
        <CloudLayer
          windDirection={selectedWeather?.windDirection ?? 250}
          windKnots={selectedWeather?.windKnots ?? 12}
        />
        <div className="season-ocean-shade" aria-hidden />
        <WindParticles
          windDirection={selectedWeather?.windDirection ?? 250}
          windKnots={selectedWeather?.windKnots ?? 12}
        />
        <div className="wind-field" aria-hidden>
          {Array.from({ length: 18 }, (_, index) => (
            <i key={index} style={{ "--wind-index": index, "--wind-angle": `${(selectedWeather?.windDirection ?? 250) + 180}deg` } as React.CSSProperties} />
          ))}
        </div>

        <SeasonTopBar
          circuitOpen={isCircuitOpen}
          onToggleCircuit={() => setIsCircuitOpen((value) => !value)}
          exploreHref={selectedRace.href ?? `/courses/${race.slug}`}
        />

        <CircuitRail
          races={SEASON_RACES}
          selectedId={selectedRace.id}
          open={isCircuitOpen}
          onClose={() => setIsCircuitOpen(false)}
          onSelect={setSelectedRaceId}
        />

        <RaceDossier
          race={selectedRace}
          weather={selectedWeather}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying((value) => !value)}
        />
      </div>

      <SeasonTimeline
        races={SEASON_RACES}
        selectedId={selectedRace.id}
        now={now}
        leaders={leaders}
        weatherByRace={seasonWeather}
        onSelect={setSelectedRaceId}
      />
    </section>
  </AppShell>;
}
