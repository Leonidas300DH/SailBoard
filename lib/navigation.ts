import { Map, Sailboat, Settings, Users, type LucideIcon } from "lucide-react";

export type PublicSection = "season" | "course" | "rankings" | "sailors" | "admin";

export type NavItem = {
  id: PublicSection;
  href: string;
  label: string;
  icon: LucideIcon;
};

// "Courses" has no nav entry: the season IS the entry point and each race is
// reached from it (timeline, dossier, roadbook) or from the standings.
export function publicNav(): NavItem[] {
  return [
    { id: "season", href: "/", label: "Saison", icon: Map },
    { id: "rankings", href: "/classements", label: "Bateaux", icon: Sailboat },
    { id: "sailors", href: "/classements?vue=individuel", label: "Marins", icon: Users },
    { id: "admin", href: "/admin", label: "Admin", icon: Settings },
  ];
}
