import { notFound } from "next/navigation";
import { ParticipantControlRoom } from "@/components/EntityControlRoom";
import { getParticipantProfile, getPublicOverview } from "@/lib/database";

export const dynamic = "force-dynamic";

export default async function ParticipantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [data, overview] = await Promise.all([getParticipantProfile(slug), getPublicOverview()]);
  if (!data) notFound();
  return <ParticipantControlRoom participant={{ name: String(data.participant.name), slug: String(data.participant.slug), nationality: String(data.participant.nationality) }} history={data.history.map((row) => ({ raceName: String(row.race_name), raceSlug: String(row.race_slug), eventName: String(row.event_name), date: String(row.scheduled_at), position: row.position == null ? null : Number(row.position), points: Number(row.points ?? 0), boatName: String(row.boat_name), boatSlug: String(row.boat_slug), role: String(row.role) }))} race={overview.race} />;
}
