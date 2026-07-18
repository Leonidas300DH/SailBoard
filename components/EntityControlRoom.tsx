"use client";

import Link from "next/link";
import { Activity, ChevronRight, Flag, Gauge, Radio, ShieldCheck, Trophy, Users } from "lucide-react";
import { ControlShell } from "./shell/AppShell";
import type { RaceView } from "@/lib/domain";

type HistoryRow = { raceName: string; raceSlug: string; eventName: string; date: string; position: number | null; points: number; status?: string; boatName?: string; boatSlug?: string; role?: string };

function RecordList({ rows, participant }: { rows: HistoryRow[]; participant?: boolean }) {
  return <div className={`entity-ledger${participant ? " entity-ledger--participant" : ""}`}>
    <div className="entity-ledger-head"><span>Étape</span><span>{participant ? "Équipage" : "Publication"}</span><span>{participant ? "Rôle" : "Pos."}</span><span>Points WDT</span></div>
    {rows.map((row) => <Link href={`/courses/${row.raceSlug}`} key={`${row.raceSlug}-${row.boatSlug ?? "boat"}`} className="entity-ledger-row">
      <span><strong>{row.eventName}</strong><small>{row.raceName} · {new Date(row.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</small></span>
      <span>{participant ? <strong>{row.boatName}</strong> : <><strong className="acid">Publié</strong><small>points officiels</small></>}</span>
      <span className="entity-place">{participant ? row.role ?? "—" : row.position ?? "—"}</span><span className="mono acid">{row.points.toFixed(1)}</span>
    </Link>)}
  </div>;
}

export function BoatControlRoom({ boat, history, race }: { boat: { name: string; slug: string; model: string; sailNumber: string; color: string }; history: HistoryRow[]; race: RaceView }) {
  const current = race.leaderboard.find((row) => row.boatSlug === boat.slug);
  const total = history.reduce((sum, row) => sum + row.points, 0);
  return <ControlShell active="rankings" raceSlug={race.slug} eventName={race.eventName} title={boat.name} eyebrow="Fiche équipage · championnat 2026">
    <div className="entity-control-body" style={{ "--competitor-color": boat.color } as React.CSSProperties}>
      <section className="entity-hero-grid">
        <div className="entity-identity">
          <div className="entity-identity-top">
            <div className="entity-code"><Radio /> ACTIF · FRA</div>
            <div className="entity-rank"><span>Rang actuel</span><strong className="mono">{String(current?.position ?? "—").padStart(2, "0")}</strong></div>
          </div>
          <h2>{boat.name}</h2><p>{boat.model} · <span className="mono">{boat.sailNumber}</span></p>
          <div className="entity-identity-footer">
            <div className="entity-score"><span>Score championnat</span><strong className="mono">{total.toFixed(1)}</strong><small>points officiels</small></div>
            <div className="entity-badges"><span><ShieldCheck /> Résultats certifiés</span><span><Activity /> {history.length} étape{history.length > 1 ? "s" : ""} disputée{history.length > 1 ? "s" : ""}</span></div>
          </div>
        </div>
        <div className="entity-telemetry">
          <div className="intel-overline"><span>Dernière étape · {race.eventName} · {race.locationName}</span><span className="mono">OFFICIEL</span></div>
          <div className="entity-stage-summary">
            <div className="telemetry-position"><span>Points de l’étape</span><strong>{current?.points.toFixed(1) ?? "0.0"}<sup>pts</sup></strong></div>
            <div className="entity-stage-metric"><Trophy /><span>Total saison</span><strong className="mono">{total.toFixed(1)}</strong></div>
            {current?.elapsedSeconds ? <div className="entity-stage-metric"><Gauge /><span>Temps publié</span><strong className="mono">{new Date(current.elapsedSeconds * 1000).toISOString().slice(11, 19)}</strong></div> : null}
          </div>
          <div className="intel-section-title"><Users />Navigateurs de l’équipage</div>
          <div className="entity-crew-list">{current?.crew.map((member) => <Link href={`/participants/${member.slug}`} key={member.id}><span>{member.name}</span><small>{member.role} · {(member.points ?? current.points).toFixed(1)} pts</small><ChevronRight /></Link>)}</div>
          <Link className="intel-primary-link" href={`/courses/${race.slug}`}>Voir l’étape <Flag /></Link>
        </div>
      </section>
      <section className="entity-record-panel"><div className="control-panel-head"><div><span className="panel-kicker">Journal sportif</span><h3>Historique des étapes</h3></div><span className="mono muted">{history.length.toString().padStart(2, "0")} ENTRÉE</span></div><RecordList rows={history} /></section>
    </div>
  </ControlShell>;
}

export function ParticipantControlRoom({ participant, history, race }: { participant: { name: string; slug: string; nationality: string }; history: HistoryRow[]; race: RaceView }) {
  const total = history.reduce((sum, row) => sum + row.points, 0);
  const latest = history[0];
  const currentEntry = race.leaderboard.find((entry) => entry.crew.some((member) => member.slug === participant.slug));
  return <ControlShell active="sailors" raceSlug={race.slug} eventName={race.eventName} title={participant.name} eyebrow="Fiche navigateur · classement individuel">
    <div className="entity-control-body" style={{ "--competitor-color": currentEntry?.color ?? "var(--acid)" } as React.CSSProperties}>
      <section className="entity-hero-grid participant-grid">
        <div className="entity-identity">
          <div className="entity-identity-top">
            <div className="entity-code"><Radio /> PROFIL PUBLIC · {participant.nationality}</div>
            <div className="entity-rank"><span>Rang actuel</span><strong className="mono">{String(currentEntry?.position ?? "—").padStart(2, "0")}</strong></div>
          </div>
          <h2>{participant.name}</h2><p>{latest?.role ?? "Navigateur"} · championnat 2026</p>
          <div className="entity-identity-footer">
            <div className="entity-score"><span>Capital individuel</span><strong className="mono">{total.toFixed(1)}</strong><small>points officiels</small></div>
            <div className="entity-badges"><span><ShieldCheck /> Profil vérifié</span><span><Activity /> {history.length} étape{history.length > 1 ? "s" : ""} disputée{history.length > 1 ? "s" : ""}</span></div>
          </div>
        </div>
        <div className="entity-telemetry">
          <div className="intel-overline"><span>Attribution individuelle · {race.eventName} · {race.locationName}</span><span className="mono">OFFICIEL</span></div>
          <div className="entity-participant-summary">
            <div className="telemetry-position"><span>Points de l’étape</span><strong>{latest?.points.toFixed(1) ?? "0.0"}<sup>pts</sup></strong></div>
            <div className="allocation-context">
              <div className="allocation-track"><i style={{ width: `${Math.min(100, (latest?.points ?? 0) / 18 * 100)}%` }} /></div>
              <p className="allocation-note">Attribution publiée selon le barème officiel WDT.</p>
              {latest?.boatSlug ? <Link className="assignment-link" href={`/bateaux/${latest.boatSlug}`}><span><small>Équipage de l’étape</small><strong>{latest.boatName}</strong></span><ChevronRight /></Link> : null}
            </div>
          </div>
          <Link className="intel-primary-link" href={`/courses/${race.slug}`}>Voir l’étape <Flag /></Link>
        </div>
      </section>
      <section className="entity-record-panel"><div className="control-panel-head"><div><span className="panel-kicker">Journal individuel</span><h3>Équipages et points par étape</h3></div><span className="mono muted">TRAÇABILITÉ COMPLÈTE</span></div><RecordList rows={history} participant /></section>
    </div>
  </ControlShell>;
}
