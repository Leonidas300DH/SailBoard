"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Wind } from "lucide-react";
import type { RaceView } from "@/lib/domain";
import type { RaceWeatherSnapshot } from "@/lib/weather";
import { AppShell } from "../shell/AppShell";
import { CountUpNumber } from "../map/CountUpNumber";
import { DecodeText } from "../map/DecodeText";
import { WindParticles } from "../map/WindParticles";
import { CourseMap } from "./CourseMap";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { CompetitorRail } from "./CompetitorRail";
import { RaceConditions } from "./RaceConditions";

/**
 * Race sheet: geographic context on the left, validated leaderboard on the
 * right, and the championship timeline permanently attached below.
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
  const selected = useMemo(
    () => race.leaderboard.find((row) => row.entryId === selectedEntryId) ?? race.leaderboard[0],
    [race.leaderboard, selectedEntryId],
  );
  const leader = race.leaderboard[0];
  const isUpcoming = race.status !== "completed";
  const weatherPending = isUpcoming && weather.reliability === "fallback";
  const raceDate = new Date(race.scheduledAt);
  const raceDateLabel = raceDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

  const openRail = (entryId: string) => {
    setSelectedEntryId(entryId);
    setIsRailExpanded(true);
  };

  return <AppShell
    active={context}
    timelineSelectedSlug={race.slug}
    navFooter={<div className="nav-season"><strong>{race.eventName}</strong><small>{raceDateLabel}</small></div>}
  >
    <section className="race-stage">
      <div className={`race-main ${isRailExpanded ? "rail-expanded" : ""}`}>
        <div className="map-wrap">
          <CourseMap center={race.center} windDirection={weather.windDirection} windKnots={weather.windKnots} />
          <div className="map-shade" aria-hidden />
          <WindParticles windDirection={weather.windDirection} windKnots={weather.windKnots} />
          <div className="map-caption" aria-label="Contexte de l’étape">
            <span className="map-chip map-chip-status"><MapPin aria-hidden /><DecodeText text={`Plan d’eau · ${isUpcoming ? "à venir" : "archive"}`} speed={16} delay={120} /></span>
            {weatherPending ? null : (
              <span className="map-chip map-chip-metric"><Wind aria-hidden /><CountUpNumber value={weather.windKnots} decimals={1} duration={640} delay={220} /> ND · <CountUpNumber value={Math.round(weather.windDirection)} duration={700} delay={260} />° <DecodeText text={weather.windLabel} speed={14} delay={300} /></span>
            )}
            <span className="map-chip map-chip-meta"><DecodeText text={`${race.locationName} · aperçu cartographique`} speed={14} delay={340} /></span>
          </div>
          <Link className="map-return" href="/"><ArrowLeft aria-hidden /><DecodeText text="Saison 2026" speed={16} delay={260} /></Link>
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

    </section>
  </AppShell>;
}
