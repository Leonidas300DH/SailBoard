import { SeasonControlRoom } from "@/components/SeasonControlRoom";
import { getPublicOverview } from "@/lib/database";
import { getRaceWeatherSnapshot } from "@/lib/weather";

export const dynamic = "force-dynamic";

export default async function SeasonPage() {
  const data = await getPublicOverview();
  const weather = await getRaceWeatherSnapshot(data.race);
  return <SeasonControlRoom race={data.race} weather={weather} leaders={data.boats.map((row) => ({ id: String(row.id), name: String(row.name), slug: String(row.slug), points: Number(row.points), color: String(row.color) }))} />;
}
