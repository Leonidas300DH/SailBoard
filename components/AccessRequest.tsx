"use client";

import { useState } from "react";
import type { ChatGPTUser } from "@/app/chatgpt-auth";

export function AccessRequest({ user }: { user: ChatGPTUser }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  async function submit() {
    setState("sending");
    const response = await fetch("/api/admin/access", { method: "POST" });
    setState(response.ok ? "sent" : "error");
  }
  return <section className="access-gate"><div><span className="brand"><span>SailBoard</span><span>Admin</span></span><h1>Accès administrateur requis</h1><p>Vous êtes connecté en tant que <strong>{user.email}</strong>, mais ce compte n’est pas encore autorisé à modifier SailBoard.</p>{state === "sent" ? <div className="notice success">Demande envoyée. Un propriétaire doit maintenant l’accepter.</div> : <button className="button primary" onClick={submit} disabled={state === "sending"}>{state === "sending" ? "Envoi…" : "Demander l’accès"}</button>}{state === "error" ? <div className="notice error">La demande n’a pas pu être enregistrée.</div> : null}</div></section>;
}
