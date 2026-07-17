import { NextResponse } from "next/server";

export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Action impossible";
  const status = message === "ADMIN_ACCESS_REQUIRED" || message === "OWNER_ACCESS_REQUIRED" ? 403 : 400;
  return NextResponse.json({ error: message.replaceAll("_", " ").toLowerCase() }, { status });
}

export function requiredString(value: unknown, label: string) {
  const result = String(value ?? "").trim();
  if (!result) throw new Error(`${label} est requis`);
  return result;
}

export function isoDate(value: unknown, label: string) {
  const input = requiredString(value, label);
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} est invalide`);
  return date.toISOString();
}
