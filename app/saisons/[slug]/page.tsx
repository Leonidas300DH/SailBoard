import Link from "next/link";
import { ContentNav } from "@/components/ContentNav";
import { getPublicOverview } from "@/lib/database";

export const dynamic = "force-dynamic";

export default async function SeasonPage() {
  const data = await getPublicOverview();
  return <main className="content-page"><ContentNav /><div className="page-wrap">
    <section className="page-hero"><div><h1>Championnat<br /><span className="acid">2026</span></h1><p>De mars à octobre, les équipages bretons se retrouvent sur les plans d’eau les plus exigeants de la région.</p></div><div className="hero-stat"><strong>01</strong><span>régate publiée</span></div></section>
    <div className="section-head"><h2>Événements de la saison</h2><span className="muted mono">01 MARS — 31 OCT.</span></div>
    <table className="data-table"><thead><tr><th>Date</th><th>Événement</th><th>Lieu</th><th>Statut</th></tr></thead><tbody><tr><td data-label="Date" className="mono">17.07.2026</td><td data-label="Événement"><Link className="entity-link" href={`/courses/${data.race.slug}`}>{data.race.eventName} · {data.race.name}</Link></td><td data-label="Lieu">{data.race.locationName}</td><td data-label="Statut" className="acid race-font">Résultats validés</td></tr></tbody></table>
  </div></main>;
}
