"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { SEASON_RACES } from "@/lib/season-data";
import { stagePodiums } from "@/lib/wdt-profiles";
import { RaceHud } from "./RaceHud";
import { SeasonTimeline } from "./SeasonTimeline";

const subscribe = () => () => {};
const STAGE_PODIUMS = stagePodiums();

/**
 * The championship calendar stays attached to every public control room.
 * Selecting a stage opens its compact HUD over the current control room;
 * navigation to the complete race page remains an explicit action in the HUD.
 */
export function PersistentSeasonTimeline({ selectedSlug }: { selectedSlug?: string | null }) {
  const [openedRaceId, setOpenedRaceId] = useState<string | null>(null);
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  const now = useMemo(() => {
    if (!isClient) return null;
    const current = new Date();
    current.setHours(12, 0, 0, 0);
    return current;
  }, [isClient]);
  const routeSelectedId = useMemo(
    () => SEASON_RACES.find((race) => race.slug === selectedSlug)?.id ?? null,
    [selectedSlug],
  );
  const openedRace = useMemo(
    () => SEASON_RACES.find((race) => race.id === openedRaceId) ?? null,
    [openedRaceId],
  );

  if (!now) {
    return <section className="season-timeline season-timeline--loading" aria-label="Calendrier des étapes 2026" />;
  }

  return <>
    {openedRace ? <RaceHud
      key={openedRace.id}
      race={openedRace}
      index={SEASON_RACES.indexOf(openedRace)}
      podium={STAGE_PODIUMS[openedRace.id] ?? []}
      weather={undefined}
      isToday={new Date(`${openedRace.date}T00:00:00`).toDateString() === now.toDateString()}
      variant="persistent"
      onClose={() => setOpenedRaceId(null)}
    /> : null}
    <SeasonTimeline
      races={SEASON_RACES}
      selectedId={openedRaceId ?? routeSelectedId}
      now={now}
      onSelect={setOpenedRaceId}
    />
  </>;
}
