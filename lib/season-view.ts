import type { RaceView } from "./domain";
import type { SeasonRace } from "./season-data";

/**
 * Minimal RaceView for a season race that has no database record yet: the
 * traced route animates and the real weather loads, but the leaderboard is
 * empty until race officials publish results.
 */
export function seasonRacePreview(race: SeasonRace): RaceView {
  return {
    id: race.id,
    name: race.name,
    slug: race.slug,
    status: race.winner ? "completed" : "scheduled",
    scheduledAt: `${race.date}T15:00:00+02:00`,
    eventName: race.name,
    eventSlug: race.slug,
    seasonName: "Championnat 2026",
    seasonSlug: "championnat-2026",
    locationName: race.locationName,
    center: race.coordinates,
    distanceNm: race.distanceNm,
    laps: 1,
    courseGeoJson: {
      type: "FeatureCollection",
      features: [
        { ...race.route, properties: { ...race.route.properties, kind: "route" } },
      ],
    },
    leaderboard: [],
  };
}
