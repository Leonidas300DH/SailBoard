import type { Metadata } from "next";
import { ContentNav } from "@/components/ContentNav";
import { RaceMap } from "@/components/RaceMap";
import { getRaceBySlug } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const race = await getRaceBySlug(slug);
  return { title: `${race.eventName} · ${race.name}` };
}

export default async function RacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const race = await getRaceBySlug(slug);
  return <main className="content-page"><ContentNav /><div className="page-wrap">
    <section className="page-hero"><div><div className="meta-row"><span>{race.seasonName}</span><span>{race.locationName}</span><span>17 juillet 2026</span></div><h1>{race.eventName}<br /><span className="acid">{race.name}</span></h1><p>Parcours publié, équipages engagés et classement final vérifié par l’organisation.</p></div><div className="hero-stat"><strong>{race.distanceNm.toFixed(1)}</strong><span>milles nautiques</span></div></section>
    <div className="section-head"><h2>Parcours officiel</h2><span className="muted mono">VERSION 1 · {race.laps} TOUR</span></div>
    <div className="map-wrap" style={{ minHeight: 520, border: "1px solid var(--line)" }}><RaceMap center={race.center} geojson={race.courseGeoJson} /></div>
    <div className="section-head"><h2>Résultats</h2><span className="muted">Barème championnat 2026 · v1</span></div>
    <table className="data-table"><thead><tr><th>Pos.</th><th>Bateau</th><th>Équipage</th><th>Temps</th><th>Points</th></tr></thead><tbody>{race.leaderboard.map((row) => <tr key={row.entryId}><td data-label="Position" className="position-cell">{row.position ?? "—"}</td><td data-label="Bateau"><a className="entity-link" href={`/bateaux/${row.boatSlug}`}>{row.boatName}</a><div className="muted mono">{row.sailNumber}</div></td><td data-label="Équipage">{row.crew.map((member) => member.name).join(" · ")}</td><td data-label="Temps" className="mono">{row.elapsedSeconds ? new Date(row.elapsedSeconds * 1000).toISOString().slice(11,19) : "—"}</td><td data-label="Points" className="mono acid">{row.points.toFixed(1)}</td></tr>)}</tbody></table>
  </div></main>;
}
