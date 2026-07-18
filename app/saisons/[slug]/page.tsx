import { SeasonControlRoom } from "@/components/season/SeasonControlRoom";
import { getPublicOverview } from "@/lib/database";
import { SEASON_RACES } from "@/lib/season-data";
import { getRaceWeatherSnapshot, getSeasonRacesWeather } from "@/lib/weather";

export const dynamic = "force-dynamic";

export default async function SeasonPage() {
  const data = await getPublicOverview();
  const [weather, seasonWeather] = await Promise.all([
    getRaceWeatherSnapshot(data.race),
    getSeasonRacesWeather(SEASON_RACES),
  ]);
  return <SeasonControlRoom
    race={data.race}
    weather={weather}
    seasonWeather={seasonWeather}
    nowIso={new Date().toISOString()}
    leaders={data.boats.map((row) => ({ id: String(row.id), name: String(row.name), slug: String(row.slug), points: Number(row.points), color: String(row.color) }))}
  />;
}
