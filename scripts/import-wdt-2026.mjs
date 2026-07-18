import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";

const root = process.cwd();
const sourcePaths = {
  season: resolve(root, "data/wdt-2026-season.json"),
  teams: resolve(root, "data/wdt-2026-team-standings.json"),
  individuals: resolve(root, "data/wdt-2026-individual-standings.json"),
  workbook: resolve(root, "Classement WDT 2026.xlsx"),
};

function slugify(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function isoNow() {
  return new Date().toISOString();
}

async function loadSources() {
  const [seasonBuffer, teamsBuffer, individualsBuffer, workbookBuffer] = await Promise.all([
    readFile(sourcePaths.season),
    readFile(sourcePaths.teams),
    readFile(sourcePaths.individuals),
    readFile(sourcePaths.workbook),
  ]);
  const sourceHash = createHash("sha256")
    .update(seasonBuffer)
    .update(teamsBuffer)
    .update(individualsBuffer)
    .update(workbookBuffer)
    .digest("hex");
  return {
    season: JSON.parse(seasonBuffer.toString("utf8")),
    teams: JSON.parse(teamsBuffer.toString("utf8")),
    individuals: JSON.parse(individualsBuffer.toString("utf8")),
    sourceHash,
  };
}

function assertSources({ season, teams, individuals }) {
  const eventCount = season.events.length;
  if (eventCount !== teams.totalRaces || eventCount !== individuals.totalRaces) {
    throw new Error("Le nombre d’étapes diffère entre le calendrier et les classements.");
  }
  for (const snapshot of [teams, individuals]) {
    for (const row of snapshot.rows) {
      if (row.eventScores.length !== eventCount) throw new Error(`Nombre de scores invalide pour ${row.name}.`);
      const total = row.eventScores.reduce((sum, score) => sum + (score ?? 0), 0);
      if (total !== row.points) throw new Error(`Total invalide pour ${row.name}: ${total} au lieu de ${row.points}.`);
    }
  }
}

function connectionConfig() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL est absente. Lancez la commande avec --env-file=.env.local.");
  const url = new URL(process.env.DATABASE_URL);
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  url.searchParams.delete("sslmode");
  return { connectionString: url.toString(), ssl: isLocal ? undefined : { rejectUnauthorized: true } };
}

async function upsertRows(client, table, columns, rows, conflict) {
  if (rows.length === 0) return;
  const values = [];
  const tuples = rows.map((row) => {
    const placeholders = columns.map((column) => {
      values.push(row[column]);
      return `$${values.length}`;
    });
    return `(${placeholders.join(", ")})`;
  });
  const identifiers = columns.map((column) => `"${column}"`).join(", ");
  await client.query(`insert into "${table}" (${identifiers}) values ${tuples.join(", ")} ${conflict}`, values);
}

function databaseRows(sources, importedAt) {
  const { season, teams, individuals, sourceHash } = sources;
  const seasonId = "wdt-2026";
  const ruleId = "wdt-2026-scoring-v1";
  const importId = `wdt-2026-official-${sourceHash.slice(0, 16)}`;
  const timestamps = { created_at: importedAt, updated_at: importedAt };
  const colors = ["#d9ff00", "#36baff", "#ff6b48", "#f6c945", "#9b7bff", "#30d6a3", "#ff7fba", "#8aa4b1", "#f5f8f7"];

  const boats = teams.rows.map((team, index) => ({
    id: `wdt-2026-boat-${slugify(team.name)}`,
    name: team.name,
    slug: `wdt-2026-${slugify(team.name)}`,
    sail_number: "Non communiqué",
    model: "Diam 24OD",
    color: colors[index % colors.length],
    archived_at: null,
    ...timestamps,
  }));
  const boatByName = new Map(boats.map((boat) => [boat.name, boat]));
  const participants = individuals.rows.map((participant) => ({
    id: `wdt-2026-participant-${slugify(participant.name)}`,
    name: participant.name,
    slug: `wdt-2026-${slugify(participant.name)}`,
    nationality: "FR",
    public_visible: 1,
    archived_at: null,
    ...timestamps,
  }));

  const events = season.events.map((event) => ({
    id: `wdt-2026-event-${event.id}`,
    season_id: seasonId,
    name: event.name,
    slug: `wdt-2026-event-${event.slug}`,
    location_name: event.locationName,
    center_lat: event.centerLat,
    center_lng: event.centerLng,
    starts_on: event.startsOn,
    ends_on: event.endsOn,
    archived_at: null,
    ...timestamps,
  }));
  const races = season.events.map((event, index) => ({
    id: `wdt-2026-race-${event.id}`,
    event_id: events[index].id,
    name: event.name,
    slug: event.slug,
    scheduled_at: `${event.startsOn}T09:00:00+02:00`,
    status: event.status === "completed" ? "completed" : "scheduled",
    course_version_id: null,
    scoring_rule_version_id: ruleId,
    published_at: event.status === "completed" ? importedAt : null,
    archived_at: null,
    ...timestamps,
  }));

  const entries = [];
  const results = [];
  const stageScores = [];
  const crewAssignments = [];
  const awards = [];
  const canonicalTeamResults = [];
  const canonicalIndividualScores = [];
  const canonicalCrewAssignments = [];

  season.events.forEach((event, eventIndex) => {
    const race = races[eventIndex];
    const scoreToTeams = new Map();
    teams.rows.forEach((team, teamIndex) => {
      const boat = boatByName.get(team.name);
      const entry = {
        id: `wdt-2026-entry-${event.id}-${slugify(team.name)}`,
        race_id: race.id,
        boat_id: boat.id,
        start_number: teamIndex + 1,
        status: event.status === "completed" ? "confirmed" : "registered",
        created_at: importedAt,
      };
      entries.push(entry);
      const teamScore = team.eventScores[eventIndex];
      canonicalTeamResults.push({
        id: `wdt-2026-stage-team-result-${event.id}-${slugify(team.name)}`,
        event_id: events[eventIndex].id,
        boat_id: boat.id,
        final_position: null,
        championship_points: teamScore,
        status: teamScore === null ? "pending" : "published",
        source_mode: "official_workbook",
        source_json: JSON.stringify({ importId, sourceHash, eventIndex, note: "Le classeur fournit les points de championnat, pas la position finale détaillée de l’étape." }),
        finalized_at: teamScore === null ? null : importedAt,
        ...timestamps,
      });
      if (teamScore !== null) {
        const matchingTeams = scoreToTeams.get(teamScore) ?? [];
        matchingTeams.push({ boat, entry });
        scoreToTeams.set(teamScore, matchingTeams);
        results.push({
          id: `wdt-2026-result-${event.id}-${slugify(team.name)}`,
          entry_id: entry.id,
          position: teamScore,
          elapsed_seconds: null,
          status: "classified",
          penalty_points: 0,
          penalty_note: null,
          boat_points: teamScore,
          scoring_snapshot_json: JSON.stringify({ importId, sourceHash, eventIndex, scoreDirection: "low", valueFromWorkbook: teamScore }),
          finalized_at: importedAt,
          updated_at: importedAt,
        });
      }
    });

    individuals.rows.forEach((participant) => {
      const participantId = `wdt-2026-participant-${slugify(participant.name)}`;
      const points = participant.eventScores[eventIndex];
      if (event.status === "completed" && points === null) throw new Error(`Score individuel absent sur une étape terminée: ${participant.name}, ${event.name}.`);
      const expectedTeamScore = points > 0 ? 7 - points : null;
      const candidates = expectedTeamScore === null ? [] : (scoreToTeams.get(expectedTeamScore) ?? []);
      const assignment = candidates.length === 1 ? candidates[0] : null;
      const mapping = points === null ? "pending" : points === 0 ? "no_points" : assignment ? "unique_reverse_scale" : "ambiguous_reverse_scale";
      canonicalIndividualScores.push({
        id: `wdt-2026-stage-individual-score-${event.id}-${slugify(participant.name)}`,
        event_id: events[eventIndex].id,
        participant_id: participantId,
        boat_id: assignment?.boat.id ?? null,
        championship_points: points,
        status: points === null ? "pending" : "published",
        source_mode: "official_workbook",
        source_json: JSON.stringify({ importId, sourceHash, eventIndex, mapping, expectedTeamScore, candidateBoatIds: candidates.map((candidate) => candidate.boat.id) }),
        ...timestamps,
      });
      if (assignment) {
        canonicalCrewAssignments.push({
          id: `wdt-2026-stage-crew-${event.id}-${slugify(participant.name)}`,
          event_id: events[eventIndex].id,
          boat_id: assignment.boat.id,
          participant_id: participantId,
          role: "Navigateur",
          source_mode: "inferred_from_official_workbook",
          source_json: JSON.stringify({ importId, sourceHash, mapping, note: "Affectation déduite uniquement lorsque la correspondance points-équipe est unique." }),
          ...timestamps,
        });
      }
      if (points === null) return;
      stageScores.push({
        id: `wdt-2026-stage-score-${event.id}-${slugify(participant.name)}`,
        race_id: race.id,
        participant_id: participantId,
        boat_id: assignment?.boat.id ?? null,
        points,
        source_mode: "official_workbook",
        source_json: JSON.stringify({ importId, sourceHash, eventIndex, mapping, expectedTeamScore, candidateBoatIds: candidates.map((candidate) => candidate.boat.id) }),
        ...timestamps,
      });
      if (!assignment) return;
      crewAssignments.push({
        id: `wdt-2026-crew-${event.id}-${slugify(participant.name)}`,
        entry_id: assignment.entry.id,
        participant_id: participantId,
        role: "Navigateur",
        created_at: importedAt,
      });
      const resultId = `wdt-2026-result-${event.id}-${slugify(assignment.boat.name)}`;
      awards.push({
        id: `wdt-2026-award-${event.id}-${slugify(participant.name)}`,
        result_id: resultId,
        participant_id: participantId,
        points,
        mode: "official_workbook",
        snapshot_json: JSON.stringify({ importId, sourceHash, mapping }),
        created_at: importedAt,
      });
    });
  });

  return {
    season: [{ id: seasonId, name: season.name, slug: season.slug, year: season.year, status: "active", starts_on: season.startsOn, ends_on: season.endsOn, archived_at: null, ...timestamps }],
    rules: [{
      id: ruleId,
      name: "Règlement officiel WDT 2026",
      version: 1,
      status: "published",
      config_json: JSON.stringify({
        direction: "low",
        positionPoints: { "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7 },
        participationPoints: 7,
        statusPoints: { dnf: 7, dns: 7, dsq: 7 },
        individualMode: "manual",
        roleWeights: {},
        tieBreakers: ["best_recent"],
        wdt: {
          team: { aggregation: "sum", direction: "low", source: "points de championnat par étape dans le classeur officiel" },
          individual: { aggregation: "sum", direction: "high", source: "points individuels par étape dans le classeur officiel" },
        },
      }),
      published_at: importedAt,
      archived_at: null,
      ...timestamps,
    }],
    events,
    races,
    boats,
    participants,
    entries,
    results,
    stageScores,
    crewAssignments,
    awards,
    canonicalTeamResults,
    canonicalIndividualScores,
    canonicalCrewAssignments,
    imports: [{
      id: importId,
      season_id: seasonId,
      source_name: "Classement WDT 2026.xlsx",
      source_hash: sourceHash,
      status: "completed",
      summary_json: JSON.stringify({ stages: events.length, completedStages: season.events.filter((event) => event.status === "completed").length, teams: boats.length, sailors: participants.length, stageTeamResults: canonicalTeamResults.length, stageIndividualScores: canonicalIndividualScores.length, inferredStageCrewAssignments: canonicalCrewAssignments.length }),
      imported_at: importedAt,
    }],
  };
}

async function run() {
  const sources = await loadSources();
  assertSources(sources);
  const importedAt = isoNow();
  const rows = databaseRows(sources, importedAt);
  const pool = new pg.Pool({ ...connectionConfig(), max: 1, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 10_000, allowExitOnIdle: true });
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("set local statement_timeout = '30s'");
    await upsertRows(client, "seasons", ["id", "name", "slug", "year", "status", "starts_on", "ends_on", "archived_at", "created_at", "updated_at"], rows.season, "on conflict (id) do update set name=excluded.name, slug=excluded.slug, year=excluded.year, status=excluded.status, starts_on=excluded.starts_on, ends_on=excluded.ends_on, archived_at=excluded.archived_at, updated_at=excluded.updated_at");
    await upsertRows(client, "scoring_rule_versions", ["id", "name", "version", "status", "config_json", "published_at", "archived_at", "created_at", "updated_at"], rows.rules, "on conflict (id) do update set name=excluded.name, version=excluded.version, status=excluded.status, config_json=excluded.config_json, published_at=excluded.published_at, archived_at=excluded.archived_at, updated_at=excluded.updated_at");
    await upsertRows(client, "events", ["id", "season_id", "name", "slug", "location_name", "center_lat", "center_lng", "starts_on", "ends_on", "archived_at", "created_at", "updated_at"], rows.events, "on conflict (id) do update set season_id=excluded.season_id, name=excluded.name, slug=excluded.slug, location_name=excluded.location_name, center_lat=excluded.center_lat, center_lng=excluded.center_lng, starts_on=excluded.starts_on, ends_on=excluded.ends_on, archived_at=excluded.archived_at, updated_at=excluded.updated_at");
    await upsertRows(client, "races", ["id", "event_id", "name", "slug", "scheduled_at", "status", "course_version_id", "scoring_rule_version_id", "published_at", "archived_at", "created_at", "updated_at"], rows.races, "on conflict (id) do update set event_id=excluded.event_id, name=excluded.name, slug=excluded.slug, scheduled_at=excluded.scheduled_at, status=excluded.status, scoring_rule_version_id=excluded.scoring_rule_version_id, published_at=excluded.published_at, archived_at=excluded.archived_at, updated_at=excluded.updated_at");
    await upsertRows(client, "boats", ["id", "name", "slug", "sail_number", "model", "color", "archived_at", "created_at", "updated_at"], rows.boats, "on conflict (id) do update set name=excluded.name, slug=excluded.slug, sail_number=excluded.sail_number, model=excluded.model, color=excluded.color, archived_at=excluded.archived_at, updated_at=excluded.updated_at");
    await upsertRows(client, "participants", ["id", "name", "slug", "nationality", "public_visible", "archived_at", "created_at", "updated_at"], rows.participants, "on conflict (id) do update set name=excluded.name, slug=excluded.slug, nationality=excluded.nationality, public_visible=excluded.public_visible, archived_at=excluded.archived_at, updated_at=excluded.updated_at");
    await upsertRows(client, "race_entries", ["id", "race_id", "boat_id", "start_number", "status", "created_at"], rows.entries, "on conflict (id) do update set race_id=excluded.race_id, boat_id=excluded.boat_id, start_number=excluded.start_number, status=excluded.status");
    await upsertRows(client, "results", ["id", "entry_id", "position", "elapsed_seconds", "status", "penalty_points", "penalty_note", "boat_points", "scoring_snapshot_json", "finalized_at", "updated_at"], rows.results, "on conflict (id) do update set entry_id=excluded.entry_id, position=excluded.position, elapsed_seconds=excluded.elapsed_seconds, status=excluded.status, penalty_points=excluded.penalty_points, penalty_note=excluded.penalty_note, boat_points=excluded.boat_points, scoring_snapshot_json=excluded.scoring_snapshot_json, finalized_at=excluded.finalized_at, updated_at=excluded.updated_at");
    await upsertRows(client, "individual_stage_scores", ["id", "race_id", "participant_id", "boat_id", "points", "source_mode", "source_json", "created_at", "updated_at"], rows.stageScores, "on conflict (id) do update set race_id=excluded.race_id, participant_id=excluded.participant_id, boat_id=excluded.boat_id, points=excluded.points, source_mode=excluded.source_mode, source_json=excluded.source_json, updated_at=excluded.updated_at");
    await upsertRows(client, "crew_assignments", ["id", "entry_id", "participant_id", "role", "created_at"], rows.crewAssignments, "on conflict (id) do update set entry_id=excluded.entry_id, participant_id=excluded.participant_id, role=excluded.role");
    await upsertRows(client, "individual_awards", ["id", "result_id", "participant_id", "points", "mode", "snapshot_json", "created_at"], rows.awards, "on conflict (id) do update set result_id=excluded.result_id, participant_id=excluded.participant_id, points=excluded.points, mode=excluded.mode, snapshot_json=excluded.snapshot_json");
    await upsertRows(client, "stage_team_results", ["id", "event_id", "boat_id", "final_position", "championship_points", "status", "source_mode", "source_json", "finalized_at", "created_at", "updated_at"], rows.canonicalTeamResults, "on conflict (id) do update set event_id=excluded.event_id, boat_id=excluded.boat_id, final_position=excluded.final_position, championship_points=excluded.championship_points, status=excluded.status, source_mode=excluded.source_mode, source_json=excluded.source_json, finalized_at=excluded.finalized_at, updated_at=excluded.updated_at");
    await upsertRows(client, "stage_individual_scores", ["id", "event_id", "participant_id", "boat_id", "championship_points", "status", "source_mode", "source_json", "created_at", "updated_at"], rows.canonicalIndividualScores, "on conflict (id) do update set event_id=excluded.event_id, participant_id=excluded.participant_id, boat_id=excluded.boat_id, championship_points=excluded.championship_points, status=excluded.status, source_mode=excluded.source_mode, source_json=excluded.source_json, updated_at=excluded.updated_at");
    await upsertRows(client, "stage_crew_assignments", ["id", "event_id", "boat_id", "participant_id", "role", "source_mode", "source_json", "created_at", "updated_at"], rows.canonicalCrewAssignments, "on conflict (id) do update set event_id=excluded.event_id, boat_id=excluded.boat_id, participant_id=excluded.participant_id, role=excluded.role, source_mode=excluded.source_mode, source_json=excluded.source_json, updated_at=excluded.updated_at");
    await upsertRows(client, "data_imports", ["id", "season_id", "source_name", "source_hash", "status", "summary_json", "imported_at"], rows.imports, "on conflict (source_hash) do update set id=excluded.id, season_id=excluded.season_id, source_name=excluded.source_name, status=excluded.status, summary_json=excluded.summary_json, imported_at=excluded.imported_at");
    await client.query("commit");
    console.log(JSON.stringify({ imported: true, season: "wdt-2026", stages: rows.events.length, teams: rows.boats.length, sailors: rows.participants.length, stageTeamResults: rows.canonicalTeamResults.length, stageIndividualScores: rows.canonicalIndividualScores.length, inferredStageCrewAssignments: rows.canonicalCrewAssignments.length }, null, 2));
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

await run();
