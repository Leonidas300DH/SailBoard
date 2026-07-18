"use client";

import Link from "next/link";
import { ChevronRight, Gauge, Search, ShieldCheck, Sparkles, Trophy, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ControlShell } from "./shell/AppShell";

export type ChampionshipRow = {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  color: string;
  points: number;
  races?: number;
  position: number;
  profileHref?: string;
  boatName?: string;
  boatHref?: string;
  role?: string;
  crew?: Array<{ name: string; slug: string; role: string }>;
  eventScores?: Array<number | null>;
};

export type RankingSnapshotMeta = {
  title: string;
  eyebrow: string;
  sourceLabel: string;
  completedRaces: number;
  totalRaces: number;
  totalClassified: number;
  scoreDirection: "high" | "low";
  scoringLabel: string;
  events: Array<{ id: string; name: string; shortName: string; status: "completed" | "upcoming" }>;
};

function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function ChampionshipControlRoom({ mode, rows, raceSlug, eventName, snapshotMeta }: { mode: "boats" | "individual"; rows: ChampionshipRow[]; raceSlug: string; eventName: string; snapshotMeta?: RankingSnapshotMeta }) {
  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [isIntelOpen, setIsIntelOpen] = useState(false);
  const filtered = useMemo(() => rows.filter((row) => `${row.name} ${row.subtitle}`.toLowerCase().includes(query.toLowerCase())), [query, rows]);
  const selected = filtered.find((row) => row.id === selectedId) ?? filtered[0];
  const maxPoints = Math.max(...rows.map((row) => row.points), 1);
  const minPoints = Math.min(...rows.map((row) => row.points), maxPoints);
  const performanceFor = (points: number) => snapshotMeta?.scoreDirection === "low"
    ? Math.max(8, minPoints / Math.max(points, 1) * 100)
    : Math.max(8, points / maxPoints * 100);

  return <ControlShell active={mode === "individual" ? "sailors" : "rankings"} raceSlug={raceSlug} eventName={eventName} title={snapshotMeta?.title ?? (mode === "individual" ? "Classement des marins" : "Classement des bateaux")} eyebrow={snapshotMeta?.eyebrow ?? "Championnat 2026 · contrôle officiel"}>
    <div className="control-body">
      <section className="control-kpis" aria-label="Résumé du championnat">
        <div><span>Leader provisoire</span><strong>{rows[0]?.name ?? "—"}</strong><small>{rows[0] ? formatPoints(rows[0].points) : "0"} points</small></div>
        <div><span>Plateau</span><strong className="mono">{String(snapshotMeta?.totalClassified ?? rows.length).padStart(2, "0")}</strong><small>{mode === "individual" ? "coureurs classés" : "équipes classées"}</small></div>
        <div><span>Règle de classement</span><strong>{snapshotMeta?.scoreDirection === "low" ? "Score minimum" : "Score maximum"}</strong><small>{snapshotMeta?.scoringLabel ?? "instantané verrouillé"}</small></div>
        <div><span>{snapshotMeta ? "Étapes courues" : "Dernière manche"}</span><strong className="mono">{snapshotMeta ? `${String(snapshotMeta.completedRaces).padStart(2, "0")} / ${String(snapshotMeta.totalRaces).padStart(2, "0")}` : "06 / 06"}</strong><small>{snapshotMeta?.sourceLabel ?? eventName}</small></div>
      </section>

      <div className="rank-control-grid">
        <section className="control-list-panel">
          <div className="control-panel-head">
            <div className="view-switch" aria-label="Changer de classement">
              <Link className={mode === "boats" ? "active" : ""} href="/classements?vue=bateaux">Bateaux</Link>
              <Link className={mode === "individual" ? "active" : ""} href="/classements?vue=individuel">Individuel</Link>
            </div>
            <label className="control-search"><Search aria-hidden /><span className="sr-only">Filtrer</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={mode === "individual" ? "Rechercher un coureur" : "Rechercher une équipe"} /></label>
          </div>
          <div className="control-table-head"><span>Pos.</span><span>Concurrent</span><span>Étapes</span><span>Indice</span><span>Total</span></div>
          <div className="control-ranking-list">
            {filtered.length === 0 ? <div className="control-empty-ranking"><Search aria-hidden /><strong>{mode === "individual" ? "Aucun coureur trouvé" : "Aucune équipe trouvée"}</strong><span>Essayez une autre recherche.</span></div> : null}
            {filtered.map((row) => <button key={row.id} type="button" onClick={() => { setSelectedId(row.id); setIsIntelOpen(true); }} className={`control-rank-row ${selected?.id === row.id ? "selected" : ""}`} style={{ "--competitor-color": row.color } as React.CSSProperties}>
              <span className="control-rank-pos">{String(row.position).padStart(2, "0")}</span>
              <span className="control-rank-name"><i /><strong>{row.name}</strong><small>{row.subtitle}</small></span>
              <span className="mono">{snapshotMeta ? `${snapshotMeta.completedRaces}/${snapshotMeta.totalRaces}` : row.races == null ? "—" : String(row.races).padStart(2, "0")}</span>
              <span className="performance-bar"><i style={{ width: `${performanceFor(row.points)}%` }} /></span>
              <span className="control-rank-points mono">{formatPoints(row.points)}</span>
            </button>)}
          </div>
        </section>

        {selected ? <aside className={`competitor-intel ${isIntelOpen ? "mobile-open" : ""}`} style={{ "--competitor-color": selected.color } as React.CSSProperties} aria-label={`Détail de ${selected.name}`}>
          <div className="intel-scanline" />
          <div className="intel-overline"><span>{snapshotMeta ? "Classement provisoire" : "Sélection active"}</span><span className="mono">RANG · {selected.position.toString().padStart(2, "0")}</span><button className="intel-close" type="button" onClick={() => setIsIntelOpen(false)} aria-label="Fermer le détail"><X /></button></div>
          <div className="intel-title"><span className="intel-position">{selected.position}<sup>{selected.position === 1 ? "er" : "e"}</sup></span><div><h2>{selected.name}</h2><p>{selected.subtitle}</p></div></div>
          <div className="intel-score"><span>Total après {snapshotMeta?.completedRaces ?? selected.races ?? "—"} étapes</span><strong className="mono">{formatPoints(selected.points)}</strong><small>PTS</small></div>
          <div className="intel-metrics">
            <div><Gauge /><span>Indice</span><strong>{Math.round(performanceFor(selected.points))}%</strong></div>
            <div><Trophy /><span>{snapshotMeta ? "Étapes" : "Manches"}</span><strong>{snapshotMeta ? `${snapshotMeta.completedRaces}/${snapshotMeta.totalRaces}` : selected.races ?? "—"}</strong></div>
            <div><ShieldCheck /><span>Statut</span><strong>{snapshotMeta ? "Provisoire" : "Validé"}</strong></div>
          </div>
          {snapshotMeta && selected.eventScores ? <div className="intel-breakdown"><div className="intel-section-title"><Trophy />Détail par étape</div>{snapshotMeta.events.map((event, index) => <div className="intel-event-score" key={event.id}><span><i>{index + 1}</i><span><strong>{event.shortName}</strong><small>{event.status === "completed" ? "Résultat intégré" : "À venir"}</small></span></span><strong className={`mono ${selected.eventScores?.[index] == null ? "pending" : ""}`}>{selected.eventScores?.[index] ?? "—"}</strong></div>)}</div> : mode === "boats" ? <div className="intel-crew"><div className="intel-section-title"><Users />Équipage de la manche</div>{selected.crew?.map((member) => <Link key={member.slug} href={`/participants/${member.slug}`}><span>{member.name}</span><small>{member.role}</small><ChevronRight /></Link>)}</div> : <div className="intel-crew"><div className="intel-section-title"><Sparkles />Affectation de la manche</div><Link href={selected.boatHref ?? "#"}><span>{selected.boatName ?? "Bateau non affecté"}</span><small>{selected.role ?? "Rôle non renseigné"}</small><ChevronRight /></Link></div>}
          {snapshotMeta ? <div className="intel-import-source"><div className="intel-section-title"><Sparkles />Calcul officiel</div><strong>{snapshotMeta.scoringLabel}</strong><small>{snapshotMeta.sourceLabel}</small><p>Les deux dernières étapes restent volontairement vides jusqu’à publication de leurs résultats.</p></div> : null}
          {selected.profileHref ? <Link className="intel-primary-link" href={selected.profileHref}>Ouvrir le dossier complet <ChevronRight /></Link> : null}
        </aside> : null}
      </div>
    </div>
  </ControlShell>;
}
