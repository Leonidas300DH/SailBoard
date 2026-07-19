import Link from "next/link";
import { Settings } from "lucide-react";

export function ContentNav() {
  return <header className="content-nav">
    <Link className="brand" href="/"><span>SailBoard</span><span>Race</span></Link>
    <nav className="content-nav-links"><Link className="content-nav-link" href="/">Carte</Link><Link className="content-nav-link" href="/classements">Classements</Link><Link className="content-nav-link" href="/saisons/championnat-2026">Saison 2026</Link></nav>
    <Link className="button small" href="/settings"><Settings />Settings</Link>
  </header>;
}
