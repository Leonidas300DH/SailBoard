import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("partage les hauteurs du chrome mobile et conserve la carte de saison", async () => {
  const [tokens, responsive, season, timeline] = await Promise.all([
    readFile(new URL("app/styles/tokens.css", root), "utf8"),
    readFile(new URL("app/styles/responsive.css", root), "utf8"),
    readFile(new URL("app/styles/season.css", root), "utf8"),
    readFile(new URL("app/styles/timeline.css", root), "utf8"),
  ]);

  assert.match(tokens, /--mobile-nav-height: 60px/);
  assert.match(tokens, /--mobile-timeline-height: 88px/);
  assert.match(season, /\.season-ocean-shell \{ min-height: 0;[\s\S]*?var\(--mobile-nav-height\)/);
  assert.match(season, /season-ocean-shell > \.app-shell-content \{ height: 100%; min-height: 0; \}/);
  assert.match(responsive, /\.map-wrap \{ min-height: 42vh; min-height: 42dvh; \}/);
  assert.match(timeline, /\.season-timeline \{ height: var\(--mobile-timeline-height\); \}/);
});

test("ouvre les détails mobiles dans des HUD compacts au-dessus de la timeline", async () => {
  const [responsive, race] = await Promise.all([
    readFile(new URL("app/styles/responsive.css", root), "utf8"),
    readFile(new URL("components/race/RaceExperience.tsx", root), "utf8"),
  ]);

  assert.match(responsive, /\.leaderboard-detail \{ position: fixed;[\s\S]*?var\(--mobile-timeline-height\)/);
  assert.match(responsive, /\.competitor-intel\.mobile-open \{ position: fixed;[\s\S]*?var\(--mobile-timeline-height\)/);
  assert.doesNotMatch(race, /scrollIntoView/);
});

test("garde une navigation mobile nommée et sept onglets admin", async () => {
  const [responsive, admin] = await Promise.all([
    readFile(new URL("app/styles/responsive.css", root), "utf8"),
    readFile(new URL("app/styles/admin.css", root), "utf8"),
  ]);

  assert.match(responsive, /\.nav-link span, \.nav-sublink span \{ display: block;/);
  assert.match(admin, /\.admin-tabs \{ width: 100%; grid-template-columns: repeat\(7,1fr\); \}/);
  assert.match(admin, /\.access-gate \{ min-height: 100dvh; padding: 12px; \}/);
});

test("écarte les étapes sur tablette et retire le libellé technique ERA5", async () => {
  const [timeline, weather] = await Promise.all([
    readFile(new URL("app/styles/timeline.css", root), "utf8"),
    readFile(new URL("lib/weather.ts", root), "utf8"),
  ]);

  assert.match(timeline, /@media \(min-width: 761px\) and \(max-width: 1050px\)[\s\S]*?min-width: 920px/);
  assert.doesNotMatch(weather, /Open-Meteo · archive ERA5/);
});
