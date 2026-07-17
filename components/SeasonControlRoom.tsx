import Link from "next/link";
import { CalendarDays, ChevronRight, MapPin, ShieldCheck, Trophy } from "lucide-react";
import type { RaceView } from "@/lib/domain";
import { PublicCockpitShell } from "./PublicCockpitShell";
import { RaceMap } from "./RaceMap";

export function SeasonControlRoom({ race, leaders }: { race: RaceView; leaders: Array<{ id: string; name: string; slug: string; points: number; color: string }> }) {
  return <PublicCockpitShell active="rankings" raceSlug={race.slug} eventName={race.eventName} title="Championnat 2026" eyebrow="Saison active · mars — octobre">
    <div className="season-control-body">
      <section className="season-map-hero">
        <RaceMap center={race.center} geojson={race.courseGeoJson} /><div className="map-shade" />
        <div className="season-command"><span className="panel-kicker">Théâtre actif · Bretagne sud</span><h2>{race.eventName}</h2><p>{race.name} · {race.locationName}</p><div className="season-command-meta"><span><CalendarDays />17 juillet 2026</span><span><MapPin />{race.distanceNm.toFixed(1)} NM</span><span><ShieldCheck />Résultats validés</span></div><Link className="button primary" href={`/courses/${race.slug}`}>Entrer dans la course <ChevronRight /></Link></div>
        <div className="season-count"><span>Manches publiées</span><strong className="mono">01<span>/06</span></strong><small>Progression championnat</small></div>
      </section>
      <div className="season-lower-grid">
        <section className="season-events"><div className="control-panel-head"><div><span className="panel-kicker">Calendrier opérationnel</span><h3>Événements de la saison</h3></div><span className="status-tag">Saison active</span></div><Link className="season-event-row" href={`/courses/${race.slug}`}><span className="season-date"><strong>17</strong><small>JUIL.</small></span><span><strong>{race.eventName}</strong><small>{race.locationName} · {race.name}</small></span><span className="acid race-font">Classé</span><ChevronRight /></Link></section>
        <section className="season-podium"><div className="control-panel-head"><div><span className="panel-kicker">Championship pulse</span><h3>Top flotte</h3></div><Trophy className="acid" /></div>{leaders.slice(0, 4).map((leader, index) => <Link key={leader.id} href={`/bateaux/${leader.slug}`} className="season-leader" style={{ "--competitor-color": leader.color } as React.CSSProperties}><span>{index + 1}</span><i /><strong>{leader.name}</strong><small className="mono">{leader.points.toFixed(1)} PTS</small></Link>)}</section>
      </div>
    </div>
  </PublicCockpitShell>;
}
