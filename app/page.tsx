import { SeasonControlRoom } from "@/components/SeasonControlRoom";
import { getPublicOverview } from "@/lib/database";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getPublicOverview();
  return <SeasonControlRoom context="map" race={data.race} leaders={data.boats.map((row) => ({ id: String(row.id), name: String(row.name), slug: String(row.slug), points: Number(row.points), color: String(row.color) }))} />;
}
