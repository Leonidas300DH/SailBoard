import { NextResponse } from "next/server";
import type { LiveTrafficPoint } from "@/lib/map/tactical-data";

const AIS_URL = "wss://stream.aisstream.io/v0/stream";
const CACHE_MS = 60_000;

let cached: { at: number; points: LiveTrafficPoint[] } | null = null;
let pending: Promise<LiveTrafficPoint[]> | null = null;

type AisEnvelope = {
  MessageType?: string;
  Metadata?: { Latitude?: number; Longitude?: number; MMSI?: number; ShipName?: string };
  MetaData?: { Latitude?: number; Longitude?: number; MMSI?: number; ShipName?: string };
  Message?: Record<string, Record<string, unknown>>;
};

function numeric(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function aisHeading(message: Record<string, unknown>): number {
  const course = numeric(message.Cog, numeric(message.CourseOverGround, Number.NaN));
  if (course >= 0 && course < 360) return course;
  const heading = numeric(message.TrueHeading, 0);
  return heading >= 0 && heading < 360 ? heading : 0;
}

function aisSpeedKph(message: Record<string, unknown>): number {
  // AISStream follows the AIS field names `Sog` and `Cog`. Values of 102.3
  // knots and above mean "not available" rather than a very fast vessel.
  const knots = numeric(message.Sog, numeric(message.SpeedOverGround, 0));
  return knots >= 0 && knots < 102.3 ? knots * 1.852 : 0;
}

function loadVessels(apiKey: string): Promise<LiveTrafficPoint[]> {
  if (cached && Date.now() - cached.at < CACHE_MS) return Promise.resolve(cached.points);
  pending ??= new Promise<LiveTrafficPoint[]>((resolve) => {
    const points = new Map<string, LiveTrafficPoint>();
    const socket = new WebSocket(AIS_URL);
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.close();
      const result = [...points.values()];
      if (result.length > 0) cached = { at: Date.now(), points: result };
      resolve(result);
    };
    const timer = setTimeout(finish, 5_200);

    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({
        APIKey: apiKey,
        // Focus the stream on the visible Atlantic circuit instead of letting
        // high-volume English Channel ports consume the short collection
        // window with vessels that are outside the map.
        BoundingBoxes: [[[45.7, -7.1], [49.4, 0.8]]],
        FilterMessageTypes: ["PositionReport", "StandardClassBPositionReport", "ExtendedClassBPositionReport"],
      }));
    });
    socket.addEventListener("message", async (event) => {
      try {
        const raw = typeof event.data === "string"
          ? event.data
          : event.data instanceof Blob
            ? await event.data.text()
            : new TextDecoder().decode(event.data);
        const envelope = JSON.parse(raw) as AisEnvelope;
        const metadata = envelope.Metadata ?? envelope.MetaData ?? {};
        const message = envelope.Message?.[envelope.MessageType ?? ""] ?? {};
        const latitude = numeric(message.Latitude, numeric(metadata.Latitude, Number.NaN));
        const longitude = numeric(message.Longitude, numeric(metadata.Longitude, Number.NaN));
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
        const mmsi = String(message.UserID ?? metadata.MMSI ?? `${latitude}-${longitude}`);
        points.set(mmsi, {
          id: mmsi,
          coordinates: [longitude, latitude],
          heading: aisHeading(message),
          speedKph: aisSpeedKph(message),
          updatedAt: Date.now(),
          label: metadata.ShipName?.trim() || undefined,
        });
      } catch {
        // A malformed or unsupported AIS message is ignored; the stream keeps
        // collecting the position reports it can normalize.
      }
    });
    socket.addEventListener("error", finish);
    socket.addEventListener("close", () => {
      clearTimeout(timer);
      finish();
    });
  }).finally(() => {
    pending = null;
  });
  return pending;
}

export async function GET() {
  const apiKey = process.env.AISSTREAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ mode: "simulated", source: "shipping-lane-model", vessels: [] });
  }
  try {
    const vessels = await loadVessels(apiKey);
    return NextResponse.json({
      mode: vessels.length > 0 ? "live" : "simulated",
      source: vessels.length > 0 ? "AISStream" : "shipping-lane-model",
      vessels,
    }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=180" },
    });
  } catch {
    return NextResponse.json({ mode: "simulated", source: "shipping-lane-model", vessels: [] });
  }
}
