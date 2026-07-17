import Link from "next/link";
import { ContentNav } from "@/components/ContentNav";
import { getPublicOverview } from "@/lib/database";

export const dynamic = "force-dynamic";

export default async function RankingsPage({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const [{ vue }, data] = await Promise.all([searchParams, getPublicOverview()]);
  const individual = vue === "individuel";
  const rows = individual ? data.participants : data.boats;
  return <main className="content-page"><ContentNav /><div className="page-wrap">
    <section className="page-hero"><div><h1>Le classement,<br /><span className="acid">sans zone grise.</span></h1><p>Une lecture consolidée de la saison par bateau et par marin. Chaque score conserve le barème qui l’a produit.</p></div><div className="hero-stat"><strong>{rows.length}</strong><span>{individual ? "participants classés" : "bateaux engagés"}</span></div></section>
    <div className="section-head"><h2>{individual ? "Classement individuel" : "Classement des bateaux"}</h2><div><Link className={`button small ${!individual ? "primary" : ""}`} href="/classements?vue=bateaux">Bateaux</Link> <Link className={`button small ${individual ? "primary" : ""}`} href="/classements?vue=individuel">Individuel</Link></div></div>
    <table className="data-table"><thead><tr><th>Position</th><th>{individual ? "Participant" : "Bateau"}</th><th>Courses</th><th>Points</th></tr></thead><tbody>{rows.map((row, index) => {
      const slug = String(row.slug);
      return <tr key={String(row.id)}><td className="position-cell" data-label="Position">{index + 1}</td><td data-label={individual ? "Participant" : "Bateau"}><Link className="entity-link" href={individual ? `/participants/${slug}` : `/bateaux/${slug}`}>{String(row.name)}</Link>{!individual && row.sail_number ? <div className="muted mono">{String(row.sail_number)}</div> : null}</td><td data-label="Courses" className="mono">{String(row.races)}</td><td data-label="Points" className="mono acid">{Number(row.points).toFixed(1)}</td></tr>;
    })}</tbody></table>
  </div></main>;
}
