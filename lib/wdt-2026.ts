import individualSource from "@/data/wdt-2026-individual-standings.json";
import teamSource from "@/data/wdt-2026-team-standings.json";
import { rankScores, totalScores } from "@/lib/scoring.mjs";
import { SEASON_RACES } from "@/lib/season-data";

export type WdtScoreDirection = "high" | "low";

export type WdtEvent = {
  id: string;
  name: string;
  shortName: string;
  status: "completed" | "upcoming";
};

export type WdtStanding = {
  rank: number;
  name: string;
  points: number;
  eventScores: Array<number | null>;
};

export type WdtSnapshot = {
  id: string;
  competition: string;
  title: string;
  completedRaces: number;
  totalRaces: number;
  declaredClassifiedCount: number;
  importedAt: string;
  source: string;
  scoreDirection: WdtScoreDirection;
  rows: WdtStanding[];
};

type WdtSnapshotSource = Omit<WdtSnapshot, "scoreDirection" | "rows"> & {
  rows: Array<Omit<WdtStanding, "rank">>;
};

export const WDT_2026_EVENTS: WdtEvent[] = SEASON_RACES.map((event) => ({
  id: event.id,
  name: event.name,
  shortName: event.shortName,
  status: event.status === "completed" ? "completed" : "upcoming",
}));

function prepareSnapshot(source: WdtSnapshotSource, scoreDirection: WdtScoreDirection): WdtSnapshot {
  const rows = source.rows.map((row) => {
    const calculatedPoints = totalScores(row.eventScores);
    if (calculatedPoints !== row.points) {
      throw new Error(`Total WDT incohérent pour ${row.name}: ${calculatedPoints} au lieu de ${row.points}`);
    }
    if (row.eventScores.length !== source.totalRaces) {
      throw new Error(`Nombre d’étapes WDT incohérent pour ${row.name}`);
    }
    return { ...row, points: calculatedPoints };
  });
  return { ...source, scoreDirection, rows: rankScores(rows, scoreDirection) };
}

export const wdt2026IndividualSnapshot = prepareSnapshot(
  individualSource as WdtSnapshotSource,
  "high",
);

export const wdt2026TeamSnapshot = prepareSnapshot(
  teamSource as WdtSnapshotSource,
  "low",
);

export function snapshotSlug(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function standingColor(rank: number) {
  if (rank === 1) return "#d9ff00";
  if (rank <= 4) return "#f5f8f7";
  if (rank <= 10) return "#36baff";
  return "#7894a0";
}
