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
  /** Stage colour from the WDT six-colour prism. */
  color: string;
  status: SeasonRaceStatus;
  winner?: string;
  result?: string;
  /** Unknown in the supplied official schedule; zero means not published. */
  distanceNm: number;
};

/** The six stage colours of the WDT prism (charte octobre 2018). */
export const WDT_PRISM = ["#009cde", "#0033a0", "#e4002b", "#e8ff29", "#f6eb61", "#a09200"];

export const SEASON_RACES: SeasonRace[] = seasonSource.events.map((event, index) => ({
  id: event.id,
  slug: event.slug,
  color: WDT_PRISM[index % WDT_PRISM.length],
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

/** Dark ink on the light prism colours, white on the dense ones. */
export function wdtInk(color: string): string {
  return ["#e8ff29", "#f6eb61", "#009cde"].includes(color) ? "#25271f" : "#f2f7f9";
}
