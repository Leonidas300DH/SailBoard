import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("garde le rail de classement compact et respecte la casse des navigateurs", async () => {
  const [controlRoom, styles] = await Promise.all([
    readFile(new URL("components/ChampionshipControlRoom.tsx", root), "utf8"),
    readFile(new URL("app/styles/content.css", root), "utf8"),
  ]);

  assert.match(controlRoom, /control-body--\$\{mode\}/);
  assert.match(controlRoom, /rank-control-grid--\$\{mode\}/);
  assert.match(controlRoom, /--completed-stage-count/);
  assert.match(controlRoom, /standings-score mono \$\{event\.status\}/);
  assert.doesNotMatch(controlRoom, /Calcul officiel/);
  assert.doesNotMatch(controlRoom, /ShieldCheck/);
  assert.match(styles, /clamp\(330px,28vw,430px\)/);
  assert.match(styles, /rank-control-grid--individual \.standings-name strong/);
  assert.match(styles, /\.intel-score \{[^}]*grid-template-columns: 1fr auto auto/);
});
