import snapshotSource from "@/data/wdt-2026-individual-standings.json";

export type WdtIndividualStanding = {
  rank: number;
  name: string;
  points: number;
};

export type WdtIndividualSnapshot = {
  id: string;
  competition: string;
  title: string;
  completedRaces: number;
  declaredClassifiedCount: number;
  namedScoresCount: number;
  importedAt: string;
  source: string;
  rows: WdtIndividualStanding[];
};

export const wdt2026IndividualSnapshot = snapshotSource satisfies WdtIndividualSnapshot;

export function snapshotSlug(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function standingColor(rank: number) {
  if (rank === 1) return "#d9ff00";
  if (rank <= 4) return "#f5f8f7";
  if (rank <= 10) return "#36baff";
  return "#7894a0";
}
