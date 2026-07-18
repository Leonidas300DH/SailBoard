import type { Metadata } from "next";
import { RaceExperience } from "@/components/race/RaceExperience";
import { getRaceBySlug } from "@/lib/database";
import { getRaceWeatherSnapshot } from "@/lib/weather";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const race = await getRaceBySlug(slug);
  return { title: `${race.eventName} · ${race.name}` };
}

export default async function RacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const race = await getRaceBySlug(slug);
  const weather = await getRaceWeatherSnapshot(race);
  return <RaceExperience race={race} weather={weather} context="course" />;
}
