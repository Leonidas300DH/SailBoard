"use client";

import Link from "next/link";
import { Activity, ChevronRight, Flag, Gauge, Radio, ShieldCheck, Trophy, Users } from "lucide-react";
import { ControlShell } from "./shell/AppShell";
import { SeasonMap } from "./season/SeasonMap";
import type { RaceView } from "@/lib/domain";
import { SEASON_RACES } from "@/lib/season-data";

type HistoryRow = { raceName: string; raceSlug: string; eventName: string; date: string; position: number | null; points: number; status?: string; boatName?: string; boatSlug?: string; role?: string };
const ignoreRaceSelection = () => undefined;

function RecordList({ rows, participant }: { rows: HistoryRow[]; participant?: boolean }) {
  return <div className="entity-ledger">
    <div className="entity-ledger-head"><span>Course</span><span>{participant ? "Bateau / rôle" : "Statut"}</span><span>Pos.</span><span>Points</span></div>
    {rows.map((row) => <Link href={`/courses/${row.raceSlug}`} key={`${row.raceSlug}-${row.boatSlug ?? "boat"}`} className="entity-ledger-row">
      <span><strong>{row.eventName}</strong><small>{row.raceName} · {new Date(row.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</small></span>
      <span>{participant ? <><strong>{row.boatName}</strong><small>{row.role}</small></> : <><strong className="acid">Classé</strong><small>résultat verrouillé</small></>}</span>
      <span className="entity-place">{row.position ?? "—"}</span><span className="mono acid">{row.points.toFixed(1)}</span>
    </Link>)}
  </div>;
}

export function BoatControlRoom({ boat, history, race }: { boat: { name: string; slug: string; model: string; sailNumber: string; color: string }; history: HistoryRow[]; race: RaceView }) {
  const current = race.leaderboard.find((row) => row.boatSlug === boat.slug);
  const total = history.reduce((sum, row) => sum + row.points, 0);
  const locatedRaces = [SEASON_RACES[2]];
  return <ControlShell active="rankings" raceSlug={race.slug} eventName={race.eventName} title={`Dossier bateau · ${boat.name}`} eyebrow="Flotte officielle · unité sportive">
    <div className="entity-control-body" style={{ "--competitor-color": boat.color } as React.CSSProperties}>
      <section className="entity-hero-grid">
        <div className="entity-identity">
          <div className="entity-code"><Radio /> ACTIF · FRA</div>
          <span className="entity-index">{String(current?.position ?? "—").padStart(2, "0")}</span>
          <h2>{boat.name}</h2><p>{boat.model} · <span className="mono">{boat.sailNumber}</span></p>
          <div className="entity-score"><span>Score championnat</span><strong className="mono">{total.toFixed(1)}</strong><small>points officiels</small></div>
          <div className="entity-badges"><span><ShieldCheck /> Résultats certifiés</span><span><Activity /> {history.length} manche disputée</span></div>
        </div>
        <div className="entity-map-panel"><SeasonMap races={locatedRaces} selectedRace={locatedRaces[0]} circuitOpen={false} isPlaying={false} onSelect={ignoreRaceSelection} /><div className="map-shade global-map-shade" /><div className="entity-map-label"><span>Implantation des courses disputées</span><strong>{race.locationName}</strong><small>{race.eventName} · {race.name}</small></div></div>
        <div className="entity-telemetry">
          <div className="intel-overline"><span>Dernière manche</span><span className="mono">OFFICIEL</span></div>
          <div className="telemetry-position"><span>Position</span><strong>{current?.position ?? "—"}<sup>e</sup></strong></div>
          <div className="telemetry-grid"><div><Gauge /><span>Temps</span><strong className="mono">{current?.elapsedSeconds ? new Date(current.elapsedSeconds * 1000).toISOString().slice(11, 19) : "—"}</strong></div><div><Trophy /><span>Points</span><strong className="mono">{current?.points.toFixed(1) ?? "0.0"}</strong></div></div>
          <div className="intel-section-title"><Users />Équipage engagé</div>
          <div className="entity-crew-list">{current?.crew.map((member) => <Link href={`/participants/${member.slug}`} key={member.id}><span>{member.name}</span><small>{member.role} · {(member.points ?? current.points).toFixed(1)} pts</small><ChevronRight /></Link>)}</div>
          <Link className="intel-primary-link" href={`/courses/${race.slug}`}>Revoir la manche <Flag /></Link>
        </div>
      </section>
      <section className="entity-record-panel"><div className="control-panel-head"><div><span className="panel-kicker">Journal sportif</span><h3>Historique des courses</h3></div><span className="mono muted">{history.length.toString().padStart(2, "0")} ENTRÉE</span></div><RecordList rows={history} /></section>
    </div>
  </ControlShell>;
}

export function ParticipantControlRoom({ participant, history, race }: { participant: { name: string; slug: string; nationality: string }; history: HistoryRow[]; race: RaceView }) {
  const total = history.reduce((sum, row) => sum + row.points, 0);
  const latest = history[0];
  const currentEntry = race.leaderboard.find((entry) => entry.crew.some((member) => member.slug === participant.slug));
  const locatedRaces = [SEASON_RACES[2]];
  return <ControlShell active="sailors" raceSlug={race.slug} eventName={race.eventName} title={`Dossier marin · ${participant.name}`} eyebrow="Performance individuelle · profil officiel">
    <div className="entity-control-body" style={{ "--competitor-color": currentEntry?.color ?? "var(--acid)" } as React.CSSProperties}>
      <section className="entity-hero-grid participant-grid">
        <div className="entity-identity">
          <div className="entity-code"><Radio /> PROFIL PUBLIC · {participant.nationality}</div>
          <span className="entity-index">{String(currentEntry?.position ?? "—").padStart(2, "0")}</span>
          <h2>{participant.name}</h2><p>{latest?.role ?? "Équipier"} · championnat 2026</p>
          <div className="entity-score"><span>Capital individuel</span><strong className="mono">{total.toFixed(1)}</strong><small>points officiels</small></div>
          <div className="entity-badges"><span><ShieldCheck /> Profil vérifié</span><span><Activity /> {history.length} manche disputée</span></div>
        </div>
        <div className="entity-map-panel"><SeasonMap races={locatedRaces} selectedRace={locatedRaces[0]} circuitOpen={false} isPlaying={false} onSelect={ignoreRaceSelection} /><div className="map-shade global-map-shade" /><div className="entity-map-label"><span>Implantation des courses disputées</span><strong>{race.locationName}</strong><small>{latest?.boatName ?? "—"} · {latest?.role ?? "—"}</small></div></div>
        <div className="entity-telemetry">
          <div className="intel-overline"><span>Attribution individuelle</span><span className="mono">RÈGLE · V1</span></div>
          <div className="telemetry-position"><span>Points de la manche</span><strong>{latest?.points.toFixed(1) ?? "0.0"}<sup>pts</sup></strong></div>
          <div className="allocation-track"><i style={{ width: `${Math.min(100, (latest?.points ?? 0) / 18 * 100)}%` }} /></div>
          <p className="allocation-note">Même score que le bateau. Cette attribution reste liée à la version du barème publiée pour la manche.</p>
          {latest?.boatSlug ? <Link className="assignment-link" href={`/bateaux/${latest.boatSlug}`}><span><small>Bateau affecté</small><strong>{latest.boatName}</strong></span><ChevronRight /></Link> : null}
          <Link className="intel-primary-link" href={`/courses/${race.slug}`}>Ouvrir la course <Flag /></Link>
        </div>
      </section>
      <section className="entity-record-panel"><div className="control-panel-head"><div><span className="panel-kicker">Journal individuel</span><h3>Bateaux, rôles et résultats</h3></div><span className="mono muted">TRAÇABILITÉ COMPLÈTE</span></div><RecordList rows={history} participant /></section>
    </div>
  </ControlShell>;
}
