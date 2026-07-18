import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("garde la timeline sur chaque écran public sans évoquer de tracé", async () => {
  const [shell, persistent, season, race, shellStyles, seasonStyles] = await Promise.all([
    readFile(new URL("components/shell/AppShell.tsx", root), "utf8"),
    readFile(new URL("components/season/PersistentSeasonTimeline.tsx", root), "utf8"),
    readFile(new URL("components/season/SeasonControlRoom.tsx", root), "utf8"),
    readFile(new URL("components/race/RaceExperience.tsx", root), "utf8"),
    readFile(new URL("app/styles/shell.css", root), "utf8"),
    readFile(new URL("app/styles/season.css", root), "utf8"),
  ]);

  assert.match(shell, /showPersistentTimeline = true/);
  assert.match(shell, /<PersistentSeasonTimeline selectedSlug=\{timelineSelectedSlug\}/);
  assert.doesNotMatch(persistent, /router\.push/);
  assert.match(persistent, /<RaceHud/);
  assert.match(persistent, /variant="persistent"/);
  assert.match(persistent, /onSelect=\{setOpenedRaceId\}/);
  assert.match(season, /showPersistentTimeline=\{false\}/);
  assert.match(season, /<SeasonTimeline/);
  assert.match(race, /timelineSelectedSlug=\{race\.slug\}/);
  assert.doesNotMatch(race, /Tracé|tracé|Parcours animé/);
  assert.match(shellStyles, /app-shell-content--timeline[^\n]*grid-template-rows: minmax\(0, 1fr\) 118px/);
  assert.match(seasonStyles, /\.race-hud--persistent \{ position: fixed;[^}]*left: 196px;[^}]*top: 88px/);
  assert.doesNotMatch(seasonStyles, /\.season-timeline \{ display: none/);
});
