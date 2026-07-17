import Link from "next/link";
import { CalendarDays, ChevronRight, MapPin, ShieldCheck, Trophy } from "lucide-react";
import type { RaceView } from "@/lib/domain";
import { PublicCockpitShell } from "./PublicCockpitShell";
import { EventLocatorMap } from "./EventLocatorMap";

export function SeasonControlRoom({ race, leaders, context = "season" }: { race: RaceView; leaders: Array<{ id: string; name: string; slug: string; points: number; color: string }>; context?: "map" | "season" }) {
  const locatedRaces = [{ id: race.id, name: `${race.eventName} · ${race.name}`, locationName: race.locationName, coordinates: race.center, href: `/courses/${race.slug}`, status: race.status }];
  return <PublicCockpitShell active={context === "map" ? "map" : "rankings"} raceSlug={race.slug} eventName={race.eventName} title={context === "map" ? "Carte des courses" : "Championnat 2026"} eyebrow={context === "map" ? "Saison 2026 · Bretagne" : "Saison active · mars — octobre"}>
    <div className="season-control-body">
      <section className="season-map-hero">
        <div className="global-map-canvas"><EventLocatorMap races={locatedRaces} /><div className="map-shade global-map-shade" /><div className="season-count"><span>Courses localisées</span><strong className="mono">01<span>/01</span></strong><small>Carte territoriale</small></div></div>
        <div className="season-command"><span className="panel-kicker">Course localisée · Bretagne sud</span><h2>{race.eventName}</h2><p>{race.name} · {race.locationName}</p><div className="season-command-meta"><span><CalendarDays />17 juillet 2026</span><span><MapPin />{race.locationName}</span><span><ShieldCheck />Résultats validés</span></div><Link className="button primary" href={`/courses/${race.slug}`}>Voir le parcours détaillé <ChevronRight /></Link></div>
      </section>
      <div className="season-lower-grid">
        <section className="season-events"><div className="control-panel-head"><div><span className="panel-kicker">Calendrier opérationnel</span><h3>Événements de la saison</h3></div><span className="status-tag">Saison active</span></div><Link className="season-event-row" href={`/courses/${race.slug}`}><span className="season-date"><strong>17</strong><small>JUIL.</small></span><span><strong>{race.eventName}</strong><small>{race.locationName} · {race.name}</small></span><span className="acid race-font">Classé</span><ChevronRight /></Link></section>
        <section className="season-podium"><div className="control-panel-head"><div><span className="panel-kicker">Championship pulse</span><h3>Top flotte</h3></div><Trophy className="acid" /></div>{leaders.slice(0, 4).map((leader, index) => <Link key={leader.id} href={`/bateaux/${leader.slug}`} className="season-leader" style={{ "--competitor-color": leader.color } as React.CSSProperties}><span>{index + 1}</span><i /><strong>{leader.name}</strong><small className="mono">{leader.points.toFixed(1)} PTS</small></Link>)}</section>
      </div>
    </div>
  </PublicCockpitShell>;
}
