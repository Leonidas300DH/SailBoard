import { SeasonControlRoom } from "@/components/season/SeasonControlRoom";
import { SEASON_RACES } from "@/lib/season-data";
import { stagePodiums } from "@/lib/wdt-profiles";
import { getSeasonRacesWeather } from "@/lib/weather";
import { getMapDisplaySettings } from "@/lib/database";

export const dynamic = "force-dynamic";

export default async function SeasonPage() {
  const [seasonWeather, mapSettings] = await Promise.all([
    getSeasonRacesWeather(SEASON_RACES),
    getMapDisplaySettings(),
  ]);
  return <SeasonControlRoom
    seasonWeather={seasonWeather}
    stagePodiums={stagePodiums()}
    nowIso={new Date().toISOString()}
    mapSettings={mapSettings}
  />;
}
