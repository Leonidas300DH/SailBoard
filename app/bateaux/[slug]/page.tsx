import { notFound } from "next/navigation";
import Link from "next/link";
import { ContentNav } from "@/components/ContentNav";
import { getBoatProfile } from "@/lib/database";

export const dynamic = "force-dynamic";

export default async function BoatPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getBoatProfile(slug);
  if (!data) notFound();
  return <main className="content-page"><ContentNav /><div className="page-wrap">
    <section className="page-hero"><div><div className="meta-row"><span>{String(data.boat.model)}</span><span className="mono">{String(data.boat.sail_number)}</span></div><h1>{String(data.boat.name)}</h1><p>Historique sportif du bateau et équipages associés à chaque course.</p></div><div className="hero-stat"><strong>{data.history.reduce((sum, row) => sum + Number(row.boat_points ?? 0), 0).toFixed(0)}</strong><span>points cumulés</span></div></section>
    <div className="section-head"><h2>Historique des courses</h2></div><table className="data-table"><thead><tr><th>Date</th><th>Course</th><th>Position</th><th>Points</th></tr></thead><tbody>{data.history.map((row) => <tr key={String(row.race_slug)}><td data-label="Date" className="mono">{new Date(String(row.scheduled_at)).toLocaleDateString("fr-FR")}</td><td data-label="Course"><Link className="entity-link" href={`/courses/${String(row.race_slug)}`}>{String(row.event_name)} · {String(row.race_name)}</Link></td><td data-label="Position" className="position-cell">{String(row.position ?? "—")}</td><td data-label="Points" className="mono acid">{Number(row.boat_points ?? 0).toFixed(1)}</td></tr>)}</tbody></table>
  </div></main>;
}
