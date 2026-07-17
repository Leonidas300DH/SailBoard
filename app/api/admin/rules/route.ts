import { NextResponse } from "next/server";
import { getD1 } from "@/db";
import { apiError } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { DEFAULT_SCORING, ensureDatabase, writeAudit } from "@/lib/database";
import type { ScoringConfig } from "@/lib/domain";

export async function POST(request: Request) {
  try {
    const owner = await requireOwner();
    await ensureDatabase();
    const body = await request.json() as Record<string, unknown>;
    const db = getD1();
    const source = body.sourceRuleId ? await db.prepare("SELECT * FROM scoring_rule_versions WHERE id = ?").bind(body.sourceRuleId).first<Record<string, unknown>>() : null;
    const sourceConfig = source ? JSON.parse(String(source.config_json)) as ScoringConfig : DEFAULT_SCORING;
    const positionPoints = Array.isArray(body.positionPoints) ? Object.fromEntries(body.positionPoints.map((value, index) => [String(index + 1), Number(value)])) : sourceConfig.positionPoints;
    if (Object.values(positionPoints).some((value) => !Number.isFinite(value))) throw new Error("Points invalides");
    const config: ScoringConfig = {
      ...sourceConfig,
      direction: body.direction === "low" ? "low" : "high",
      individualMode: ["same_as_boat", "split_evenly", "weighted_roles", "manual"].includes(String(body.individualMode)) ? body.individualMode as ScoringConfig["individualMode"] : "same_as_boat",
      positionPoints,
      participationPoints: Number.isFinite(Number(body.participationPoints)) ? Number(body.participationPoints) : sourceConfig.participationPoints,
      statusPoints: {
        dnf: Number.isFinite(Number((body.statusPoints as Record<string, unknown> | undefined)?.dnf)) ? Number((body.statusPoints as Record<string, unknown>).dnf) : sourceConfig.statusPoints.dnf,
        dns: Number.isFinite(Number((body.statusPoints as Record<string, unknown> | undefined)?.dns)) ? Number((body.statusPoints as Record<string, unknown>).dns) : sourceConfig.statusPoints.dns,
        dsq: Number.isFinite(Number((body.statusPoints as Record<string, unknown> | undefined)?.dsq)) ? Number((body.statusPoints as Record<string, unknown>).dsq) : sourceConfig.statusPoints.dsq,
      },
      roleWeights: {
        Barre: Number.isFinite(Number((body.roleWeights as Record<string, unknown> | undefined)?.Barre)) ? Number((body.roleWeights as Record<string, unknown>).Barre) : sourceConfig.roleWeights.Barre,
        Réglage: Number.isFinite(Number((body.roleWeights as Record<string, unknown> | undefined)?.Réglage)) ? Number((body.roleWeights as Record<string, unknown>).Réglage) : sourceConfig.roleWeights.Réglage,
        Avant: Number.isFinite(Number((body.roleWeights as Record<string, unknown> | undefined)?.Avant)) ? Number((body.roleWeights as Record<string, unknown>).Avant) : sourceConfig.roleWeights.Avant,
      },
      tieBreakers: ["wins", "best_recent", "best_result"].includes(String(body.tieBreaker)) ? [body.tieBreaker as ScoringConfig["tieBreakers"][number]] : sourceConfig.tieBreakers,
    };
    const name = String(source?.name ?? "Barème championnat");
    const maxVersion = await db.prepare("SELECT MAX(version) AS version FROM scoring_rule_versions WHERE name = ?").bind(name).first<{ version: number | null }>();
    const version = Number(maxVersion?.version ?? 0) + 1;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const status = body.action === "publish" ? "published" : "draft";
    await db.prepare("INSERT INTO scoring_rule_versions VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)").bind(id, name, version, status, JSON.stringify(config), status === "published" ? now : null, now, now).run();
    await writeAudit(owner.email, `${status}_scoring_rule`, "scoring_rule_version", id, { sourceId: source?.id, version, config });
    return NextResponse.json({ message: status === "published" ? `Barème v${version} publié` : `Brouillon v${version} enregistré` });
  } catch (error) { return apiError(error); }
}
