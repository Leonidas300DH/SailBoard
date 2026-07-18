import { notFound } from "next/navigation";
import { BoatControlRoom } from "@/components/EntityControlRoom";
import { getBoatProfile, getPublicOverview } from "@/lib/database";
import { wdtTeamProfile } from "@/lib/wdt-profiles";

export const dynamic = "force-dynamic";

export default async function BoatPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // WDT teams come from the official workbook; database boats keep priority.
  let data: Awaited<ReturnType<typeof getBoatProfile>> = null;
  try {
    data = await getBoatProfile(slug);
  } catch {
    data = null;
  }
  if (data) {
    const overview = await getPublicOverview();
    return <BoatControlRoom
      boat={{ name: String(data.boat.name), slug: String(data.boat.slug), model: String(data.boat.model), sailNumber: String(data.boat.sail_number), color: String(data.boat.color) }}
      history={data.history.map((row) => ({ raceName: String(row.race_name), raceSlug: String(row.race_slug), eventName: String(row.event_name), date: String(row.scheduled_at), position: row.position == null ? null : Number(row.position), points: Number(row.boat_points ?? 0), status: String(row.status ?? "classified") }))}
      race={overview.race}
    />;
  }

  const team = wdtTeamProfile(slug);
  if (!team) notFound();
  return <BoatControlRoom boat={team.boat} history={team.history} race={team.race} />;
}
