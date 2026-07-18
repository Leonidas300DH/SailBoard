import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";

async function readJson(path) {
  return JSON.parse(await readFile(resolve(process.cwd(), path), "utf8"));
}

function connectionConfig() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL est absente.");
  const url = new URL(process.env.DATABASE_URL);
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  url.searchParams.delete("sslmode");
  return { connectionString: url.toString(), ssl: isLocal ? undefined : { rejectUnauthorized: true } };
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: ${actual} au lieu de ${expected}`);
}

const [season, expectedTeams, expectedIndividuals] = await Promise.all([
  readJson("data/wdt-2026-season.json"),
  readJson("data/wdt-2026-team-standings.json"),
  readJson("data/wdt-2026-individual-standings.json"),
]);
const pool = new pg.Pool({ ...connectionConfig(), max: 1, allowExitOnIdle: true });

try {
  const [teamResult, individualResult, countsResult] = await Promise.all([
    pool.query(`
      select b.name, replace(e.slug, 'wdt-2026-event-', '') as stage_slug,
        str.championship_points as points
      from seasons s
      join events e on e.season_id = s.id
      join stage_team_results str on str.event_id = e.id
      join boats b on b.id = str.boat_id
      where s.slug = 'wdt-2026'
      order by e.starts_on, b.name
    `),
    pool.query(`
      select p.name, replace(e.slug, 'wdt-2026-event-', '') as stage_slug,
        sis.championship_points as points
      from seasons s
      join events e on e.season_id = s.id
      join stage_individual_scores sis on sis.event_id = e.id
      join participants p on p.id = sis.participant_id
      where s.slug = 'wdt-2026'
      order by e.starts_on, p.name
    `),
    pool.query(`
      select
        (select count(*)::int from events where season_id = 'wdt-2026') as events,
        (select count(distinct str.boat_id)::int from stage_team_results str join events e on e.id = str.event_id where e.season_id = 'wdt-2026') as teams,
        (select count(distinct sis.participant_id)::int from stage_individual_scores sis join events e on e.id = sis.event_id where e.season_id = 'wdt-2026') as sailors,
        (select count(*)::int from stage_team_results str join events e on e.id = str.event_id where e.season_id = 'wdt-2026') as stage_team_results,
        (select count(*)::int from stage_individual_scores sis join events e on e.id = sis.event_id where e.season_id = 'wdt-2026') as stage_individual_scores,
        (select count(*)::int from stage_crew_assignments sca join events e on e.id = sca.event_id where e.season_id = 'wdt-2026') as inferred_crew_assignments
    `),
  ]);

  const eventIndex = new Map(season.events.map((event, index) => [event.slug, index]));
  const actualTeams = new Map(expectedTeams.rows.map((row) => [row.name, Array(season.events.length).fill(null)]));
  for (const row of teamResult.rows) actualTeams.get(row.name)[eventIndex.get(row.stage_slug)] = row.points === null ? null : Number(row.points);
  for (const expected of expectedTeams.rows) {
    assertEqual(JSON.stringify(actualTeams.get(expected.name)), JSON.stringify(expected.eventScores), `Scores équipe ${expected.name}`);
  }

  const actualIndividuals = new Map(expectedIndividuals.rows.map((row) => [row.name, Array(season.events.length).fill(null)]));
  for (const row of individualResult.rows) actualIndividuals.get(row.name)[eventIndex.get(row.stage_slug)] = row.points === null ? null : Number(row.points);
  for (const expected of expectedIndividuals.rows) {
    assertEqual(JSON.stringify(actualIndividuals.get(expected.name)), JSON.stringify(expected.eventScores), `Scores coureur ${expected.name}`);
  }

  const counts = countsResult.rows[0];
  assertEqual(counts.events, 6, "Étapes");
  assertEqual(counts.teams, 9, "Équipes");
  assertEqual(counts.sailors, 43, "Coureurs");
  assertEqual(counts.stage_team_results, 54, "Résultats de bateau par étape");
  assertEqual(counts.stage_individual_scores, 258, "Scores individuels par étape");
  console.log(JSON.stringify({ verified: true, ...counts, teamLeader: { name: expectedTeams.rows[0].name, points: expectedTeams.rows[0].points }, individualLeader: { name: expectedIndividuals.rows[0].name, points: expectedIndividuals.rows[0].points } }, null, 2));
} finally {
  await pool.end();
}
