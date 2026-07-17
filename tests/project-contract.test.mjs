import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("configure une application Sites D1 sans stockage de fichiers", async () => {
  const hosting = JSON.parse(await readFile(new URL(".openai/hosting.json", root), "utf8"));
  assert.equal(hosting.d1, "DB");
  assert.equal(hosting.r2, null);
  const packageJson = await readFile(new URL("package.json", root), "utf8");
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(readdir(new URL("app/_sites-preview/", root)));
});

test("couvre le modèle relationnel V1 et les instantanés de points", async () => {
  const migration = (await readdir(new URL("drizzle/", root))).find((file) => file.endsWith(".sql"));
  assert.ok(migration);
  const sql = await readFile(new URL(`drizzle/${migration}`, root), "utf8");
  for (const table of ["admins", "admin_access_requests", "audit_logs", "seasons", "events", "races", "course_versions", "course_marks", "boats", "participants", "race_entries", "crew_assignments", "scoring_rule_versions", "results", "individual_awards"]) {
    assert.ok(sql.includes(`CREATE TABLE \`${table}\``), `migration contains ${table}`);
  }
  assert.match(sql, /scoring_snapshot_json/);
  assert.match(sql, /archived_at/);
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
