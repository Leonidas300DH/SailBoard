"use client";

import Link from "next/link";
import { ChevronRight, Search, Sparkles, Trophy, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import { CountUpNumber } from "./map/CountUpNumber";
import { DecodeText } from "./map/DecodeText";
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

export function ChampionshipControlRoom({ mode, rows, raceSlug, eventName, snapshotMeta, initialSelectionSlug }: { mode: "boats" | "individual"; rows: ChampionshipRow[]; raceSlug: string; eventName: string; snapshotMeta?: RankingSnapshotMeta; initialSelectionSlug?: string }) {
  const initialSelection = rows.find((row) => row.slug === initialSelectionSlug);
  const [selectedId, setSelectedId] = useState(initialSelection?.id ?? rows[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [isIntelOpen, setIsIntelOpen] = useState(Boolean(initialSelection));
  const filtered = useMemo(() => rows.filter((row) => `${row.name} ${row.subtitle}`.toLowerCase().includes(query.toLowerCase())), [query, rows]);
  const selected = filtered.find((row) => row.id === selectedId) ?? filtered[0];
  const events = snapshotMeta?.events ?? [];
  const completedEvents = events.map((event, index) => ({ event, index })).filter(({ event }) => event.status === "completed");

  return <ControlShell active={mode === "individual" ? "sailors" : "rankings"} raceSlug={raceSlug} eventName={eventName} title={snapshotMeta?.title ?? (mode === "individual" ? "Classement des navigateurs" : "Classement des équipages")} eyebrow={snapshotMeta?.eyebrow ?? "Championnat 2026 · contrôle officiel"}>
    <div className={`control-body control-body--${mode}`}>
      <section className="control-kpis" aria-label="Résumé du championnat">
        <div><span>Leader provisoire</span><strong>{rows[0]?.name ?? "—"}</strong><small>{rows[0] ? formatPoints(rows[0].points) : "0"} points</small></div>
        <div><span>Plateau</span><strong className="mono">{String(snapshotMeta?.totalClassified ?? rows.length).padStart(2, "0")}</strong><small>{mode === "individual" ? "navigateurs classés" : "équipages classés"}</small></div>
        <div><span>Règle de classement</span><strong>{snapshotMeta?.scoreDirection === "low" ? "Score minimum" : "Score maximum"}</strong><small>{snapshotMeta?.scoringLabel ?? "instantané verrouillé"}</small></div>
        <div><span>{snapshotMeta ? "Étapes courues" : "Dernière manche"}</span><strong className="mono">{snapshotMeta ? `${String(snapshotMeta.completedRaces).padStart(2, "0")} / ${String(snapshotMeta.totalRaces).padStart(2, "0")}` : "06 / 06"}</strong><small>{snapshotMeta?.sourceLabel ?? eventName}</small></div>
      </section>

      <div className={`rank-control-grid rank-control-grid--${mode} ${isIntelOpen ? "intel-open" : ""}`}>
        <section className="control-list-panel">
          <div className="control-panel-head">
            <div className="view-switch" aria-label="Changer de classement">
              <Link className={mode === "boats" ? "active" : ""} href="/classements?vue=bateaux">Équipages</Link>
              <Link className={mode === "individual" ? "active" : ""} href="/classements?vue=individuel">Navigateurs</Link>
            </div>
            <label className="control-search"><Search aria-hidden /><span className="sr-only">Filtrer</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={mode === "individual" ? "Rechercher un navigateur" : "Rechercher un équipage"} /></label>
          </div>
          <div
            className="standings-head standings-grid"
            style={{ "--stage-count": events.length, "--completed-stage-count": events.filter((event) => event.status === "completed").length } as React.CSSProperties}
          >
            <span>Pos.</span>
            <span>{mode === "individual" ? "Navigateur" : "Équipage"}</span>
            {events.map((event, index) => (
              <abbr key={event.id} title={event.name} className={`standings-stage-label ${event.status}`}>
                É{index + 1}
              </abbr>
            ))}
            <span className="standings-total-label">Total</span>
          </div>
          <div className="control-ranking-list">
            {filtered.length === 0 ? <div className="control-empty-ranking"><Search aria-hidden /><strong>{mode === "individual" ? "Aucun navigateur trouvé" : "Aucun équipage trouvé"}</strong><span>Essayez une autre recherche.</span></div> : null}
            {filtered.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => { setSelectedId(row.id); setIsIntelOpen(true); }}
                className={`standings-row standings-grid ${isIntelOpen && selected?.id === row.id ? "selected" : ""}`}
                style={{ "--competitor-color": row.color, "--stage-count": events.length, "--completed-stage-count": events.filter((event) => event.status === "completed").length } as React.CSSProperties}
              >
                <span className="standings-pos"><span className="mono">{row.position}</span></span>
                <span className="standings-name"><strong>{row.name}</strong></span>
                {events.map((event, index) => (
                  <span key={event.id} className={`standings-score mono ${event.status} ${row.eventScores?.[index] == null ? "pending" : ""}`}>
                    {row.eventScores?.[index] ?? "·"}
                  </span>
                ))}
                <span className="standings-total mono">{formatPoints(row.points)}</span>
              </button>
            ))}
          </div>
        </section>

        {selected && isIntelOpen ? <aside key={selected.id} className="competitor-intel mobile-open" style={{ "--competitor-color": selected.color } as React.CSSProperties} aria-label={`Détail de ${selected.name}`}>
          <div className="intel-overline"><span><DecodeText text={snapshotMeta ? "Classement provisoire" : "Sélection active"} speed={16} delay={170} /></span><span className="mono"><DecodeText text={`RANG · ${selected.position.toString().padStart(2, "0")}`} speed={15} delay={260} /></span><Link className="intel-close" href={mode === "individual" ? "/classements?vue=individuel" : "/classements?vue=bateaux"} aria-label="Fermer le détail"><X /></Link></div>
          <div className="intel-title"><span className="intel-position"><CountUpNumber value={selected.position} duration={480} delay={280} /><sup>{selected.position === 1 ? "er" : "e"}</sup></span><div><h2><DecodeText text={selected.name} speed={18} delay={330} /></h2><p><DecodeText text={selected.subtitle} speed={14} delay={460} /></p></div></div>
          <div className="intel-score"><span><DecodeText text={`Total après ${snapshotMeta?.completedRaces ?? selected.races ?? "—"} étapes`} speed={14} delay={520} /></span><strong className="mono"><CountUpNumber value={selected.points} decimals={Number.isInteger(selected.points) ? 0 : 1} duration={760} delay={560} /></strong><small>PTS</small></div>
          {mode === "boats" ? <div className="intel-crew"><div className="intel-section-title"><Users /><DecodeText text="Équipage de la dernière étape" speed={14} delay={650} /></div>{selected.crew && selected.crew.length > 0 ? selected.crew.map((member, memberIndex) => <Link key={member.slug} href={`/classements?vue=individuel&selection=${member.slug}`} style={{ "--hud-row": memberIndex } as React.CSSProperties}><span><DecodeText text={member.name} speed={14} delay={710 + memberIndex * 80} /></span><small><DecodeText text={member.role} speed={12} delay={760 + memberIndex * 80} /></small><ChevronRight /></Link>) : <div className="intel-empty">Composition non publiée</div>}</div> : <div className="intel-crew"><div className="intel-section-title"><Sparkles /><DecodeText text="Équipage de la dernière étape" speed={14} delay={650} /></div>{selected.boatHref ? <Link href={selected.boatHref} style={{ "--hud-row": 0 } as React.CSSProperties}><span><DecodeText text={selected.boatName ?? ""} speed={14} delay={710} /></span><small><DecodeText text={selected.role ?? "Navigateur"} speed={12} delay={760} /></small><ChevronRight /></Link> : <div className="intel-empty">Affectation non publiée</div>}</div>}
          {snapshotMeta && selected.eventScores ? <div className="intel-breakdown"><div className="intel-section-title"><Trophy /><DecodeText text="Étapes courues" speed={14} delay={780} /></div>{completedEvents.map(({ event, index }, eventIndex) => <div className="intel-event-score" key={event.id} style={{ "--hud-row": eventIndex } as React.CSSProperties}><span><i>{index + 1}</i><span><strong><DecodeText text={event.shortName} speed={13} delay={840 + eventIndex * 70} /></strong></span></span><strong className={`mono ${selected.eventScores?.[index] == null ? "pending" : ""}`}>{selected.eventScores?.[index] == null ? "—" : <CountUpNumber value={selected.eventScores?.[index] as number} decimals={Number.isInteger(selected.eventScores?.[index]) ? 0 : 1} duration={600} delay={880 + eventIndex * 70} />}</strong></div>)}</div> : null}
        </aside> : null}
      </div>
    </div>
  </ControlShell>;
}
