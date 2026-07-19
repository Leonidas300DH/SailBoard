import { Map, Sailboat, Settings, Trophy, Users, type LucideIcon } from "lucide-react";

export type PublicSection = "season" | "course" | "rankings" | "sailors" | "settings";

export type NavChild = {
  id: PublicSection;
  href: string;
  label: string;
  icon: LucideIcon;
};

export type NavItem = {
  id: PublicSection;
  href: string;
  label: string;
  icon: LucideIcon;
  /** Sub-entries rendered under a section title instead of a plain link. */
  children?: NavChild[];
};

// Les étapes sont accessibles depuis la saison (timeline et roadbook) ; le
// classement général forme une section avec ses deux vues en sous-entrées.
export function publicNav(): NavItem[] {
  return [
    { id: "season", href: "/", label: "Saison", icon: Map },
    {
      id: "rankings",
      href: "/classements",
      label: "Classement Général",
      icon: Trophy,
      children: [
        { id: "rankings", href: "/classements", label: "Équipages", icon: Sailboat },
        { id: "sailors", href: "/classements?vue=individuel", label: "Navigateurs", icon: Users },
      ],
    },
    { id: "settings", href: "/settings", label: "Settings", icon: Settings },
  ];
}
