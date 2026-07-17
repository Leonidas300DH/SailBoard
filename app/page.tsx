import { RaceExperience } from "@/components/RaceExperience";
import { getRaceBySlug } from "@/lib/database";

export const dynamic = "force-dynamic";

export default async function Home() {
  const race = await getRaceBySlug();
  return <RaceExperience race={race} />;
}
