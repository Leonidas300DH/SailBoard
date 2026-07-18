import { SEASON_RACES } from "./season-data";
import { seasonRacePreview } from "./season-view";
import { snapshotSlug, standingColor, WDT_2026_EVENTS, wdt2026IndividualSnapshot, wdt2026TeamSnapshot } from "./wdt-2026";
import type { RaceView } from "./domain";

export type WdtHistoryRow = {
  raceName: string;
  raceSlug: string;
  eventName: string;
  date: string;
  position: number | null;
  points: number;
  status?: string;
  boatName?: string;
  boatSlug?: string;
  role?: string;
};

function stageHistory(eventScores: Array<number | null>): WdtHistoryRow[] {
  return WDT_2026_EVENTS
    .map((event, index) => ({ event, score: eventScores[index] }))
    .filter((entry): entry is { event: typeof WDT_2026_EVENTS[number]; score: number } => entry.score != null)
    .map(({ event, score }) => {
      const seasonRace = SEASON_RACES.find((race) => race.id === event.id);
      return {
        raceName: event.name,
        raceSlug: seasonRace?.slug ?? event.id,
        eventName: event.name,
        date: seasonRace ? `${seasonRace.date}T15:00:00+02:00` : "2026-01-01T00:00:00Z",
        position: score,
        points: score,
        status: "classified",
      };
    })
    .reverse();
}

function latestRace(history: WdtHistoryRow[]): RaceView {
  const latestSlug = history[0]?.raceSlug;
  const seasonRace = SEASON_RACES.find((race) => race.slug === latestSlug)
    ?? SEASON_RACES.filter((race) => race.status === "completed").at(-1)
    ?? SEASON_RACES[0];
  return seasonRacePreview(seasonRace);
}

/** Fiche équipage construite depuis le classeur officiel WDT 2026. */
export function wdtTeamProfile(slug: string) {
  const index = wdt2026TeamSnapshot.rows.findIndex((row) => snapshotSlug(row.name) === slug);
  if (index < 0) return null;
  const team = wdt2026TeamSnapshot.rows[index];
  const history = stageHistory(team.eventScores);
  return {
    boat: {
      name: team.name,
      slug,
      model: "Diam 24OD",
      sailNumber: `WDT · rang ${team.rank}`,
      color: standingColor(team.rank),
    },
    history,
    race: latestRace(history),
  };
}

/** Fiche navigateur construite depuis le classeur officiel WDT 2026. */
export function wdtParticipantProfile(slug: string) {
  const row = wdt2026IndividualSnapshot.rows.find((entry) => snapshotSlug(entry.name) === slug);
  if (!row) return null;
  const history = stageHistory(row.eventScores).map((entry) => ({
    ...entry,
    boatName: "Équipage non renseigné",
    boatSlug: undefined,
    role: "Navigateur",
  }));
  return {
    participant: { name: row.name, slug, nationality: "FRA" },
    history,
    race: latestRace(history),
  };
}
