import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("affiche les équipages connus et masque les chronos absents", async () => {
  const [wdt, seasonView, experience, rail, styles] = await Promise.all([
    readFile(new URL("lib/wdt-2026.ts", root), "utf8"),
    readFile(new URL("lib/season-view.ts", root), "utf8"),
    readFile(new URL("components/race/RaceExperience.tsx", root), "utf8"),
    readFile(new URL("components/race/CompetitorRail.tsx", root), "utf8"),
    readFile(new URL("app/styles/race.css", root), "utf8"),
  ]);

  assert.match(wdt, /export function wdtCrewForEvent/);
  assert.match(wdt, /export function wdtTeamForParticipantEvent/);
  assert.match(wdt, /matchingTeams\.length !== 1/);
  assert.match(seasonView, /crew: wdtCrewForEvent\(team\.name, eventIndex\)/);
  assert.match(rail, /hasTiming \? <div[^>]*><span><DecodeText text="Temps"/);
  assert.match(rail, /hasTiming && gap != null \? <div[^>]*><span><DecodeText text="Écart 1er"/);
  assert.match(rail, /Équipage de l’étape/);
  assert.match(rail, /Composition non publiée/);
  assert.match(rail, /classements\?vue=individuel&selection=/);
  assert.doesNotMatch(rail, /rail-crew-summary/);
  assert.match(experience, /timelineSelectedSlug=\{race\.slug\}/);
  assert.doesNotMatch(experience, /Tracé|tracé|race-footer/);
  assert.match(styles, /\.rail-crew-points strong \{[^}]*white-space: nowrap/);
  assert.doesNotMatch(styles, /\.race-footer/);
});
