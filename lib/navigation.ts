import { Flag, ListOrdered, Map, Settings, Users, type LucideIcon } from "lucide-react";

export type PublicSection = "season" | "course" | "rankings" | "sailors" | "admin";

export type NavItem = {
  id: PublicSection;
  href: string;
  label: string;
  icon: LucideIcon;
};

export function publicNav(raceSlug: string): NavItem[] {
  return [
    { id: "season", href: "/", label: "Saison", icon: Map },
    { id: "course", href: `/courses/${raceSlug}`, label: "Courses", icon: Flag },
    { id: "rankings", href: "/classements", label: "Classements", icon: ListOrdered },
    { id: "sailors", href: "/classements?vue=individuel", label: "Marins", icon: Users },
    { id: "admin", href: "/admin", label: "Admin", icon: Settings },
  ];
}
