import { notFound } from "next/navigation";
import Link from "next/link";
import { ContentNav } from "@/components/ContentNav";
import { getParticipantProfile } from "@/lib/database";

export const dynamic = "force-dynamic";

export default async function ParticipantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getParticipantProfile(slug);
  if (!data) notFound();
  const total = data.history.reduce((sum, row) => sum + Number(row.points ?? 0), 0);
  return <main className="content-page"><ContentNav /><div className="page-wrap">
    <section className="page-hero"><div><div className="meta-row"><span>Participant</span><span>{String(data.participant.nationality)}</span></div><h1>{String(data.participant.name)}</h1><p>Ses bateaux, rôles et résultats à travers les manches du championnat.</p></div><div className="hero-stat"><strong>{total.toFixed(1)}</strong><span>points individuels</span></div></section>
    <div className="section-head"><h2>Courses disputées</h2></div><table className="data-table"><thead><tr><th>Date</th><th>Course</th><th>Bateau</th><th>Rôle</th><th>Points</th></tr></thead><tbody>{data.history.map((row) => <tr key={`${String(row.race_slug)}-${String(row.boat_slug)}`}><td data-label="Date" className="mono">{new Date(String(row.scheduled_at)).toLocaleDateString("fr-FR")}</td><td data-label="Course"><Link className="entity-link" href={`/courses/${String(row.race_slug)}`}>{String(row.event_name)} · {String(row.race_name)}</Link></td><td data-label="Bateau"><Link className="entity-link" href={`/bateaux/${String(row.boat_slug)}`}>{String(row.boat_name)}</Link></td><td data-label="Rôle">{String(row.role)}</td><td data-label="Points" className="mono acid">{Number(row.points ?? 0).toFixed(1)}</td></tr>)}</tbody></table>
  </div></main>;
}
