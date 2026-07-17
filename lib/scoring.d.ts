import type { ScoringConfig } from "./domain";

export function scoreBoat(
  config: ScoringConfig,
  result: { position: number | null; status: "classified" | "dnf" | "dns" | "dsq"; penaltyPoints?: number },
): number;

export function scoreCrew(
  config: ScoringConfig,
  boatPoints: number,
  crew: Array<{ participantId: string; role: string }>,
  manual?: Record<string, number>,
): Array<{ participantId: string; role: string; points: number }>;

export function roundPoints(value: number): number;
