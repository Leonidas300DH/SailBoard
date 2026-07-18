import seasonSource from "@/data/wdt-2026-season.json";

export type SeasonRaceStatus = "completed" | "selected" | "upcoming";

export type SeasonRace = {
  id: string;
  name: string;
  shortName: string;
  date: string;
  dateLabel: string;
  monthLabel: string;
  locationName: string;
  coordinates: [number, number];
  /** Public course page under /courses/[slug]. */
  slug: string;
  status: SeasonRaceStatus;
  winner?: string;
  result?: string;
  /** Unknown in the supplied official schedule; zero means not published. */
  distanceNm: number;
  /** Official traced course — absent until race officials publish one. */
  route?: GeoJSON.Feature<GeoJSON.LineString>;
};

export const SEASON_RACES: SeasonRace[] = seasonSource.events.map((event) => ({
  id: event.id,
  slug: event.slug,
  name: event.name,
  shortName: event.shortName,
  date: event.startsOn,
  dateLabel: event.dateLabel,
  monthLabel: event.monthLabel,
  locationName: event.locationName,
  coordinates: [event.centerLng, event.centerLat],
  status: event.status as SeasonRaceStatus,
  result: event.result,
  distanceNm: 0,
}));

export function seasonRaceBySlug(slug: string): SeasonRace | undefined {
  return SEASON_RACES.find((race) => race.slug === slug);
}
