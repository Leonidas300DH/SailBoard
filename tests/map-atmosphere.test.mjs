import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("lie les nuages procéduraux à la caméra inclinée MapLibre", async () => {
  const [cloudLayer, seasonMap, chronology, chronologyAnimation, courseMap, cameraDirector, mapBootstrap] = await Promise.all([
    readFile(new URL("components/map/CloudLayer.tsx", root), "utf8"),
    readFile(new URL("components/season/SeasonMap.tsx", root), "utf8"),
    readFile(new URL("lib/map/season-chronology.ts", root), "utf8"),
    readFile(new URL("components/map/useSeasonChronologyAnimation.ts", root), "utf8"),
    readFile(new URL("components/race/CourseMap.tsx", root), "utf8"),
    readFile(new URL("components/map/useCameraDirector.ts", root), "utf8"),
    readFile(new URL("components/map/useMapLibre.ts", root), "utf8"),
  ]);

  assert.match(cloudLayer, /buildSheets/);
  assert.match(cloudLayer, /map\?\.getPitch\(\)/);
  assert.match(cloudLayer, /map\?\.getBearing\(\)/);
  assert.match(cloudLayer, /map\?\.project\(ATLANTIC_ANCHOR\)/);
  assert.match(cloudLayer, /horizonCompression/);
  assert.match(cloudLayer, /atmosphereVisibilityAtZoom/);
  assert.match(cloudLayer, /smoothstep\(6\.4, 10\.8, zoom\)/);
  assert.match(cloudLayer, /baseAlpha \* zoomVisibility \* sheet\.alpha/);
  assert.match(cloudLayer, /prefersReducedMotion/);
  assert.doesNotMatch(cloudLayer, /Math\.random/);

  assert.match(seasonMap, /maxPitch: 65/);
  assert.match(seasonMap, /pitch: isCompact \? 26 : 34/);
  assert.match(seasonMap, /pitch: 52/);
  assert.match(seasonMap, /season-chronology-depth/);
  assert.match(seasonMap, /season-flow-glint/);
  assert.match(seasonMap, /"line-width": 1\.15/);
  assert.doesNotMatch(seasonMap, /season-chronology-direction/);
  assert.doesNotMatch(seasonMap, /season-flow-particles/);
  assert.match(chronology, /buildCurvedChronology/);
  assert.match(chronology, /inverse \* inverse/);
  assert.match(chronologyAnimation, /chronologyGlintExpression/);
  assert.match(chronologyAnimation, /legDurationMs = 9_000/);
  assert.match(chronologyAnimation, /legTime \/ 0\.9/);
  assert.match(chronologyAnimation, /startedAt \?\?= now/);
  assert.match(chronologyAnimation, /prefersReducedMotion/);
  assert.match(courseMap, /pitch: 42/);
  assert.match(courseMap, /stage-location-halo/);
  assert.match(courseMap, /stage-location-dot/);
  assert.doesNotMatch(courseMap, /route-anim|course-route|useRouteAnimation/);
  assert.match(courseMap, /mapRef=\{mapRef\}/);
  assert.match(cameraDirector, /orientation: CameraOrientation/);
  assert.match(mapBootstrap, /pitch: initial\.pitch \?\? 0/);
});
