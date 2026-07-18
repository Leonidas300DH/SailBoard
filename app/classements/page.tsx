import { ChampionshipControlRoom, type ChampionshipRow } from "@/components/ChampionshipControlRoom";
import { getWdt2026Snapshots } from "@/lib/wdt-2026-database";
import { snapshotSlug, standingColor, WDT_2026_EVENTS, wdtCrewForEvent, wdtTeamForParticipantEvent } from "@/lib/wdt-2026";

export const dynamic = "force-dynamic";

export default async function RankingsPage({ searchParams }: { searchParams: Promise<{ vue?: string; selection?: string }> }) {
  const { vue, selection } = await searchParams;
  const individual = vue === "individuel";
  const snapshots = await getWdt2026Snapshots();
  const snapshot = individual ? snapshots.individual : snapshots.team;
  const latestCompletedEvent = WDT_2026_EVENTS.findLastIndex((event) => event.status === "completed");
  const rows: ChampionshipRow[] = snapshot.rows.map((source, index) => {
    const slug = snapshotSlug(source.name);
    const team = individual ? wdtTeamForParticipantEvent(source.name, latestCompletedEvent) : null;
    return {
      id: `wdt-2026-${individual ? "individual" : "team"}-${index + 1}-${slug}`,
      name: source.name,
      slug,
      subtitle: individual ? "Classement des navigateurs · score le plus élevé" : "Classement des équipages · score le plus bas",
      color: standingColor(source.rank),
      points: source.points,
      position: source.rank,
      eventScores: source.eventScores,
      crew: individual ? undefined : wdtCrewForEvent(source.name, latestCompletedEvent),
      boatName: team?.name,
      boatHref: team ? `/classements?vue=bateaux&selection=${team.slug}` : undefined,
      role: individual ? "Navigateur" : undefined,
    };
  });

  return <ChampionshipControlRoom
    mode={individual ? "individual" : "boats"}
    rows={rows}
    initialSelectionSlug={selection}
    raceSlug="4-vents-cup"
    eventName={snapshot.competition}
    snapshotMeta={{
      title: snapshot.title,
      eyebrow: `${snapshot.competition} · après ${snapshot.completedRaces} étapes`,
      sourceLabel: snapshots.origin === "database" ? "Base officielle WDT 2026" : "Classeur officiel 2026 · copie locale",
      completedRaces: snapshot.completedRaces,
      totalRaces: snapshot.totalRaces,
      totalClassified: snapshot.declaredClassifiedCount,
      scoreDirection: snapshot.scoreDirection,
      scoringLabel: "Somme des points de chaque étape",
      events: WDT_2026_EVENTS,
    }}
  />;
}
