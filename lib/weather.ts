import type { RaceView } from "./domain";

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
};

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

export async function getRaceWeatherSnapshot(race: RaceView): Promise<RaceWeatherSnapshot> {
  const target = new Date(race.scheduledAt);
  const date = target.toISOString().slice(0, 10);
  const pastThreshold = Date.now() - 4 * 24 * 60 * 60 * 1000;
  const weatherBase = target.getTime() < pastThreshold
    ? "https://archive-api.open-meteo.com/v1/archive"
    : "https://api.open-meteo.com/v1/forecast";
  const weatherParams = new URLSearchParams({
    latitude: String(race.center[1]),
    longitude: String(race.center[0]),
    start_date: date,
    end_date: date,
    hourly: "temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m",
    timezone: "Europe/Paris",
    wind_speed_unit: "kn",
    cell_selection: "sea",
  });
  const marineParams = new URLSearchParams({
    latitude: String(race.center[1]),
    longitude: String(race.center[0]),
    start_date: date,
    end_date: date,
    hourly: "wave_height,wave_direction,wave_period,sea_surface_temperature,sea_level_height_msl",
    timezone: "Europe/Paris",
    cell_selection: "sea",
  });

  try {
    const [weatherResponse, marineResponse] = await Promise.all([
      fetch(`${weatherBase}?${weatherParams}`, { next: { revalidate: 86_400 } }),
      fetch(`https://marine-api.open-meteo.com/v1/marine?${marineParams}`, { next: { revalidate: 86_400 } }),
    ]);
    if (!weatherResponse.ok || !marineResponse.ok) return FALLBACK;
    const weather = await weatherResponse.json() as WeatherPayload;
    const marine = await marineResponse.json() as WeatherPayload;
    const weatherIndex = nearestIndex(weather.hourly?.time, target);
    const marineIndex = nearestIndex(marine.hourly?.time, target);
    if (weatherIndex < 0 || marineIndex < 0) return FALLBACK;
    const numberAt = (payload: WeatherPayload, key: string, index: number, fallback: number) => {
      const value = payload.hourly?.[key]?.[index];
      return typeof value === "number" && Number.isFinite(value) ? value : fallback;
    };
    const windDirection = numberAt(weather, "wind_direction_10m", weatherIndex, FALLBACK.windDirection);
    const levels = (marine.hourly?.sea_level_height_msl ?? []) as Array<number | string | null>;
    const numericLevels = levels.map((value, index) => ({ index, value: typeof value === "number" ? value : Number.POSITIVE_INFINITY }));
    const lowTideIndex = numericLevels.reduce((best, item) => item.value < best.value ? item : best, numericLevels[0] ?? { index: 0, value: 0 }).index;
    const lowTideTime = marine.hourly?.time?.[lowTideIndex]?.slice(11, 16) ?? FALLBACK.tideLabel.slice(-5);
    return {
      observedAt: target.toLocaleString("fr-FR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }),
      windKnots: numberAt(weather, "wind_speed_10m", weatherIndex, FALLBACK.windKnots),
      windDirection,
      windLabel: compass(windDirection),
      gustKnots: numberAt(weather, "wind_gusts_10m", weatherIndex, FALLBACK.gustKnots),
      temperature: numberAt(weather, "temperature_2m", weatherIndex, FALLBACK.temperature),
      waveHeight: numberAt(marine, "wave_height", marineIndex, FALLBACK.waveHeight),
      waveDirection: numberAt(marine, "wave_direction", marineIndex, FALLBACK.waveDirection),
      wavePeriod: numberAt(marine, "wave_period", marineIndex, FALLBACK.wavePeriod),
      seaTemperature: numberAt(marine, "sea_surface_temperature", marineIndex, FALLBACK.seaTemperature),
      tideLabel: `BM ${lowTideTime}`,
      source: "Open-Meteo · ECMWF IFS / Météo-France MFWAM",
      modeled: true,
    };
  } catch {
    return FALLBACK;
  }
}

