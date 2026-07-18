/** @typedef {{ direction: "high"|"low", positionPoints: Record<string, number>, participationPoints: number, statusPoints: Record<string, number>, individualMode: "same_as_boat"|"split_evenly"|"weighted_roles"|"manual", roleWeights: Record<string, number>, tieBreakers: string[] }} ScoringConfig */

/**
 * @param {ScoringConfig} config
 * @param {{position: number|null, status: "classified"|"dnf"|"dns"|"dsq", penaltyPoints?: number}} result
 */
export function scoreBoat(config, result) {
  const base = result.status === "classified" && result.position
    ? (config.positionPoints[String(result.position)] ?? config.participationPoints)
    : (config.statusPoints[result.status] ?? 0);
  return roundPoints(base - (result.penaltyPoints ?? 0));
}

/**
 * @param {ScoringConfig} config
 * @param {number} boatPoints
 * @param {Array<{participantId: string, role: string}>} crew
 * @param {Record<string, number>} [manual]
 */
export function scoreCrew(config, boatPoints, crew, manual = {}) {
  if (crew.length === 0) return [];
  if (config.individualMode === "manual") {
    return crew.map((member) => ({ ...member, points: roundPoints(manual[member.participantId] ?? 0) }));
  }
  if (config.individualMode === "split_evenly") {
    const share = roundPoints(boatPoints / crew.length);
    return crew.map((member) => ({ ...member, points: share }));
  }
  if (config.individualMode === "weighted_roles") {
    const totalWeight = crew.reduce((sum, member) => sum + (config.roleWeights[member.role] ?? 1), 0);
    return crew.map((member) => ({
      ...member,
      points: roundPoints(boatPoints * (config.roleWeights[member.role] ?? 1) / totalWeight),
    }));
  }
  return crew.map((member) => ({ ...member, points: roundPoints(boatPoints) }));
}

/** @param {number} value */
export function roundPoints(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** @param {Array<number|null|undefined>} scores */
export function totalScores(scores) {
  return roundPoints(scores.reduce((sum, score) => sum + (score ?? 0), 0));
}

/**
 * Standard competition ranking: equal totals share a rank and the next rank
 * skips the occupied places (1, 2, 2, 4…).
 * @template {{points: number}} T
 * @param {T[]} rows
 * @param {"high"|"low"} direction
 * @returns {Array<T & {rank: number}>}
 */
export function rankScores(rows, direction) {
  const sorted = [...rows].sort((left, right) => direction === "low"
    ? left.points - right.points
    : right.points - left.points);
  return sorted.map((row, index) => ({
    ...row,
    rank: sorted.findIndex((candidate) => candidate.points === row.points) + 1 || index + 1,
  }));
}
