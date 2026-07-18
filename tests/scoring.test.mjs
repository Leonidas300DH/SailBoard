import assert from "node:assert/strict";
import test from "node:test";
import { rankScores, scoreBoat, scoreCrew, totalScores } from "../lib/scoring.mjs";

const rule = {
  direction: "high",
  positionPoints: { "1": 18, "2": 15, "3": 12 },
  participationPoints: 1,
  statusPoints: { dnf: 1, dns: 0, dsq: 0 },
  individualMode: "same_as_boat",
  roleWeights: { Barre: 2, Réglage: 1, Avant: 1 },
  tieBreakers: ["wins"],
};

const crew = [
  { participantId: "a", role: "Barre" },
  { participantId: "b", role: "Réglage" },
  { participantId: "c", role: "Avant" },
];

test("calcule positions, pénalités et statuts spéciaux", () => {
  assert.equal(scoreBoat(rule, { position: 1, status: "classified" }), 18);
  assert.equal(scoreBoat(rule, { position: 2, status: "classified", penaltyPoints: 2.5 }), 12.5);
  assert.equal(scoreBoat(rule, { position: null, status: "dnf" }), 1);
  assert.equal(scoreBoat(rule, { position: null, status: "dns" }), 0);
  assert.equal(scoreBoat(rule, { position: null, status: "dsq" }), 0);
});

test("prend en charge les quatre modes d’attribution individuelle", () => {
  assert.deepEqual(scoreCrew(rule, 12, crew).map((award) => award.points), [12, 12, 12]);
  assert.deepEqual(scoreCrew({ ...rule, individualMode: "split_evenly" }, 12, crew).map((award) => award.points), [4, 4, 4]);
  assert.deepEqual(scoreCrew({ ...rule, individualMode: "weighted_roles" }, 12, crew).map((award) => award.points), [6, 3, 3]);
  assert.deepEqual(scoreCrew({ ...rule, individualMode: "manual" }, 12, crew, { a: 7, b: 3.5, c: 1.5 }).map((award) => award.points), [7, 3.5, 1.5]);
});

test("un instantané historique reste stable après évolution du barème", () => {
  const historicalSnapshot = structuredClone(rule);
  const initial = scoreBoat(historicalSnapshot, { position: 1, status: "classified" });
  const nextVersion = { ...rule, positionPoints: { ...rule.positionPoints, "1": 25 } };
  assert.equal(scoreBoat(nextVersion, { position: 1, status: "classified" }), 25);
  assert.equal(scoreBoat(historicalSnapshot, { position: 1, status: "classified" }), initial);
});

test("calcule les totaux WDT et les rangs dans les deux sens", () => {
  assert.equal(totalScores([1, 2, 5, 2, null, null]), 10);
  assert.deepEqual(
    rankScores([{ name: "A", points: 12 }, { name: "B", points: 16 }, { name: "C", points: 16 }], "high")
      .map(({ name, rank }) => [name, rank]),
    [["B", 1], ["C", 1], ["A", 3]],
  );
  assert.deepEqual(
    rankScores([{ name: "A", points: 14 }, { name: "B", points: 10 }, { name: "C", points: 11 }], "low")
      .map(({ name, rank }) => [name, rank]),
    [["B", 1], ["C", 2], ["A", 3]],
  );
});
