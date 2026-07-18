import { SeasonControlRoom } from "@/components/season/SeasonControlRoom";
import { getPublicOverview } from "@/lib/database";
import { SEASON_RACES } from "@/lib/season-data";
import { getRaceWeatherSnapshot, getSeasonRacesWeather } from "@/lib/weather";

export const dynamic = "force-dynamic";

export default async function Home() {
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
  />;
}
