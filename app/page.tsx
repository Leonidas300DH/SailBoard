import { SeasonControlRoom } from "@/components/season/SeasonControlRoom";
import { SEASON_RACES } from "@/lib/season-data";
import { stagePodiums } from "@/lib/wdt-profiles";
import { getSeasonRacesWeather } from "@/lib/weather";

export const dynamic = "force-dynamic";

export default async function Home() {
  const seasonWeather = await getSeasonRacesWeather(SEASON_RACES);
  return <SeasonControlRoom
    seasonWeather={seasonWeather}
    stagePodiums={stagePodiums()}
    nowIso={new Date().toISOString()}
  />;
}
