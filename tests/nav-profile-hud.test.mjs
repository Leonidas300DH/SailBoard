import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("sépare le HUD local du classement complet dans le rail", async () => {
  const [nav, shell, hud, styles] = await Promise.all([
    readFile(new URL("components/shell/ChampionshipNav.tsx", root), "utf8"),
    readFile(new URL("components/shell/AppShell.tsx", root), "utf8"),
    readFile(new URL("components/shell/NavProfileHud.tsx", root), "utf8"),
    readFile(new URL("app/styles/shell.css", root), "utf8"),
  ]);

  assert.match(nav, /<button key=\{`\$\{type\}-\$\{row\.name\}`\}/);
  assert.doesNotMatch(nav, /classements\?vue=bateaux&selection=/);
  assert.doesNotMatch(nav, /classements\?vue=individuel&selection=/);
  assert.match(nav, /href="\/classements\?vue=bateaux"/);
  assert.match(nav, /href="\/classements\?vue=individuel"/);
  assert.doesNotMatch(nav, /<NavProfileHud/);
  assert.match(shell, /<NavProfileHud selection=\{profileHud\}/);
  assert.match(shell, /<ChampionshipNav[^>]+onProfileSelect=\{setProfileHud\}/);

  assert.match(hud, /role="dialog"/);
  assert.match(hud, /aria-modal="false"/);
  assert.match(hud, /event\.key === "Escape"/);
  assert.match(hud, /onSelect\(\{ type: "sailors"/);
  assert.match(hud, /onSelect\(\{ type: "teams"/);
  assert.match(hud, /completedScores\.map/);

  assert.match(styles, /\.nav-profile-hud \{[^}]*position: fixed;[^}]*width: min\(330px/);
  assert.match(styles, /\.nav-profile-hud-identity \{[^}]*min-height: 48px/);
  assert.match(styles, /\.nav-profile-hud-stages \{[^}]*min-height: 36px/);
});
