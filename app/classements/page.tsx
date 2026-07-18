import { ChampionshipControlRoom, type ChampionshipRow } from "@/components/ChampionshipControlRoom";
import { getPublicOverview } from "@/lib/database";
import { snapshotSlug, standingColor, wdt2026IndividualSnapshot } from "@/lib/wdt-2026";

export const dynamic = "force-dynamic";

export default async function RankingsPage({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const [{ vue }, data] = await Promise.all([searchParams, getPublicOverview()]);
  const individual = vue === "individuel";
  const rows: ChampionshipRow[] = individual
    ? wdt2026IndividualSnapshot.rows.map((source, index) => {
        const slug = snapshotSlug(source.name);
        return { id: `wdt-2026-${index + 1}-${slug}`, name: source.name, slug, subtitle: "WDT 2026 France · score importé", color: standingColor(source.rank), points: source.points, position: source.rank };
      })
    : data.boats.map((source, index) => {
        const slug = String(source.slug);
        const entry = data.race.leaderboard.find((row) => row.boatSlug === slug);
        return { id: String(source.id), name: String(source.name), slug, subtitle: `${String(source.model)} · ${String(source.sail_number)}`, color: String(source.color), points: Number(source.points), races: Number(source.races), position: index + 1, profileHref: `/bateaux/${slug}`, crew: entry?.crew.map((member) => ({ name: member.name, slug: member.slug, role: member.role })) };
      });
  return <ChampionshipControlRoom
    mode={individual ? "individual" : "boats"}
    rows={rows}
    raceSlug={data.race.slug}
    eventName={individual ? wdt2026IndividualSnapshot.competition : data.race.eventName}
    snapshotMeta={individual ? {
      title: wdt2026IndividualSnapshot.title,
      eyebrow: `${wdt2026IndividualSnapshot.competition} · après ${wdt2026IndividualSnapshot.completedRaces} courses`,
      sourceLabel: "Instantané MVP importé",
      completedRaces: wdt2026IndividualSnapshot.completedRaces,
      totalClassified: wdt2026IndividualSnapshot.declaredClassifiedCount,
      namedScores: wdt2026IndividualSnapshot.namedScoresCount,
    } : undefined}
  />;
}
