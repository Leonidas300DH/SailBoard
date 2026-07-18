import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("distingue les étapes passées en cyan et la sélection en rouge", async () => {
  const [tokens, mapStyles, timeline, shell, seasonMap, routeAnimation] = await Promise.all([
    readFile(new URL("app/styles/tokens.css", root), "utf8"),
    readFile(new URL("app/styles/map-hud.css", root), "utf8"),
    readFile(new URL("app/styles/timeline.css", root), "utf8"),
    readFile(new URL("app/styles/shell.css", root), "utf8"),
    readFile(new URL("components/season/SeasonMap.tsx", root), "utf8"),
    readFile(new URL("components/map/useRouteAnimation.ts", root), "utf8"),
  ]);

  assert.match(tokens, /--past-race: #35b8ff/);
  assert.match(mapStyles, /race-marker\[data-status="completed"\] i \{ background: var\(--past-race\)/);
  assert.match(mapStyles, /race-marker\.selected\[data-status="completed"\] i \{[^}]*background: var\(--danger\)/);
  assert.match(timeline, /timeline-node-marker \{[^}]*background: var\(--past-race\)/);
  assert.match(timeline, /timeline-node\.selected \.timeline-node-marker \{[^}]*background: var\(--danger\)/);
  assert.match(shell, /nav-stage\[data-status="completed"\] \.nav-stage-hex \{ background: var\(--past-race\)/);
  assert.match(shell, /nav-stage\.selected\[data-status="completed"\] \.nav-stage-hex \{[^}]*background: var\(--danger\)/);
  assert.match(seasonMap, /const SELECTED_RACE = "#ff1e1e"/);
  assert.match(seasonMap, /<i aria-hidden="true">\$\{raceIndex \+ 1\}<\/i>/);
  assert.match(seasonMap, /trailColor: SELECTED_TRAIL/);
  assert.match(routeAnimation, /cometExpression\(progress, trailColor, wakeColor\)/);
});
