import type { RaceView } from "./domain";
import type { SeasonRace } from "./season-data";

export type WeatherReliability = "archive" | "forecast" | "fallback";

export type RaceWeatherSnapshot = {
  observedAt: string;
  windKnots: number;
  windDirection: number;
  windLabel: string;
  gustKnots: number;
  temperature: number;
  waveHeight: number;
  waveDirection: number;
  wavePeriod: number;
  seaTemperature: number;
  tideLabel: string;
  source: string;
  modeled: boolean;
  /** Provenance of the wind block: ERA5 archive, forecast model, or demo fallback. */
  reliability: WeatherReliability;
  /** False when the marine block (waves/tide/sea temp) fell back to demo values. */
  marineReliable: boolean;
};

const FALLBACK: RaceWeatherSnapshot = {
  observedAt: "17 juillet · 15:00",
  windKnots: 18.4,
  windDirection: 230,
  windLabel: "SO",
  gustKnots: 24,
  temperature: 21,
  waveHeight: 0.7,
  waveDirection: 236,
  wavePeriod: 4.8,
  seaTemperature: 18,
  tideLabel: "BM 12:46",
  source: "Open-Meteo · reconstitution de démonstration",
  modeled: true,
  reliability: "fallback",
  marineReliable: false,
};

const DAY_MS = 24 * 60 * 60 * 1000;
/** The ERA5 archive lags real time by a few days. */
const ARCHIVE_DELAY_MS = 5 * DAY_MS;
/** Open-Meteo forecasts stop ~16 days out. */
export const FORECAST_HORIZON_MS = 15 * DAY_MS;

function nearestIndex(times: string[] | undefined, target: Date) {
  if (!times?.length) return -1;
  let best = 0;
  let delta = Number.POSITIVE_INFINITY;
  times.forEach((time, index) => {
    const next = Math.abs(new Date(time).getTime() - target.getTime());
    if (next < delta) {
      delta = next;
      best = index;
    }
  });
  return best;
}

function compass(degrees: number) {
  const points = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  return points[Math.round(degrees / 45) % 8];
}

type WeatherPayload = {
  hourly?: Record<string, Array<number | string | null>> & { time?: string[] };
};

function numberAt(payload: WeatherPayload | null, key: string, index: number): number | null {
  if (!payload || index < 0) return null;
  const value = payload.hourly?.[key]?.[index];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function fetchPayload(base: string, params: URLSearchParams): Promise<WeatherPayload | null> {
  try {
    const response = await fetch(`${base}?${params}`, { next: { revalidate: 86_400 } });
    if (!response.ok) return null;
    return await response.json() as WeatherPayload;
  } catch {
    return null;
  }
}

function hourlyParams(lng: number, lat: number, date: string, hourly: string, knots: boolean) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    start_date: date,
    end_date: date,
    hourly,
    timezone: "Europe/Paris",
    cell_selection: "sea",
  });
  if (knots) params.set("wind_speed_unit", "kn");
  return params;
}

/**
 * Real conditions at a position and datetime. Past races hit the ERA5 archive
 * (wind) and the marine hindcast (waves/tide); recent or upcoming dates hit
 * the forecast models. The two blocks fail independently: a marine outage
 * never discards real archive wind, and vice versa. Selection is by value —
 * if the archive still has no data (its few-days lag), the forecast endpoint
 * is tried before giving up.
 */
export async function getWeatherAt(coordinates: [number, number], scheduledAt: string): Promise<RaceWeatherSnapshot> {
  const target = new Date(scheduledAt);
  const date = target.toISOString().slice(0, 10);
  const [lng, lat] = coordinates;
  const isPast = target.getTime() < Date.now() - ARCHIVE_DELAY_MS;
  const windHourly = "temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m";
  const marineHourly = "wave_height,wave_direction,wave_period,sea_surface_temperature,sea_level_height_msl";

  const primaryWindBase = isPast ? "https://archive-api.open-meteo.com/v1/archive" : "https://api.open-meteo.com/v1/forecast";
  const [primaryWind, marine] = await Promise.all([
    fetchPayload(primaryWindBase, hourlyParams(lng, lat, date, windHourly, true)),
    fetchPayload("https://marine-api.open-meteo.com/v1/marine", hourlyParams(lng, lat, date, marineHourly, false)),
  ]);

  // Value-based fallback: an empty archive answer (recent race) retries the forecast model.
  let wind = primaryWind;
  let reliability: WeatherReliability = isPast ? "archive" : "forecast";
  if (numberAt(wind, "wind_speed_10m", nearestIndex(wind?.hourly?.time, target)) === null && isPast) {
    wind = await fetchPayload("https://api.open-meteo.com/v1/forecast", hourlyParams(lng, lat, date, windHourly, true));
    reliability = "forecast";
  }

  const windIndex = nearestIndex(wind?.hourly?.time, target);
  const marineIndex = nearestIndex(marine?.hourly?.time, target);
  const windSpeed = numberAt(wind, "wind_speed_10m", windIndex);
  if (windSpeed === null) return FALLBACK;

  const windDirection = numberAt(wind, "wind_direction_10m", windIndex) ?? FALLBACK.windDirection;
  const waveHeight = numberAt(marine, "wave_height", marineIndex);
  const marineReliable = waveHeight !== null;

  let tideLabel = FALLBACK.tideLabel;
  if (marine?.hourly?.sea_level_height_msl && marine.hourly.time) {
    const levels = marine.hourly.sea_level_height_msl;
    let lowIndex = -1;
    let lowValue = Number.POSITIVE_INFINITY;
    levels.forEach((value, index) => {
      if (typeof value === "number" && value < lowValue) {
        lowValue = value;
        lowIndex = index;
      }
    });
    if (lowIndex >= 0) tideLabel = `BM ${marine.hourly.time[lowIndex]?.slice(11, 16) ?? ""}`.trim();
  }

  const sourceParts = [reliability === "archive" ? "Open-Meteo" : "Open-Meteo · ECMWF IFS"];
  sourceParts.push(marineReliable ? "Météo-France MFWAM" : "mer reconstituée");

  return {
    observedAt: target.toLocaleString("fr-FR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }),
    windKnots: windSpeed,
    windDirection,
    windLabel: compass(windDirection),
    gustKnots: numberAt(wind, "wind_gusts_10m", windIndex) ?? FALLBACK.gustKnots,
    temperature: numberAt(wind, "temperature_2m", windIndex) ?? FALLBACK.temperature,
    waveHeight: waveHeight ?? FALLBACK.waveHeight,
    waveDirection: numberAt(marine, "wave_direction", marineIndex) ?? FALLBACK.waveDirection,
    wavePeriod: numberAt(marine, "wave_period", marineIndex) ?? FALLBACK.wavePeriod,
    seaTemperature: numberAt(marine, "sea_surface_temperature", marineIndex) ?? FALLBACK.seaTemperature,
    tideLabel,
    source: sourceParts.join(" / "),
    modeled: true,
    reliability,
    marineReliable,
  };
}

export async function getRaceWeatherSnapshot(race: RaceView): Promise<RaceWeatherSnapshot> {
  return getWeatherAt(race.center, race.scheduledAt);
}

/**
 * Real weather for every season race whose date is inside the models' reach:
 * archive for past races, forecast for imminent ones, `null` beyond the
 * forecast horizon (the UI announces "prévision à J-15").
 */
export async function getSeasonRacesWeather(races: SeasonRace[]): Promise<Record<string, RaceWeatherSnapshot | null>> {
  const results = await Promise.allSettled(
    races.map(async (race): Promise<[string, RaceWeatherSnapshot | null]> => {
      const raceTime = new Date(`${race.date}T15:00:00+02:00`);
      if (raceTime.getTime() > Date.now() + FORECAST_HORIZON_MS) return [race.id, null];
      return [race.id, await getWeatherAt(race.coordinates, raceTime.toISOString())];
    }),
  );
  return Object.fromEntries(
    results.map((result, index) => result.status === "fulfilled" ? result.value : [races[index].id, null]),
  );
}
