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

test("les réglages admin activent par défaut la carte tactique et toutes ses couches", async () => {
  const [settings, admin, seasonMap] = await Promise.all([
    readFile(new URL("lib/map-settings.ts", root), "utf8"),
    readFile(new URL("components/AdminConsole.tsx", root), "utf8"),
    readFile(new URL("components/season/SeasonMap.tsx", root), "utf8"),
  ]);

  assert.match(settings, /defaultMode: "tactical"/);
  for (const option of ["showAircraft", "showVessels", "showCityLights", "showClouds"]) {
    assert.match(settings, new RegExp(`${option}: true`));
    assert.match(admin, new RegExp(option));
    assert.match(seasonMap, new RegExp(option));
  }
  assert.match(admin, /\/api\/admin\/settings/);
  assert.match(seasonMap, /mapModeOverride \?\? displaySettings\.defaultMode/);
});

test("la navigation publique remplace Admin par des Settings locaux", async () => {
  const [navigation, championshipNav, settingsRoom, settingsClient] = await Promise.all([
    readFile(new URL("lib/navigation.ts", root), "utf8"),
    readFile(new URL("components/shell/ChampionshipNav.tsx", root), "utf8"),
    readFile(new URL("components/settings/SettingsRoom.tsx", root), "utf8"),
    readFile(new URL("lib/map-settings-client.ts", root), "utf8"),
  ]);

  assert.match(navigation, /"settings"/);
  assert.doesNotMatch(navigation, /href: "\/admin"/);
  assert.match(championshipNav, /href="\/settings"/);
  assert.doesNotMatch(championshipNav, /href="\/admin"/);
  assert.match(settingsRoom, /Affichage de cet appareil/);
  assert.match(settingsRoom, /saveMapDisplaySettings/);
  assert.match(settingsClient, /localStorage/);
  assert.match(settingsClient, /sailboard:map-display:v1/);
});

test("les couches de vie tactiques sont desktop, animées et branchées sur des sources réelles", async () => {
  const [layers, aircraftRoute, vesselRoute, styles, env, shipIcon] = await Promise.all([
    readFile(new URL("components/map/useTacticalMapLayers.ts", root), "utf8"),
    readFile(new URL("app/api/map-traffic/aircraft/route.ts", root), "utf8"),
    readFile(new URL("app/api/map-traffic/vessels/route.ts", root), "utf8"),
    readFile(new URL("app/styles/map-hud.css", root), "utf8"),
    readFile(new URL(".env.example", root), "utf8"),
    readFile(new URL("public/icons/tactical-ship.svg", root), "utf8"),
  ]);

  assert.match(layers, /tiles\.openfreemap\.org\/planet/);
  assert.match(layers, /emodnet:contours/);
  assert.match(layers, /maplibre-contour/);
  assert.match(layers, /requestAnimationFrame\(animate\)/);
  assert.match(layers, /stableAircraftSample/);
  assert.match(layers, /% 2 === 0/);
  assert.match(layers, /liveAircraftRef\.current = stableAircraftSample\(aircraft\.points\)/);
  assert.doesNotMatch(layers, /ROAD_MOTION_PATHS/);
  assert.doesNotMatch(layers, /tactical-road-traffic/);
  assert.match(layers, /SHIPPING_LANES/);
  assert.match(layers, /FALLBACK_AIR_ROUTES/);
  assert.match(layers, /tactical-traffic-marker--\$\{kind\}/);
  assert.match(layers, /\/icons\/tactical-plane\.svg/);
  assert.match(layers, /\/icons\/tactical-ship\.svg/);
  assert.match(layers, /data\.tooltip|dataset\.tooltip/);
  assert.match(layers, /aircraftVisualAltitude/);
  assert.match(layers, /tactical-aircraft-shadow/);
  assert.match(layers, /if \(kind === "vessel"\) return point\.coordinates/);
  assert.match(layers, /record\.element\.dataset\.coordinate/);
  assert.match(layers, /offset: \[0, 0\]/);
  assert.doesNotMatch(layers, /kind === "vessel" \? \[16, -18\]/);
  assert.match(layers, /kind === "road" \? 10 : 2/);
  assert.match(layers, /kind === "road" \? 32 : 1/);
  assert.match(aircraftRoute, /api\.airplanes\.live/);
  assert.match(aircraftRoute, /aircraft\.alt_baro/);
  assert.match(aircraftRoute, /aircraft\.alt_geom/);
  assert.match(aircraftRoute, /altitudeFt: aircraftAltitudeFt/);
  assert.match(aircraftRoute, /s-maxage=300/);
  assert.match(vesselRoute, /AISSTREAM_API_KEY/);
  assert.match(vesselRoute, /wss:\/\/stream\.aisstream\.io/);
  assert.match(vesselRoute, /event\.data instanceof Blob/);
  assert.match(vesselRoute, /await event\.data\.text\(\)/);
  assert.match(vesselRoute, /message\.Sog/);
  assert.match(vesselRoute, /message\.Cog/);
  assert.match(vesselRoute, /\[\[45\.7, -7\.1\], \[49\.4, 0\.8\]\]/);
  assert.match(env, /AISSTREAM_API_KEY=/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.map-mode-control \{ display: none; \}/);
  assert.match(styles, /\.tactical-traffic-marker--aircraft::before/);
  assert.match(styles, /\.tactical-aircraft-shadow/);
  assert.match(styles, /var\(--aircraft-lift\)/);
  assert.match(styles, /\.tactical-traffic-marker \{ position: absolute;/);
  assert.doesNotMatch(styles, /\.tactical-traffic-marker \{ position: relative;/);
  assert.match(shipIcon, /Lucide Navigation2 icon/);
  assert.match(shipIcon, /<polygon points="12 2 19 21 12 17 5 21 12 2"/);
});

test("les nuages tactiques ont des passes de volume séparées", async () => {
  const clouds = await readFile(new URL("components/map/CloudLayer.tsx", root), "utf8");
  assert.match(clouds, /CloudTextureSet/);
  assert.match(clouds, /tile\.shadow/);
  assert.match(clouds, /tile\.vapor/);
  assert.match(clouds, /tile\.core/);
  assert.match(clouds, /globalCompositeOperation = "source-over"/);
  assert.match(clouds, /globalCompositeOperation = "screen"/);
  assert.match(clouds, /globalCompositeOperation = "lighter"/);
  assert.match(clouds, /cloud-layer--tactical/);
  assert.match(clouds, /tactical\s*\? 0\.21/);
  assert.match(clouds, /tactical \? 0\.76/);
  assert.doesNotMatch(clouds, /Math\.random/);
});
