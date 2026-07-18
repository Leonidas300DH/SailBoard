import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("configure une application Next.js Vercel sans dépendance Sites", async () => {
  const packageJson = await readFile(new URL("package.json", root), "utf8");
  assert.match(packageJson, /"dev": "next dev"/);
  assert.match(packageJson, /better-auth/);
  assert.match(packageJson, /"pg"/);
  assert.doesNotMatch(packageJson, /vinext|wrangler|cloudflare/);
  await assert.rejects(readFile(new URL(".openai/hosting.json", root), "utf8"));
});

test("couvre le modèle relationnel V1 et les instantanés de points", async () => {
  const migration = (await readdir(new URL("drizzle-postgres/", root))).find((file) => file.endsWith(".sql"));
  assert.ok(migration);
  const sql = await readFile(new URL(`drizzle-postgres/${migration}`, root), "utf8");
  for (const table of ["admins", "admin_access_requests", "audit_logs", "seasons", "events", "races", "course_versions", "course_marks", "boats", "participants", "race_entries", "crew_assignments", "scoring_rule_versions", "results", "individual_awards"]) {
    assert.ok(sql.includes(`CREATE TABLE \"${table}\"`), `migration contains ${table}`);
  }
  assert.match(sql, /scoring_snapshot_json/);
  assert.match(sql, /archived_at/);
});

test("intègre l’instantané individuel WDT 2026 sans inventer le 43e score", async () => {
  const snapshot = JSON.parse(await readFile(new URL("data/wdt-2026-individual-standings.json", root), "utf8"));
  assert.equal(snapshot.completedRaces, 4);
  assert.equal(snapshot.declaredClassifiedCount, 43);
  assert.equal(snapshot.namedScoresCount, 42);
  assert.equal(snapshot.rows.length, 42);
  assert.deepEqual(snapshot.rows[0], { rank: 1, name: "CHAMPANHAC Benoît", points: 17 });
  assert.equal(snapshot.rows.find((row) => row.name === "GIRARDOT Simon")?.points, 9);
  assert.equal(snapshot.rows.find((row) => row.name === "ELY Bastien")?.points, 2);
});

test("utilise Google OAuth et une base PostgreSQL standard", async () => {
  const auth = await readFile(new URL("lib/auth-server.ts", root), "utf8");
  const database = await readFile(new URL("db/index.ts", root), "utf8");
  const databaseQueries = await readFile(new URL("lib/database.ts", root), "utf8");
  const postgresConfig = await readFile(new URL("lib/postgres-config.ts", root), "utf8");
  assert.match(auth, /betterAuth/);
  assert.match(auth, /socialProviders/);
  assert.match(auth, /google/);
  assert.match(database, /new Pool/);
  assert.match(database, /BEGIN/);
  assert.match(database, /ROLLBACK/);
  assert.match(databaseQueries, /Number\(count\?\.count \?\? 0\) === 0/);
  assert.match(postgresConfig, /rejectUnauthorized: true/);
});

test("protège toutes les mutations d’administration côté serveur", async () => {
  for (const route of ["manage", "course", "results"]) {
    const source = await readFile(new URL(`app/api/admin/${route}/route.ts`, root), "utf8");
    assert.match(source, /requireAdmin\(/);
    assert.match(source, /writeAudit\(/);
  }
  for (const route of ["access", "rules"]) {
    const source = await readFile(new URL(`app/api/admin/${route}/route.ts`, root), "utf8");
    assert.match(source, /requireOwner\(/);
    assert.match(source, /writeAudit\(/);
  }
});
