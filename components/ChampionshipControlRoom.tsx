"use client";

import Link from "next/link";
import { ChevronRight, Gauge, Search, ShieldCheck, Sparkles, Trophy, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { PublicCockpitShell } from "./PublicCockpitShell";

export type ChampionshipRow = {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  color: string;
  points: number;
  races: number;
  position: number;
  profileHref: string;
  boatName?: string;
  boatHref?: string;
  role?: string;
  crew?: Array<{ name: string; slug: string; role: string }>;
};

export function ChampionshipControlRoom({ mode, rows, raceSlug, eventName }: { mode: "boats" | "individual"; rows: ChampionshipRow[]; raceSlug: string; eventName: string }) {
  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => rows.filter((row) => `${row.name} ${row.subtitle}`.toLowerCase().includes(query.toLowerCase())), [query, rows]);
  const selected = rows.find((row) => row.id === selectedId) ?? filtered[0] ?? rows[0];
  const maxPoints = Math.max(...rows.map((row) => row.points), 1);
  const fieldPoints = rows.reduce((sum, row) => sum + row.points, 0);

  return <PublicCockpitShell active={mode === "individual" ? "sailors" : "rankings"} raceSlug={raceSlug} eventName={eventName} title={mode === "individual" ? "Classement des marins" : "Classement des bateaux"} eyebrow="Championnat 2026 · contrôle officiel">
    <div className="control-body">
      <section className="control-kpis" aria-label="Résumé du championnat">
        <div><span>Leader</span><strong>{rows[0]?.name ?? "—"}</strong><small>{rows[0]?.points.toFixed(1) ?? "0.0"} points</small></div>
        <div><span>Plateau</span><strong className="mono">{String(rows.length).padStart(2, "0")}</strong><small>{mode === "individual" ? "marins classés" : "bateaux classés"}</small></div>
        <div><span>Points distribués</span><strong className="mono">{fieldPoints.toFixed(1)}</strong><small>instantané verrouillé</small></div>
        <div><span>Dernière manche</span><strong className="mono">06 / 06</strong><small>{eventName}</small></div>
      </section>

      <div className="rank-control-grid">
        <section className="control-list-panel">
          <div className="control-panel-head">
            <div className="view-switch" aria-label="Changer de classement">
              <Link className={mode === "boats" ? "active" : ""} href="/classements?vue=bateaux">Bateaux</Link>
              <Link className={mode === "individual" ? "active" : ""} href="/classements?vue=individuel">Individuel</Link>
            </div>
            <label className="control-search"><Search aria-hidden /><span className="sr-only">Filtrer</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrer le plateau" /></label>
          </div>
          <div className="control-table-head"><span>Pos.</span><span>Concurrent</span><span>Manches</span><span>Indice</span><span>Points</span></div>
          <div className="control-ranking-list">
            {filtered.map((row) => <button key={row.id} type="button" onClick={() => setSelectedId(row.id)} className={`control-rank-row ${selected?.id === row.id ? "selected" : ""}`} style={{ "--competitor-color": row.color } as React.CSSProperties}>
              <span className="control-rank-pos">{String(row.position).padStart(2, "0")}</span>
              <span className="control-rank-name"><i /><strong>{row.name}</strong><small>{row.subtitle}</small></span>
              <span className="mono">{String(row.races).padStart(2, "0")}</span>
              <span className="performance-bar"><i style={{ width: `${Math.max(8, row.points / maxPoints * 100)}%` }} /></span>
              <span className="control-rank-points mono">{row.points.toFixed(1)}</span>
            </button>)}
          </div>
        </section>

        {selected ? <aside className="competitor-intel" style={{ "--competitor-color": selected.color } as React.CSSProperties}>
          <div className="intel-scanline" />
          <div className="intel-overline"><span>Sélection active</span><span className="mono">ID · {selected.position.toString().padStart(2, "0")}</span></div>
          <div className="intel-title"><span className="intel-position">{selected.position}<sup>e</sup></span><div><h2>{selected.name}</h2><p>{selected.subtitle}</p></div></div>
          <div className="intel-score"><span>Score championnat</span><strong className="mono">{selected.points.toFixed(1)}</strong><small>PTS</small></div>
          <div className="intel-metrics">
            <div><Gauge /><span>Rendement</span><strong>{Math.round(selected.points / maxPoints * 100)}%</strong></div>
            <div><Trophy /><span>Manches</span><strong>{selected.races}</strong></div>
            <div><ShieldCheck /><span>Statut</span><strong>Validé</strong></div>
          </div>
          {mode === "boats" ? <div className="intel-crew"><div className="intel-section-title"><Users />Équipage de la manche</div>{selected.crew?.map((member) => <Link key={member.slug} href={`/participants/${member.slug}`}><span>{member.name}</span><small>{member.role}</small><ChevronRight /></Link>)}</div> : <div className="intel-crew"><div className="intel-section-title"><Sparkles />Affectation de la manche</div><Link href={selected.boatHref ?? "#"}><span>{selected.boatName ?? "Bateau non affecté"}</span><small>{selected.role ?? "Rôle non renseigné"}</small><ChevronRight /></Link></div>}
          <Link className="intel-primary-link" href={selected.profileHref}>Ouvrir le dossier complet <ChevronRight /></Link>
        </aside> : null}
      </div>
    </div>
  </PublicCockpitShell>;
}
