"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { SEASON_RACES } from "@/lib/season-data";
import { SeasonTimeline } from "./SeasonTimeline";

const subscribe = () => () => {};

/**
 * The championship calendar stays attached to every public control room.
 * Selecting a stage always opens that stage; it never mutates an unrelated
 * screen in place.
 */
export function PersistentSeasonTimeline({ selectedSlug }: { selectedSlug?: string | null }) {
  const router = useRouter();
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  const now = useMemo(() => {
    if (!isClient) return null;
    const current = new Date();
    current.setHours(12, 0, 0, 0);
    return current;
  }, [isClient]);
  const selectedId = useMemo(
    () => SEASON_RACES.find((race) => race.slug === selectedSlug)?.id ?? null,
    [selectedSlug],
  );

  if (!now) {
    return <section className="season-timeline season-timeline--loading" aria-label="Calendrier des étapes 2026" />;
  }

  return <SeasonTimeline
    races={SEASON_RACES}
    selectedId={selectedId}
    now={now}
    onSelect={(raceId) => {
      const race = SEASON_RACES.find((item) => item.id === raceId);
      if (race) router.push(`/courses/${race.slug}`);
    }}
  />;
}
