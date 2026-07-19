import { NextResponse } from "next/server";
import type { LiveTrafficPoint } from "@/lib/map/tactical-data";

const AIRPLANES_LIVE_URL = "https://api.airplanes.live/v2/point/47.7/-3.2/250";
const WESTERN_FRANCE_BOUNDS = { west: -8.4, south: 44.8, east: 2.2, north: 51.2 };
const CACHE_MS = 5 * 60_000;

let cached: { at: number; points: LiveTrafficPoint[] } | null = null;
let pending: Promise<LiveTrafficPoint[]> | null = null;

type AirplanesLiveAircraft = {
  hex?: string;
  flight?: string;
  lat?: number;
  lon?: number;
  track?: number;
  gs?: number;
  seen_pos?: number;
  dbFlags?: number;
};

async function loadAircraft(): Promise<LiveTrafficPoint[]> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.points;
  pending ??= fetch(AIRPLANES_LIVE_URL, {
    headers: { Accept: "application/json", "User-Agent": "SailBoard-Race/1.0" },
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  }).then(async (response) => {
    if (!response.ok) throw new Error(`Airplanes.live returned ${response.status}`);
    const payload = await response.json() as { now?: number; ac?: AirplanesLiveAircraft[] };
    const now = payload.now ?? Date.now();
    const points = (payload.ac ?? []).flatMap((aircraft): LiveTrafficPoint[] => {
      if (typeof aircraft.lat !== "number" || typeof aircraft.lon !== "number") return [];
      // Keep the ambient layer civilian and operationally meaningful: the
      // provider marks military aircraft in bit 0, and a callsign is required
      // so anonymous local traffic does not turn into visual noise.
      if (((aircraft.dbFlags ?? 0) & 1) === 1 || !aircraft.flight?.trim()) return [];
      if (
        aircraft.lon < WESTERN_FRANCE_BOUNDS.west
        || aircraft.lon > WESTERN_FRANCE_BOUNDS.east
        || aircraft.lat < WESTERN_FRANCE_BOUNDS.south
        || aircraft.lat > WESTERN_FRANCE_BOUNDS.north
      ) return [];
      return [{
        id: aircraft.hex ?? `${aircraft.lat}-${aircraft.lon}`,
        coordinates: [aircraft.lon, aircraft.lat],
        heading: aircraft.track ?? 0,
        speedKph: Math.max(0, aircraft.gs ?? 0) * 1.852,
        updatedAt: now - Math.max(0, aircraft.seen_pos ?? 0) * 1_000,
        label: aircraft.flight?.trim() || undefined,
      }];
    });
    cached = { at: Date.now(), points };
    return points;
  }).finally(() => {
    pending = null;
  });
  return pending;
}

export async function GET() {
  try {
    const aircraft = await loadAircraft();
    return NextResponse.json({
      mode: aircraft.length > 0 ? "live" : "simulated",
      source: "Airplanes.live",
      aircraft,
    }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json({ mode: "simulated", source: "fallback", aircraft: [] }, { status: 200 });
  }
}
