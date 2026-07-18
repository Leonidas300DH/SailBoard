import type { RaceView } from "./domain";
import type { SeasonRace } from "./season-data";
import { snapshotSlug, standingColor, WDT_2026_EVENTS, wdt2026TeamSnapshot, wdtCrewForEvent } from "./wdt-2026";

/**
 * Minimal RaceView for a season race that has no database record yet: the
 * geographic area and real weather load, while the leaderboard stays empty
 * until race officials publish results.
 */
export function seasonRacePreview(race: SeasonRace): RaceView {
  const eventIndex = WDT_2026_EVENTS.findIndex((event) => event.id === race.id);
  const leaderboard = eventIndex < 0 || race.status !== "completed" ? [] : wdt2026TeamSnapshot.rows
    .map((team, index) => ({ team, score: team.eventScores[eventIndex], index }))
    .filter((entry): entry is { team: typeof wdt2026TeamSnapshot.rows[number]; score: number; index: number } => entry.score != null)
    .sort((left, right) => left.score - right.score)
    .map(({ team, score, index }) => ({
      entryId: `${race.id}-${snapshotSlug(team.name)}`,
      position: score,
      boatId: `wdt-team-${index + 1}`,
      boatName: team.name,
      boatSlug: snapshotSlug(team.name),
      sailNumber: "Diam 24OD",
      color: standingColor(score),
      status: "classified" as const,
      elapsedSeconds: null,
      points: score,
      crew: wdtCrewForEvent(team.name, eventIndex),
    }));

  return {
    id: race.id,
    name: race.name,
    slug: race.slug,
    status: race.status === "completed" ? "completed" : "scheduled",
    scheduledAt: `${race.date}T15:00:00+02:00`,
    eventName: race.name,
    eventSlug: race.slug,
    seasonName: "World Diam Tour France 2026",
    seasonSlug: "world-diam-tour-france-2026",
    locationName: race.locationName,
    center: race.coordinates,
    distanceNm: race.distanceNm,
    laps: 1,
    courseGeoJson: { type: "FeatureCollection", features: [] },
    leaderboard,
  };
}
