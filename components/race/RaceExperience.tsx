"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pause, Play, Radio, Wind } from "lucide-react";
import type { RaceView } from "@/lib/domain";
import type { RaceWeatherSnapshot } from "@/lib/weather";
import { AppShell } from "../shell/AppShell";
import { CloudLayer } from "../map/CloudLayer";
import { WindParticles } from "../map/WindParticles";
import { CourseMap } from "./CourseMap";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { CompetitorRail, formatTime } from "./CompetitorRail";
import { RaceConditions } from "./RaceConditions";

/**
 * Race sheet: animated official course on the left, validated leaderboard on
 * the right. The old simulated-fleet replay is gone — the course animation is
 * openly a simulation of the traced route, not GPS data.
 */
export function RaceExperience({
  race,
  weather,
  context = "season",
}: {
  race: RaceView;
  weather: RaceWeatherSnapshot;
  context?: "season" | "course";
}) {
  const [selectedEntryId, setSelectedEntryId] = useState(race.leaderboard[1]?.entryId ?? race.leaderboard[0]?.entryId);
  const [isRailExpanded, setIsRailExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const selected = useMemo(
    () => race.leaderboard.find((row) => row.entryId === selectedEntryId) ?? race.leaderboard[0],
    [race.leaderboard, selectedEntryId],
  );
  const leader = race.leaderboard[0];
  const hasResults = race.leaderboard.length > 0;
  const isUpcoming = race.status !== "completed";
  const weatherPending = isUpcoming && weather.reliability === "fallback";
  const hasRoute = race.courseGeoJson.features.some(
    (feature) => feature.properties?.kind === "route" && feature.geometry.type === "LineString" && feature.geometry.coordinates.length > 1,
  );
  const raceDate = new Date(race.scheduledAt);
  const raceDateLabel = raceDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

  const openRail = (entryId: string) => {
    setSelectedEntryId(entryId);
    setIsRailExpanded(true);
    if (window.matchMedia("(max-width: 760px)").matches) {
      window.setTimeout(() => {
        document.getElementById("selected-boat-rail")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  };

  return <AppShell
    active={context}
    navFooter={<div className="nav-season"><strong>{race.eventName}</strong><small>{raceDateLabel}</small></div>}
  >
    <section className="race-stage">
      <div className={`race-main ${isRailExpanded ? "rail-expanded" : ""}`}>
        <div className="map-wrap">
          <CourseMap center={race.center} geojson={race.courseGeoJson} isPlaying={isPlaying} />
          <CloudLayer windDirection={weather.windDirection} windKnots={weather.windKnots} />
          <div className="map-shade" aria-hidden />
          <WindParticles windDirection={weather.windDirection} windKnots={weather.windKnots} />
          <div className="map-caption" aria-label="Contexte de l’étape">
            <span className="map-chip map-chip-status"><Radio aria-hidden />{hasRoute ? "Parcours animé · Simulation" : "Tracé non publié"}</span>
            {weatherPending ? null : (
              <span className="map-chip map-chip-metric"><Wind aria-hidden />{weather.windKnots.toFixed(1)} ND · {Math.round(weather.windDirection)}° {weather.windLabel}</span>
            )}
            <span className="map-chip map-chip-meta">{race.locationName} · aperçu cartographique</span>
          </div>
          <Link className="map-return" href="/"><ArrowLeft aria-hidden />Saison 2026</Link>
          <RaceConditions weather={weather} pending={weatherPending} />
        </div>

        <aside className={`leaderboard ${isRailExpanded ? "expanded" : ""}`}>
          <LeaderboardPanel
            leaderboard={race.leaderboard}
            selectedEntryId={selected?.entryId}
            isRailExpanded={isRailExpanded}
            upcoming={isUpcoming}
            onOpen={openRail}
          />
          {selected ? (
            <CompetitorRail selected={selected} leader={leader} onClose={() => setIsRailExpanded(false)} />
          ) : null}
        </aside>
      </div>

      <footer className="race-footer">
        {hasRoute ? (
          <button
            type="button"
            className="race-footer-play"
            aria-label={isPlaying ? "Mettre l’animation du parcours en pause" : "Rejouer le parcours"}
            onClick={() => setIsPlaying((value) => !value)}
          >
            {isPlaying ? <Pause aria-hidden /> : <Play aria-hidden />}
          </button>
        ) : null}
        <div className="race-footer-copy">
          {hasRoute ? (
            <>
              <strong>Animation du tracé de l’étape</strong>
              <small>Aperçu illustratif — aucune trace GPS des concurrents</small>
            </>
          ) : (
            <>
              <strong>Tracé officiel en attente</strong>
              <small>Le parcours sera publié par la direction de course — la carte montre le plan d’eau</small>
            </>
          )}
        </div>
        {hasResults && leader?.elapsedSeconds != null ? (
          <div className="timeline-total">
            <span className="label">Temps vainqueur</span>
            <strong>{formatTime(leader?.elapsedSeconds ?? null)}</strong>
            <small>{race.distanceNm > 0 ? `${race.distanceNm.toFixed(1)} NM · ` : ""}{race.laps} tour{race.laps > 1 ? "s" : ""}</small>
          </div>
        ) : hasResults ? (
          <div className="timeline-total">
            <span className="label">Classement d’étape</span>
            <strong>{race.leaderboard.length} équipages</strong>
            <small>Points intégrés au classement général</small>
          </div>
        ) : (
          <div className="timeline-total">
            <span className="label">{isUpcoming ? "Début de l’étape" : "Étape disputée"}</span>
            <strong className="race-footer-date">{raceDateLabel}</strong>
            <small>{race.distanceNm > 0 ? `${race.distanceNm.toFixed(1)} NM · ` : ""}{hasRoute ? "tracé indicatif" : "plan d’eau"}</small>
          </div>
        )}
      </footer>
    </section>
  </AppShell>;
}
