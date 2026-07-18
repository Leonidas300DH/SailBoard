import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("distingue les étapes passées en cyan et la sélection en rouge", async () => {
  const [tokens, mapStyles, timeline, seasonMap] = await Promise.all([
    readFile(new URL("app/styles/tokens.css", root), "utf8"),
    readFile(new URL("app/styles/map-hud.css", root), "utf8"),
    readFile(new URL("app/styles/timeline.css", root), "utf8"),
    readFile(new URL("components/season/SeasonMap.tsx", root), "utf8"),
  ]);

  assert.match(tokens, /--past-race: #35b8ff/);
  assert.match(mapStyles, /race-marker\[data-status="completed"\] i \{ background: var\(--past-race\)/);
  assert.match(mapStyles, /race-marker\.selected\[data-status="completed"\] i \{[^}]*background: var\(--danger\)/);
  assert.match(mapStyles, /\.race-marker\.selected span strong \{[^}]*-webkit-text-stroke: 1px rgba\(255,255,255,\.98\)/);
  assert.match(timeline, /timeline-node-marker \{[^}]*background: var\(--past-race\)/);
  assert.match(timeline, /timeline-node\.selected \.timeline-node-marker \{[^}]*background: var\(--danger\)/);
  assert.match(seasonMap, /<i aria-hidden="true">\$\{raceIndex \+ 1\}<\/i>/);
  assert.match(seasonMap, /classList\.toggle\("selected"/);
  assert.doesNotMatch(seasonMap, /selected-route|route-anim|useRouteAnimation/);
});

test("garde les noms courts visibles sur la carte desktop sans afficher les dates", async () => {
  const [mapStyles, seasonMap] = await Promise.all([
    readFile(new URL("app/styles/map-hud.css", root), "utf8"),
    readFile(new URL("components/season/SeasonMap.tsx", root), "utf8"),
  ]);

  assert.match(mapStyles, /@media \(min-width: 761px\) \{[\s\S]*?\.race-marker span \{ opacity: 1; \}/);
  assert.match(mapStyles, /\.race-marker span small \{ opacity: 0;/);
  assert.match(mapStyles, /\.race-marker:hover span small, \.race-marker\.selected span small \{ opacity: 1; \}/);
  assert.match(seasonMap, /LABEL_POSITIONS/);
  assert.match(seasonMap, /element\.dataset\.labelPosition = labelPosition/);
});

test("sépare les étapes bretonnes proches pour conserver chaque zone de clic", async () => {
  const seasonMap = await readFile(new URL("components/season/SeasonMap.tsx", root), "utf8");

  assert.match(seasonMap, /const MARKER_OFFSETS/);
  assert.match(seasonMap, /"spi-ouest-france": \[-32, 22\]/);
  assert.match(seasonMap, /"trophee-ycca": \[30, 30\]/);
  assert.match(seasonMap, /"challenge-an-avel-braz": \[32, -22\]/);
  assert.match(seasonMap, /offset: MARKER_OFFSETS\[race\.id\] \?\? \[0, 0\]/);
});
