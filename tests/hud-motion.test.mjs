import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("anime tous les HUD desktop avec un verre sombre et des données progressives", async () => {
  const [counter, decoder, raceHud, profileHud, conditions, standings, competitorRail, seasonCss, shellCss, raceCss, contentCss, mapCss] = await Promise.all([
    readFile(new URL("components/map/CountUpNumber.tsx", root), "utf8"),
    readFile(new URL("components/map/DecodeText.tsx", root), "utf8"),
    readFile(new URL("components/season/RaceHud.tsx", root), "utf8"),
    readFile(new URL("components/shell/NavProfileHud.tsx", root), "utf8"),
    readFile(new URL("components/race/RaceConditions.tsx", root), "utf8"),
    readFile(new URL("components/ChampionshipControlRoom.tsx", root), "utf8"),
    readFile(new URL("components/race/CompetitorRail.tsx", root), "utf8"),
    readFile(new URL("app/styles/season.css", root), "utf8"),
    readFile(new URL("app/styles/shell.css", root), "utf8"),
    readFile(new URL("app/styles/race.css", root), "utf8"),
    readFile(new URL("app/styles/content.css", root), "utf8"),
    readFile(new URL("app/styles/map-hud.css", root), "utf8"),
  ]);

  assert.match(counter, /requestAnimationFrame/);
  assert.match(counter, /prefersReducedMotion/);
  assert.match(decoder, /GLYPHS/);
  assert.match(decoder, /prefersReducedMotion/);
  assert.match(counter, /aria-hidden="true"/);
  assert.match(decoder, /className="sr-only"/);

  for (const component of [raceHud, profileHud, conditions, standings, competitorRail]) {
    assert.match(component, /CountUpNumber/);
    assert.match(component, /DecodeText/);
  }

  assert.match(seasonCss, /\.race-hud \{[^}]*backdrop-filter: blur\(22px\) saturate\(128%\)[^}]*animation: hudAssemble/s);
  assert.match(seasonCss, /\.race-hud \{[^}]*width: min\(340px, calc\(100% - 40px\)\)/s);
  assert.match(seasonCss, /\.race-hud-weather \{[^}]*grid-template-columns: repeat\(3, max-content\)/s);
  assert.match(seasonCss, /\.race-hud-weather svg \{[^}]*color: var\(--hud\)/s);
  assert.match(seasonCss, /\.race-hud-weather > span\[data-tooltip\]::after/);
  assert.match(raceHud, /data-tooltip="Vent moyen : vitesse en nœuds et direction en degrés\."/);
  assert.match(raceHud, /tabIndex=\{0\}/);
  assert.match(shellCss, /\.nav-profile-hud \{[^}]*backdrop-filter: blur\(20px\) saturate\(126%\)[^}]*animation: hudAssemble/s);
  assert.match(raceCss, /\.race-conditions-overlay \{[^}]*backdrop-filter: blur\(20px\) saturate\(126%\)[^}]*animation: hudAssemble/s);
  assert.match(raceCss, /\.leaderboard-detail \{[^}]*backdrop-filter: blur\(20px\) saturate\(126%\)/s);
  assert.match(raceCss, /\.leaderboard\.expanded \.leaderboard-detail \{[^}]*animation: hudRailAssemble/s);
  assert.match(contentCss, /\.competitor-intel \{[^}]*backdrop-filter: blur\(20px\) saturate\(126%\)[^}]*animation: hudAssemble/s);
  assert.match(mapCss, /\.hud-reticle-tag \{[^}]*backdrop-filter: blur\(15px\) saturate\(124%\)[^}]*animation: hudChipAssemble/s);
});

test("baisse les numéros sur la carte sans modifier leur position dans la timeline", async () => {
  const [mapCss, timelineCss] = await Promise.all([
    readFile(new URL("app/styles/map-hud.css", root), "utf8"),
    readFile(new URL("app/styles/timeline.css", root), "utf8"),
  ]);

  assert.match(mapCss, /\.race-marker i \{[^}]*place-items: center;[^}]*padding-bottom: 0;/s);
  assert.match(timelineCss, /\.timeline-node-marker \{[^}]*place-items: center;[^}]*padding-bottom: 2px;/s);
});
