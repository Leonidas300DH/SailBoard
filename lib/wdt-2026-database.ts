import { getPool, isDatabaseConfigured } from "@/db";
import { rankScores, totalScores } from "@/lib/scoring.mjs";
import { SEASON_RACES } from "@/lib/season-data";
import {
  WDT_2026_EVENTS,
  type WdtSnapshot,
  type WdtStanding,
  wdt2026IndividualSnapshot,
  wdt2026TeamSnapshot,
} from "@/lib/wdt-2026";

type TeamScoreRow = {
  name: string;
  stage_slug: string;
  points: number | string | null;
};

type IndividualScoreRow = {
  name: string;
  stage_slug: string;
  points: number | string | null;
};

type ImportRow = {
  imported_at: string;
  source_name: string;
};

export type WdtSnapshotOrigin = "database" | "local_snapshot";

export type Wdt2026Snapshots = {
  team: WdtSnapshot;
  individual: WdtSnapshot;
  origin: WdtSnapshotOrigin;
};

function completedRaceCount() {
  return WDT_2026_EVENTS.filter((event) => event.status === "completed").length;
}

function rowsFromScores(
  source: Array<TeamScoreRow | IndividualScoreRow>,
  direction: "high" | "low",
): WdtStanding[] {
  const eventIndex = new Map(SEASON_RACES.map((event, index) => [event.slug, index]));
  const byName = new Map<string, Array<number | null>>();
  for (const row of source) {
    const scores = byName.get(row.name) ?? Array<number | null>(WDT_2026_EVENTS.length).fill(null);
    const index = eventIndex.get(row.stage_slug);
    if (index === undefined) throw new Error(`Étape WDT inconnue dans la base: ${row.stage_slug}`);
    scores[index] = row.points === null ? null : Number(row.points);
    byName.set(row.name, scores);
  }
  const completed = completedRaceCount();
  const unranked = [...byName.entries()].map(([name, eventScores]) => {
    if (eventScores.slice(0, completed).some((score) => score === null)) {
      throw new Error(`Scores WDT incomplets dans la base pour ${name}.`);
    }
    return { name, points: totalScores(eventScores), eventScores };
  });
  return rankScores(unranked, direction);
}

async function readDatabaseSnapshots(): Promise<Wdt2026Snapshots> {
  const pool = getPool();
  const [teamResult, individualResult, importResult] = await Promise.all([
    pool.query<TeamScoreRow>(`
      select b.name, replace(e.slug, 'wdt-2026-event-', '') as stage_slug,
        str.championship_points as points
      from seasons s
      join events e on e.season_id = s.id
      join stage_team_results str on str.event_id = e.id
      join boats b on b.id = str.boat_id
      where s.slug = $1
      order by e.starts_on, b.name
    `, ["wdt-2026"]),
    pool.query<IndividualScoreRow>(`
      select p.name, replace(e.slug, 'wdt-2026-event-', '') as stage_slug,
        sis.championship_points as points
      from seasons s
      join events e on e.season_id = s.id
      join stage_individual_scores sis on sis.event_id = e.id
      join participants p on p.id = sis.participant_id
      where s.slug = $1 and p.public_visible = 1
      order by e.starts_on, p.name
    `, ["wdt-2026"]),
    pool.query<ImportRow>(`
      select di.imported_at, di.source_name
      from data_imports di
      join seasons s on s.id = di.season_id
      where s.slug = $1 and di.status = 'completed'
      order by di.imported_at desc
      limit 1
    `, ["wdt-2026"]),
  ]);

  const teamRows = rowsFromScores(teamResult.rows, "low");
  const individualRows = rowsFromScores(individualResult.rows, "high");
  if (teamRows.length !== 9 || individualRows.length !== 43) {
    throw new Error(`Import WDT incomplet dans la base (${teamRows.length} équipages, ${individualRows.length} navigateurs).`);
  }
  const importMeta = importResult.rows[0];
  if (!importMeta) throw new Error("Aucun import WDT terminé n’est enregistré.");
  const common = {
    competition: "WDT 2026 France",
    completedRaces: completedRaceCount(),
    totalRaces: WDT_2026_EVENTS.length,
    importedAt: importMeta.imported_at,
    source: importMeta.source_name,
  };
  return {
    origin: "database",
    team: {
      ...common,
      id: "wdt-2026-database-teams",
      title: "Classement des équipages",
      declaredClassifiedCount: teamRows.length,
      scoreDirection: "low",
      rows: teamRows,
    },
    individual: {
      ...common,
      id: "wdt-2026-database-individual",
      title: "Classement des navigateurs",
      declaredClassifiedCount: individualRows.length,
      scoreDirection: "high",
      rows: individualRows,
    },
  };
}

export async function getWdt2026Snapshots(): Promise<Wdt2026Snapshots> {
  if (!isDatabaseConfigured()) {
    return { team: wdt2026TeamSnapshot, individual: wdt2026IndividualSnapshot, origin: "local_snapshot" };
  }
  try {
    return await readDatabaseSnapshots();
  } catch (error) {
    console.error("WDT_DATABASE_FALLBACK", error);
    return { team: wdt2026TeamSnapshot, individual: wdt2026IndividualSnapshot, origin: "local_snapshot" };
  }
}
