import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("le mode tactique reste un switch de peinture et préserve la chronologie", async () => {
  const [seasonMap, style, tacticalLayers, chronologyAnimation] = await Promise.all([
    readFile(new URL("components/season/SeasonMap.tsx", root), "utf8"),
    readFile(new URL("lib/map/style.ts", root), "utf8"),
    readFile(new URL("components/map/useTacticalMapLayers.ts", root), "utf8"),
    readFile(new URL("components/map/useSeasonChronologyAnimation.ts", root), "utf8"),
  ]);

  assert.match(seasonMap, /Natural/);
  assert.match(seasonMap, /Tactical/);
  assert.match(seasonMap, /min-width: 761px/);
  assert.match(seasonMap, /effectiveMapMode/);
  assert.match(seasonMap, /useSeasonChronologyAnimation\(\{ mapRef, isReady, legs: chronologyLegs \}\)/);
  assert.match(style, /applySeasonMapMode/);
  assert.doesNotMatch(style, /setStyle\(/);
  assert.doesNotMatch(tacticalLayers, /season-chronology.*setData/);
  assert.match(chronologyAnimation, /legDurationMs = 9_000/);
  assert.match(chronologyAnimation, /startedAt \?\?= now/);
});

test("les couches de vie tactiques sont desktop, animées et branchées sur des sources réelles", async () => {
  const [layers, aircraftRoute, vesselRoute, styles, env] = await Promise.all([
    readFile(new URL("components/map/useTacticalMapLayers.ts", root), "utf8"),
    readFile(new URL("app/api/map-traffic/aircraft/route.ts", root), "utf8"),
    readFile(new URL("app/api/map-traffic/vessels/route.ts", root), "utf8"),
    readFile(new URL("app/styles/map-hud.css", root), "utf8"),
    readFile(new URL(".env.example", root), "utf8"),
  ]);

  assert.match(layers, /tiles\.openfreemap\.org\/planet/);
  assert.match(layers, /emodnet:contours/);
  assert.match(layers, /maplibre-contour/);
  assert.match(layers, /requestAnimationFrame\(animate\)/);
  assert.match(layers, /ROAD_MOTION_PATHS/);
  assert.match(layers, /SHIPPING_LANES/);
  assert.match(layers, /FALLBACK_AIR_ROUTES/);
  assert.match(aircraftRoute, /api\.airplanes\.live/);
  assert.match(aircraftRoute, /s-maxage=300/);
  assert.match(vesselRoute, /AISSTREAM_API_KEY/);
  assert.match(vesselRoute, /wss:\/\/stream\.aisstream\.io/);
  assert.match(vesselRoute, /event\.data instanceof Blob/);
  assert.match(vesselRoute, /await event\.data\.text\(\)/);
  assert.match(env, /AISSTREAM_API_KEY=/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.map-mode-control \{ display: none; \}/);
});

test("les nuages tactiques ont des passes de volume séparées", async () => {
  const clouds = await readFile(new URL("components/map/CloudLayer.tsx", root), "utf8");
  assert.match(clouds, /CloudTextureSet/);
  assert.match(clouds, /tile\.shadow/);
  assert.match(clouds, /tile\.vapor/);
  assert.match(clouds, /tile\.core/);
  assert.match(clouds, /globalCompositeOperation = "source-over"/);
  assert.match(clouds, /globalCompositeOperation = "screen"/);
  assert.match(clouds, /cloud-layer--tactical/);
  assert.doesNotMatch(clouds, /Math\.random/);
});
