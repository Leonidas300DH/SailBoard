"use client";

import { useState } from "react";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function SignInPanel({ configured, returnTo }: { configured: boolean; returnTo: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    setBusy(true);
    setError("");
    const result = await authClient.signIn.social({ provider: "google", callbackURL: returnTo });
    if (result.error) {
      setError(result.error.message || "La connexion Google a échoué.");
      setBusy(false);
    }
  }

  return <main className="access-gate"><div>
    <span className="brand"><span>SailBoard</span><span>Admin</span></span>
    <h1>Console de course</h1>
    <p>Connectez-vous avec votre compte Google. Un propriétaire devra ensuite accepter votre demande avant toute modification.</p>
    {configured ? <button className="button primary" type="button" onClick={() => void signIn()} disabled={busy}><LogIn />{busy ? "Connexion…" : "Continuer avec Google"}</button> : <div className="notice error">L’authentification n’est pas encore activée sur cet environnement.</div>}
    {error ? <div className="notice error">{error}</div> : null}
    <Link className="button small" href="/">Retour au site public</Link>
  </div></main>;
}
