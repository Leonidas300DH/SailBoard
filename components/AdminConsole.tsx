"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Anchor, ClipboardCheck, Gauge, KeyRound, LayoutDashboard, ListChecks, MapPinned, Plus, Sailboat, Save, Settings2, ShieldCheck, Users } from "lucide-react";
import type { AdminIdentity } from "@/lib/auth";
import type { RaceView, ResultStatus, ScoringConfig } from "@/lib/domain";
import { scoreBoat } from "@/lib/scoring.mjs";
import { CourseEditor } from "./CourseEditor";

type Snapshot = {
  race: RaceView;
  boats: Record<string, unknown>[];
  participants: Record<string, unknown>[];
  seasons: Record<string, unknown>[];
  events: Record<string, unknown>[];
  races: Record<string, unknown>[];
  rules: Record<string, unknown>[];
  accessRequests: Record<string, unknown>[];
  admins: Record<string, unknown>[];
};

type Tab = "dashboard" | "organisation" | "fleet" | "course" | "results" | "rules" | "access";

const tabs: Array<{ id: Tab; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Vue d’ensemble", icon: LayoutDashboard },
  { id: "organisation", label: "Saisons & courses", icon: ListChecks },
  { id: "fleet", label: "Flotte & équipages", icon: Sailboat },
  { id: "course", label: "Parcours", icon: MapPinned },
  { id: "results", label: "Résultats", icon: ClipboardCheck },
  { id: "rules", label: "Barèmes", icon: Settings2 },
  { id: "access", label: "Accès", icon: KeyRound },
];

function FormField({ label, children, full = false }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <div className={`field ${full ? "full" : ""}`}><label>{label}</label>{children}</div>;
}

export function AdminConsole({ admin, snapshot }: { admin: AdminIdentity; snapshot: Snapshot }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const publishedRule = useMemo(() => snapshot.rules.find((rule) => rule.status === "published") ?? snapshot.rules[0], [snapshot.rules]);
  const scoringConfig = useMemo(() => JSON.parse(String(publishedRule?.config_json ?? "{}")) as ScoringConfig, [publishedRule]);

  async function send(url: string, payload: unknown, method = "POST") {
    setBusy(true); setFeedback(null);
    try {
      const response = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(data.error ?? "Action impossible");
      setFeedback({ kind: "success", message: data.message ?? "Modification enregistrée" });
      router.refresh();
      return true;
    } catch (error) {
      setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Action impossible" });
      return false;
    } finally { setBusy(false); }
  }

  return <main className="admin-shell">
    <aside className="admin-sidebar"><Link href="/" className="brand"><span>SailBoard</span><span>Admin</span></Link><nav className="admin-tabs">{tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={`admin-tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)} aria-label={label} aria-pressed={tab === id}><Icon /><span>{label}</span></button>)}</nav><div className="admin-account"><strong>{admin.email}</strong><span>{admin.role === "owner" ? "Propriétaire" : "Administrateur"}</span><Link href="/">Retour au site</Link></div></aside>
    <section className="admin-main"><header className="admin-header"><div><h1>{tabs.find((item) => item.id === tab)?.label}</h1><p>Championnat 2026 · données enregistrées dans SailBoard</p></div><Link className="button" href="/"><Gauge />Voir le cockpit</Link></header>{feedback ? <div className={`notice ${feedback.kind}`}>{feedback.message}</div> : null}<div className="admin-content">
      {tab === "dashboard" ? <Dashboard snapshot={snapshot} setTab={setTab} /> : null}
      {tab === "organisation" ? <Organisation snapshot={snapshot} send={send} busy={busy} /> : null}
      {tab === "fleet" ? <Fleet snapshot={snapshot} send={send} busy={busy} /> : null}
      {tab === "course" ? <CourseEditor race={snapshot.race} onSaved={() => router.refresh()} /> : null}
      {tab === "results" ? <ResultsEditor race={snapshot.race} config={scoringConfig} send={send} busy={busy} /> : null}
      {tab === "rules" ? <RulesEditor rule={publishedRule} admin={admin} send={send} busy={busy} /> : null}
      {tab === "access" ? <AccessPanel snapshot={snapshot} admin={admin} send={send} busy={busy} /> : null}
    </div></section>
  </main>;
}

function Dashboard({ snapshot, setTab }: { snapshot: Snapshot; setTab: (tab: Tab) => void }) {
  const pending = snapshot.accessRequests.filter((item) => item.status === "pending").length;
  return <><div className="metric-strip"><div className="metric-block"><strong>{snapshot.seasons.length}</strong><span>Saison active</span></div><div className="metric-block"><strong>{snapshot.boats.length}</strong><span>Bateaux</span></div><div className="metric-block"><strong>{snapshot.participants.length}</strong><span>Participants</span></div><div className="metric-block"><strong className={pending ? "acid" : ""}>{pending}</strong><span>Demandes d’accès</span></div></div>
    <div className="section-head"><h2>À traiter</h2></div><div className="admin-grid"><article className="admin-panel"><div className="admin-panel-head"><h2>Dernière course</h2><span className="status-tag">Validée</span></div><div className="admin-panel-body"><strong className="race-font" style={{ fontSize: 26 }}>{snapshot.race.eventName} · {snapshot.race.name}</strong><p className="muted">{snapshot.race.leaderboard.length} bateaux classés · {snapshot.race.distanceNm.toFixed(1)} milles nautiques</p><div className="action-row"><button className="button small" onClick={() => setTab("results")}>Ouvrir les résultats</button><button className="button small" onClick={() => setTab("course")}>Voir le parcours</button></div></div></article>
    <article className="admin-panel"><div className="admin-panel-head"><h2>Accès administrateurs</h2><span className={`status-tag ${pending ? "pending" : ""}`}>{pending} en attente</span></div><div className="admin-panel-body"><p className="muted">Chaque compte connecté doit être approuvé avant de pouvoir modifier les données.</p><button className="button small" onClick={() => setTab("access")}>Gérer les accès</button></div></article></div></>;
}

function Organisation({ snapshot, send, busy }: { snapshot: Snapshot; send: (url: string, payload: unknown) => Promise<boolean>; busy: boolean }) {
  async function onSubmit(event: React.FormEvent<HTMLFormElement>, action: string) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const payload = Object.fromEntries(form.entries());
    if (await send("/api/admin/manage", { action, ...payload })) event.currentTarget.reset();
  }
  return <div className="admin-grid"><article className="admin-panel"><div className="admin-panel-head"><h2>Nouvelle saison</h2></div><form className="admin-panel-body form-grid" onSubmit={(event) => void onSubmit(event, "createSeason")}><FormField label="Nom"><input name="name" required placeholder="Championnat 2027" /></FormField><FormField label="Année"><input name="year" type="number" required min="2026" defaultValue="2027" /></FormField><FormField label="Début"><input name="startsOn" type="date" required /></FormField><FormField label="Fin"><input name="endsOn" type="date" required /></FormField><div className="full"><button className="button primary" disabled={busy}><Plus />Créer la saison</button></div></form></article>
    <article className="admin-panel"><div className="admin-panel-head"><h2>Nouvel événement</h2></div><form className="admin-panel-body form-grid" onSubmit={(event) => void onSubmit(event, "createEvent")}><FormField label="Saison"><select name="seasonId" required>{snapshot.seasons.map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.name)}</option>)}</select></FormField><FormField label="Nom"><input name="name" required placeholder="Grand Prix de Quiberon" /></FormField><FormField label="Lieu"><input name="locationName" required placeholder="Quiberon" /></FormField><FormField label="Date"><input name="startsOn" type="date" required /></FormField><div className="full"><button className="button primary" disabled={busy}><Plus />Créer l’événement</button></div></form></article>
    <article className="admin-panel full"><div className="admin-panel-head"><h2>Nouvelle manche</h2></div><form className="admin-panel-body form-grid" onSubmit={(event) => void onSubmit(event, "createRace")}><FormField label="Événement"><select name="eventId" required>{snapshot.events.map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.name)}</option>)}</select></FormField><FormField label="Nom"><input name="name" required placeholder="Manche 1" /></FormField><FormField label="Départ prévu"><input name="scheduledAt" type="datetime-local" required /></FormField><FormField label="Barème"><select name="scoringRuleVersionId" required>{snapshot.rules.filter((item) => item.status === "published").map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.name)} · v{String(item.version)}</option>)}</select></FormField><div className="full"><button className="button primary" disabled={busy}><Plus />Créer la manche</button></div></form></article>
    <article className="admin-panel full"><div className="admin-panel-head"><h2>Structure actuelle</h2></div><div className="admin-panel-body admin-list">{snapshot.races.map((race) => <div key={String(race.id)} className="admin-list-row"><div><strong>{String(race.name)}</strong><small>{new Date(String(race.scheduled_at)).toLocaleString("fr-FR")}</small></div><span className="status-tag">{String(race.status)}</span></div>)}</div></article></div>;
}

function Fleet({ snapshot, send, busy }: { snapshot: Snapshot; send: (url: string, payload: unknown) => Promise<boolean>; busy: boolean }) {
  async function onSubmit(event: React.FormEvent<HTMLFormElement>, action: string) { event.preventDefault(); const form = new FormData(event.currentTarget); if (await send("/api/admin/manage", { action, ...Object.fromEntries(form.entries()) })) event.currentTarget.reset(); }
  return <div className="admin-grid"><article className="admin-panel"><div className="admin-panel-head"><h2>Ajouter un bateau</h2></div><form className="admin-panel-body form-grid" onSubmit={(event) => void onSubmit(event, "createBoat")}><FormField label="Nom"><input name="name" required /></FormField><FormField label="N° de voile"><input name="sailNumber" required /></FormField><FormField label="Modèle"><input name="model" required defaultValue="J/80" /></FormField><FormField label="Couleur"><input name="color" type="color" defaultValue="#d9ff00" /></FormField><div className="full"><button className="button primary" disabled={busy}><Plus />Ajouter</button></div></form></article>
    <article className="admin-panel"><div className="admin-panel-head"><h2>Ajouter un participant</h2></div><form className="admin-panel-body form-grid" onSubmit={(event) => void onSubmit(event, "createParticipant")}><FormField label="Nom complet" full><input name="name" required /></FormField><FormField label="Nationalité"><input name="nationality" defaultValue="FR" maxLength={2} /></FormField><FormField label="Profil public"><select name="publicVisible" defaultValue="1"><option value="1">Visible</option><option value="0">Masqué</option></select></FormField><div className="full"><button className="button primary" disabled={busy}><Plus />Ajouter</button></div></form></article>
    <article className="admin-panel full"><div className="admin-panel-head"><h2>Engager un bateau et son équipage</h2></div><form className="admin-panel-body form-grid" onSubmit={(event) => void onSubmit(event, "createEntry")}><FormField label="Course"><select name="raceId" required>{snapshot.races.map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.name)}</option>)}</select></FormField><FormField label="Bateau"><select name="boatId" required>{snapshot.boats.map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.name)}</option>)}</select></FormField><FormField label="Barreur"><select name="helmId" required>{snapshot.participants.map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.name)}</option>)}</select></FormField><FormField label="Régleur"><select name="trimId" required>{snapshot.participants.map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.name)}</option>)}</select></FormField><FormField label="Avant"><select name="bowId" required>{snapshot.participants.map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.name)}</option>)}</select></FormField><FormField label="N° de départ"><input name="startNumber" type="number" min="1" required /></FormField><div className="full"><button className="button primary" disabled={busy}><Anchor />Engager l’équipage</button></div></form></article>
    <article className="admin-panel"><div className="admin-panel-head"><h2>Bateaux</h2><span>{snapshot.boats.length}</span></div><div className="admin-panel-body admin-list">{snapshot.boats.map((item) => <div className="admin-list-row" key={String(item.id)}><div><strong>{String(item.name)}</strong><small>{String(item.model)} · {String(item.sail_number)}</small></div><span style={{ width: 10, height: 28, background: String(item.color) }} /></div>)}</div></article>
    <article className="admin-panel"><div className="admin-panel-head"><h2>Participants</h2><span>{snapshot.participants.length}</span></div><div className="admin-panel-body admin-list">{snapshot.participants.slice(0, 12).map((item) => <div className="admin-list-row" key={String(item.id)}><div><strong>{String(item.name)}</strong><small>{item.public_visible ? "Profil public" : "Profil masqué"}</small></div><Users size={16} /></div>)}</div></article></div>;
}

function ResultsEditor({ race, config, send, busy }: { race: RaceView; config: ScoringConfig; send: (url: string, payload: unknown) => Promise<boolean>; busy: boolean }) {
  const [rows, setRows] = useState(() => race.leaderboard.map((row) => ({ entryId: row.entryId, boatName: row.boatName, crew: row.crew, position: row.position ?? 0, status: row.status, elapsedSeconds: row.elapsedSeconds ?? 0, penaltyPoints: 0, manualAwards: Object.fromEntries(row.crew.map((member) => [member.id, member.points ?? 0])) })));
  const update = (entryId: string, patch: Partial<(typeof rows)[number]>) => setRows((current) => current.map((row) => row.entryId === entryId ? { ...row, ...patch } : row));
  return <article className="admin-panel"><div className="admin-panel-head"><h2>{race.eventName} · {race.name}</h2><span className="status-tag">Prévisualisation active</span></div><div className="admin-panel-body"><div className="result-editor">{rows.map((row) => <div className="result-group" key={row.entryId}><div className="result-edit-row"><strong>{row.boatName}</strong><input aria-label={`Position ${row.boatName}`} type="number" min="1" value={row.position} onChange={(event) => update(row.entryId, { position: Number(event.target.value) })} /><select aria-label={`Statut ${row.boatName}`} value={row.status} onChange={(event) => update(row.entryId, { status: event.target.value as ResultStatus })}><option value="classified">Classé</option><option value="dnf">Abandon</option><option value="dns">Non-partant</option><option value="dsq">Disqualifié</option></select><input aria-label={`Pénalité ${row.boatName}`} type="number" min="0" step="0.5" value={row.penaltyPoints} onChange={(event) => update(row.entryId, { penaltyPoints: Number(event.target.value) })} /><span className="mono acid">{scoreBoat(config, row).toFixed(1)} pts</span></div>{config.individualMode === "manual" ? <div className="manual-awards">{row.crew.map((member) => <label key={member.id}>{member.name}<input aria-label={`Points de ${member.name}`} type="number" step="0.5" value={row.manualAwards[member.id] ?? 0} onChange={(event) => update(row.entryId, { manualAwards: { ...row.manualAwards, [member.id]: Number(event.target.value) } })} /></label>)}</div> : null}</div>)}</div><div className="action-row"><button className="button primary" disabled={busy} onClick={() => void send("/api/admin/results", { raceId: race.id, results: rows })}><ShieldCheck />Valider les résultats</button></div></div></article>;
}

function RulesEditor({ rule, admin, send, busy }: { rule: Record<string, unknown> | undefined; admin: AdminIdentity; send: (url: string, payload: unknown) => Promise<boolean>; busy: boolean }) {
  const current = JSON.parse(String(rule?.config_json ?? "{}")) as ScoringConfig;
  const [mode, setMode] = useState(current.individualMode ?? "same_as_boat");
  const [direction, setDirection] = useState(current.direction ?? "high");
  const [positionPoints, setPositionPoints] = useState(() => Array.from({ length: 10 }, (_, index) => current.positionPoints?.[String(index + 1)] ?? Math.max(0, 18 - index * 2)));
  const [participationPoints, setParticipationPoints] = useState(current.participationPoints ?? 0);
  const [statusPoints, setStatusPoints] = useState(current.statusPoints ?? { dnf: 0, dns: 0, dsq: 0 });
  const [roleWeights, setRoleWeights] = useState(current.roleWeights ?? { Barre: 1, Réglage: 1, Avant: 1 });
  const [tieBreaker, setTieBreaker] = useState(current.tieBreakers?.[0] ?? "wins");
  const canEdit = admin.role === "owner";
  const payload = { sourceRuleId: rule?.id, direction, individualMode: mode, positionPoints, participationPoints, statusPoints, roleWeights, tieBreaker };
  return <div className="admin-grid"><article className="admin-panel full"><div className="admin-panel-head"><h2>{String(rule?.name ?? "Nouveau barème")} · version {Number(rule?.version ?? 0) + 1}</h2><span className="status-tag pending">Nouvelle version</span></div><div className="admin-panel-body"><div className="form-grid"><FormField label="Sens du classement"><select value={direction} onChange={(event) => setDirection(event.target.value as "high" | "low")} disabled={!canEdit}><option value="high">Plus de points gagne</option><option value="low">Moins de points gagne</option></select></FormField><FormField label="Attribution individuelle"><select value={mode} onChange={(event) => setMode(event.target.value as ScoringConfig["individualMode"])} disabled={!canEdit}><option value="same_as_boat">Même score que le bateau</option><option value="split_evenly">Partage égal</option><option value="weighted_roles">Coefficient par rôle</option><option value="manual">Saisie manuelle</option></select></FormField><FormField label="Départage"><select value={tieBreaker} onChange={(event) => setTieBreaker(event.target.value as ScoringConfig["tieBreakers"][number])} disabled={!canEdit}><option value="wins">Nombre de victoires</option><option value="best_recent">Meilleur résultat récent</option><option value="best_result">Meilleur résultat</option></select></FormField><FormField label="Points de participation"><input type="number" step="0.5" value={participationPoints} onChange={(event) => setParticipationPoints(Number(event.target.value))} disabled={!canEdit} /></FormField></div><div className="section-head"><h2>Statuts spéciaux</h2></div><div className="form-grid">{([['dnf','Abandon'],['dns','Non-partant'],['dsq','Disqualifié']] as const).map(([key,label]) => <FormField label={label} key={key}><input type="number" step="0.5" value={statusPoints[key]} onChange={(event) => setStatusPoints((values) => ({ ...values, [key]: Number(event.target.value) }))} disabled={!canEdit} /></FormField>)}</div>{mode === "weighted_roles" ? <><div className="section-head"><h2>Coefficients par rôle</h2></div><div className="form-grid">{(['Barre','Réglage','Avant'] as const).map((role) => <FormField label={role} key={role}><input type="number" min="0" step="0.1" value={roleWeights[role] ?? 1} onChange={(event) => setRoleWeights((values) => ({ ...values, [role]: Number(event.target.value) }))} disabled={!canEdit} /></FormField>)}</div></> : null}<div className="section-head"><h2>Points par position</h2></div><div className="result-editor">{positionPoints.map((points, index) => <div className="result-edit-row" style={{ gridTemplateColumns: "1fr 110px" }} key={index}><strong>{index + 1}<sup>e</sup> position</strong><input aria-label={`Points position ${index + 1}`} type="number" step="0.5" value={points} disabled={!canEdit} onChange={(event) => setPositionPoints((values) => values.map((value, valueIndex) => valueIndex === index ? Number(event.target.value) : value))} /></div>)}</div>{canEdit ? <div className="action-row"><button className="button" disabled={busy} onClick={() => void send("/api/admin/rules", { action: "saveDraft", ...payload })}><Save />Enregistrer le brouillon</button><button className="button primary" disabled={busy} onClick={() => void send("/api/admin/rules", { action: "publish", ...payload })}><ShieldCheck />Publier la version</button></div> : <div className="notice">Seul le propriétaire peut publier un barème.</div>}</div></article></div>;
}

function AccessPanel({ snapshot, admin, send, busy }: { snapshot: Snapshot; admin: AdminIdentity; send: (url: string, payload: unknown, method?: string) => Promise<boolean>; busy: boolean }) {
  if (admin.role !== "owner") return <div className="empty-state">La gestion des administrateurs est réservée au propriétaire.</div>;
  const pending = snapshot.accessRequests.filter((item) => item.status === "pending");
  return <div className="admin-grid"><article className="admin-panel"><div className="admin-panel-head"><h2>Demandes en attente</h2><span className="status-tag pending">{pending.length}</span></div><div className="admin-panel-body admin-list">{pending.length ? pending.map((item) => <div className="admin-list-row" key={String(item.id)}><div><strong>{String(item.display_name)}</strong><small>{String(item.email)}</small><div className="action-row"><button className="button small primary" disabled={busy} onClick={() => void send("/api/admin/access", { action: "approve", requestId: item.id }, "PATCH")}>Accepter</button><button className="button small danger-outline" disabled={busy} onClick={() => void send("/api/admin/access", { action: "deny", requestId: item.id }, "PATCH")}>Refuser</button></div></div></div>) : <div className="empty-state">Aucune demande en attente.</div>}</div></article>
  <article className="admin-panel"><div className="admin-panel-head"><h2>Administrateurs</h2><span>{snapshot.admins.length}</span></div><div className="admin-panel-body admin-list">{snapshot.admins.map((item) => <div className="admin-list-row" key={String(item.id)}><div><strong>{String(item.display_name)}</strong><small>{String(item.email)} · {String(item.role)}</small></div><div><span className={`status-tag ${String(item.status)}`}>{String(item.status)}</span>{item.role !== "owner" && item.status === "active" ? <div className="action-row"><button className="button small" disabled={busy} onClick={() => void send("/api/admin/access", { action: "suspend", adminId: item.id }, "PATCH")}>Suspendre</button><button className="button small danger-outline" disabled={busy} onClick={() => void send("/api/admin/access", { action: "revoke", adminId: item.id }, "PATCH")}>Révoquer</button></div> : null}{item.role !== "owner" && item.status === "suspended" ? <button className="button small primary" disabled={busy} onClick={() => void send("/api/admin/access", { action: "activate", adminId: item.id }, "PATCH")}>Réactiver</button> : null}</div></div>)}</div></article></div>;
}
