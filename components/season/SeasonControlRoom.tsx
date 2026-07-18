"use client";

import { useMemo, useState } from "react";
import { SEASON_RACES } from "@/lib/season-data";
import type { RaceWeatherSnapshot } from "@/lib/weather";
import { AppShell } from "../shell/AppShell";
import { CloudLayer } from "../map/CloudLayer";
import { WindParticles } from "../map/WindParticles";
import { SeasonMap } from "./SeasonMap";
import { SeasonTopBar } from "./SeasonTopBar";
import { NavRoadbook } from "./NavRoadbook";
import { RaceHud } from "./RaceHud";
import { SeasonTimeline } from "./SeasonTimeline";

/**
 * Season home: the map is the whole screen. Nothing is selected on landing;
 * picking a stage (marker, timeline or the roadbook folded into the rail)
 * flies the camera and opens the floating race HUD. Closing the HUD returns
 * to the circuit overview.
 */
export function SeasonControlRoom({
  seasonWeather,
  nowIso,
}: {
  seasonWeather: Record<string, RaceWeatherSnapshot | null>;
  nowIso: string;
}) {
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const selectedRace = useMemo(
    () => SEASON_RACES.find((item) => item.id === selectedRaceId) ?? null,
    [selectedRaceId],
  );
  const selectedIndex = selectedRace ? SEASON_RACES.indexOf(selectedRace) : -1;

  // Real per-race conditions: archive for past races, forecast when in reach,
  // null beyond the horizon. The ambient effects always need a wind vector,
  // so without a selection they breathe with the first documented stage.
  const selectedWeather: RaceWeatherSnapshot | null = selectedRace
    ? seasonWeather[selectedRace.id] ?? null
    : null;
  const ambientWeather = selectedWeather
    ?? seasonWeather[SEASON_RACES.find((race) => seasonWeather[race.id])?.id ?? ""]
    ?? null;

  return <AppShell
    active="season"
    shellClassName="season-ocean-shell"
    navClassName="season-ocean-nav"
    navExtras={{
      season: (
        <NavRoadbook
          races={SEASON_RACES}
          selectedId={selectedRace?.id ?? null}
          onSelect={setSelectedRaceId}
        />
      ),
    }}
  >
    <section className="season-ocean-stage">
      <div className="season-map-canvas">
        <SeasonMap
          races={SEASON_RACES}
          selectedRace={selectedRace}
          isPlaying={isPlaying}
          onSelect={setSelectedRaceId}
        />
        <CloudLayer
          windDirection={ambientWeather?.windDirection ?? 250}
          windKnots={ambientWeather?.windKnots ?? 12}
        />
        <div className="season-ocean-shade" aria-hidden />
        <WindParticles
          windDirection={ambientWeather?.windDirection ?? 250}
          windKnots={ambientWeather?.windKnots ?? 12}
        />
        <div className="wind-field" aria-hidden>
          {Array.from({ length: 18 }, (_, index) => (
            <i key={index} style={{ "--wind-index": index, "--wind-angle": `${(ambientWeather?.windDirection ?? 250) + 180}deg` } as React.CSSProperties} />
          ))}
        </div>

        <SeasonTopBar />

        {selectedRace ? (
          <RaceHud
            race={selectedRace}
            index={selectedIndex}
            weather={selectedWeather}
            isPlaying={isPlaying}
            isToday={new Date(`${selectedRace.date}T00:00:00`).toDateString() === now.toDateString()}
            onTogglePlay={() => setIsPlaying((value) => !value)}
            onClose={() => setSelectedRaceId(null)}
          />
        ) : null}
      </div>

      <SeasonTimeline
        races={SEASON_RACES}
        selectedId={selectedRace?.id ?? null}
        now={now}
        onSelect={setSelectedRaceId}
      />
    </section>
  </AppShell>;
}
