import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RaceExperience } from "@/components/race/RaceExperience";
import type { RaceView } from "@/lib/domain";
import { getRaceBySlug } from "@/lib/database";
import { seasonRaceBySlug } from "@/lib/season-data";
import { seasonRacePreview } from "@/lib/season-view";
import { getRaceWeatherSnapshot } from "@/lib/weather";

export const dynamic = "force-dynamic";

/**
 * Every race of the season is navigable: database-backed races carry their
 * validated leaderboard; the others render as previews (traced route, real
 * weather, no results yet) until officials publish data.
 */
async function resolveRace(slug: string): Promise<RaceView | null> {
  try {
    return await getRaceBySlug(slug);
  } catch {
    const seasonRace = seasonRaceBySlug(slug);
    return seasonRace ? seasonRacePreview(seasonRace) : null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const race = await resolveRace(slug);
  if (!race) return { title: "Course introuvable" };
  return { title: race.eventName === race.name ? race.name : `${race.eventName} · ${race.name}` };
}

export default async function RacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const race = await resolveRace(slug);
  if (!race) notFound();
  const weather = await getRaceWeatherSnapshot(race);
  return <RaceExperience race={race} weather={weather} context="course" />;
}
