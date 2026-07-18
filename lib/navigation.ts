import { Map, Sailboat, Settings, Users, type LucideIcon } from "lucide-react";

export type PublicSection = "season" | "course" | "rankings" | "sailors" | "admin";

export type NavItem = {
  id: PublicSection;
  href: string;
  label: string;
  icon: LucideIcon;
};

// Les étapes sont accessibles depuis la saison (timeline et roadbook) ou les classements.
export function publicNav(): NavItem[] {
  return [
    { id: "season", href: "/", label: "Saison", icon: Map },
    { id: "rankings", href: "/classements", label: "Équipages", icon: Sailboat },
    { id: "sailors", href: "/classements?vue=individuel", label: "Navigateurs", icon: Users },
    { id: "admin", href: "/admin", label: "Admin", icon: Settings },
  ];
}
