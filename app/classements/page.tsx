import { ChampionshipControlRoom, type ChampionshipRow } from "@/components/ChampionshipControlRoom";
import { getPublicOverview } from "@/lib/database";

export const dynamic = "force-dynamic";

export default async function RankingsPage({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const [{ vue }, data] = await Promise.all([searchParams, getPublicOverview()]);
  const individual = vue === "individuel";
  const rows: ChampionshipRow[] = individual
    ? data.participants.map((source, index) => {
        const id = String(source.id);
        const slug = String(source.slug);
        const assignment = data.race.leaderboard.flatMap((entry) => entry.crew.map((member) => ({ ...member, boatName: entry.boatName, boatSlug: entry.boatSlug, color: entry.color }))).find((member) => member.id === id);
        return { id, name: String(source.name), slug, subtitle: `${String(source.nationality)} · ${assignment?.role ?? "Marin"}`, color: assignment?.color ?? "#d9ff00", points: Number(source.points), races: Number(source.races), position: index + 1, profileHref: `/participants/${slug}`, boatName: assignment?.boatName, boatHref: assignment ? `/bateaux/${assignment.boatSlug}` : undefined, role: assignment?.role };
      })
    : data.boats.map((source, index) => {
        const slug = String(source.slug);
        const entry = data.race.leaderboard.find((row) => row.boatSlug === slug);
        return { id: String(source.id), name: String(source.name), slug, subtitle: `${String(source.model)} · ${String(source.sail_number)}`, color: String(source.color), points: Number(source.points), races: Number(source.races), position: index + 1, profileHref: `/bateaux/${slug}`, crew: entry?.crew.map((member) => ({ name: member.name, slug: member.slug, role: member.role })) };
      });
  return <ChampionshipControlRoom mode={individual ? "individual" : "boats"} rows={rows} raceSlug={data.race.slug} eventName={data.race.eventName} />;
}
