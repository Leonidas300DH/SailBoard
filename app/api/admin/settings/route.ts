import { NextResponse } from "next/server";
import { getDatabase } from "@/db";
import { apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { ensureDatabase, writeAudit } from "@/lib/database";
import type { MapDisplaySettings } from "@/lib/map-settings";

function readSettings(body: Record<string, unknown>): MapDisplaySettings {
  if (body.defaultMode !== "natural" && body.defaultMode !== "tactical") {
    throw new Error("Mode de carte invalide");
  }
  for (const key of ["showAircraft", "showVessels", "showCityLights", "showClouds"] as const) {
    if (typeof body[key] !== "boolean") throw new Error("Réglages de couches invalides");
  }
  return {
    defaultMode: body.defaultMode,
    showAircraft: body.showAircraft as boolean,
    showVessels: body.showVessels as boolean,
    showCityLights: body.showCityLights as boolean,
    showClouds: body.showClouds as boolean,
  };
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    await ensureDatabase();
    const settings = readSettings(await request.json() as Record<string, unknown>);
    const now = new Date().toISOString();
    await getDatabase().prepare(`INSERT INTO app_settings (key, value_json, updated_by, created_at, updated_at)
      VALUES ('map-display', ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_by = excluded.updated_by, updated_at = excluded.updated_at`)
      .bind(JSON.stringify(settings), admin.email, now, now).run();
    await writeAudit(admin.email, "update_map_settings", "app_setting", "map-display", settings);
    return NextResponse.json({ message: "Réglages de la carte enregistrés", settings });
  } catch (error) {
    return apiError(error);
  }
}
