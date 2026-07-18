"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { CalendarDays, ChevronRight, Trophy, Waves, Wind } from "lucide-react";
import type { SeasonRace } from "@/lib/season-data";
import type { RaceWeatherSnapshot } from "@/lib/weather";

export type TimelineLeader = { id: string; name: string; slug: string; points: number; color: string };

type RaceTiming = "past" | "today" | "future";

const MONTH_TICKS = [
  { label: "AVR.", month: 3 },
  { label: "MAI", month: 4 },
  { label: "JUIN", month: 5 },
  { label: "JUIL.", month: 6 },
  { label: "AOÛT", month: 7 },
  { label: "SEPT.", month: 8 },
  { label: "OCT.", month: 9 },
];

function timingOf(raceDate: string, now: Date): RaceTiming {
  const date = new Date(`${raceDate}T00:00:00`);
  if (date.toDateString() === now.toDateString()) return "today";
  return date < now ? "past" : "future";
}

/**
 * Season calendar as a time-proportional rail: node position encodes the real
 * date, a cursor marks today, selection drives the tactical map. On mobile the
 * same nodes become a scroll-snapped horizontal rail.
 */
export function SeasonTimeline({
  races,
  selectedId,
  now,
  leaders,
  weatherByRace = {},
  onSelect,
}: {
  races: SeasonRace[];
  selectedId: string;
  now: Date;
  leaders: TimelineLeader[];
  weatherByRace?: Record<string, RaceWeatherSnapshot | null>;
  onSelect: (raceId: string) => void;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>());
  const keyboardDriven = useRef(false);
  const hasCentered = useRef(false);

  const span = useMemo(() => {
    const dates = races.map((race) => new Date(`${race.date}T00:00:00`).getTime());
    const min = Math.min(...dates);
    const max = Math.max(...dates);
    const pad = (max - min) * 0.06;
    return { start: min - pad, end: max + pad };
  }, [races]);

  const position = (time: number) => ((time - span.start) / (span.end - span.start)) * 100;
  const todayPct = position(now.getTime());
  const selectedIndex = races.findIndex((race) => race.id === selectedId);

  useEffect(() => {
    const node = nodeRefs.current.get(selectedId);
    const rail = railRef.current;
    if (!node || !rail) return;
    if (rail.scrollWidth > rail.clientWidth + 8) {
      node.scrollIntoView({ behavior: hasCentered.current ? "smooth" : "auto", inline: "center", block: "nearest" });
    }
    hasCentered.current = true;
    if (keyboardDriven.current) {
      keyboardDriven.current = false;
      node.focus();
    }
  }, [selectedId]);

  const selectOffset = (offset: number) => {
    const next = (selectedIndex + offset + races.length) % races.length;
    keyboardDriven.current = true;
    onSelect(races[next].id);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      selectOffset(1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      selectOffset(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      keyboardDriven.current = true;
      onSelect(races[0].id);
    } else if (event.key === "End") {
      event.preventDefault();
      keyboardDriven.current = true;
      onSelect(races[races.length - 1].id);
    }
  };

  return <section className="season-timeline" aria-label="Calendrier des courses 2026">
    <header className="timeline-head">
      <div className="timeline-title">
        <CalendarDays aria-hidden />
        <div>
          <span>Calendrier 2026</span>
          <strong>{String(selectedIndex + 1).padStart(2, "0")} / {String(races.length).padStart(2, "0")} · {races[selectedIndex]?.shortName}</strong>
        </div>
      </div>
      <div className="timeline-championship" aria-label="Tête du championnat">
        <span className="timeline-championship-label"><Trophy aria-hidden /> Championnat</span>
        {leaders.slice(0, 3).map((leader, index) => (
          <Link
            key={leader.id}
            href={`/bateaux/${leader.slug}`}
            className="timeline-champ-chip"
            style={{ "--competitor-color": leader.color } as React.CSSProperties}
          >
            <b className="mono">{index + 1}</b>
            <strong>{leader.name}</strong>
            <small className="mono">{leader.points.toFixed(1)}</small>
          </Link>
        ))}
        <Link href="/classements" className="timeline-champ-all">Classement <ChevronRight aria-hidden /></Link>
      </div>
    </header>

    <div className="timeline-rail" ref={railRef} onKeyDown={handleKeyDown}>
      <div className="timeline-canvas">
        <div className="timeline-axis" aria-hidden>
          {MONTH_TICKS.map(({ label, month }) => {
            const tick = new Date(2026, month, 1).getTime();
            return <span key={label} style={{ "--pos": `${position(tick)}%` } as React.CSSProperties}>{label}</span>;
          })}
        </div>
        <div className="timeline-line" aria-hidden />
        <div className="timeline-today" style={{ "--pos": `${todayPct}%` } as React.CSSProperties} aria-hidden>
          <i />
          <span>Aujourd’hui</span>
        </div>
        {races.map((race, index) => {
          const timing = timingOf(race.date, now);
          const isSelected = race.id === selectedId;
          const raceTime = new Date(`${race.date}T00:00:00`).getTime();
          return <button
            type="button"
            key={race.id}
            ref={(node) => {
              if (node) nodeRefs.current.set(race.id, node);
              else nodeRefs.current.delete(race.id);
            }}
            className={`timeline-node ${timing}${isSelected ? " selected" : ""}`}
            style={{ "--pos": `${position(raceTime)}%` } as React.CSSProperties}
            aria-label={`${race.name}, ${race.dateLabel} 2026, ${race.locationName}`}
            aria-pressed={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect(race.id)}
          >
            <span className="timeline-node-marker mono"><i />{index + 1}</span>
            <span className="timeline-node-copy">
              <small>{race.dateLabel} · {race.locationName}</small>
              <strong>{race.shortName}</strong>
              <em>{race.winner ? `${race.winner} · ${race.result}` : race.result}</em>
              {(() => {
                const snapshot = weatherByRace[race.id];
                if (!snapshot || timing === "future") return null;
                return <span className="timeline-node-weather mono">
                  <Wind aria-hidden />{snapshot.windKnots.toFixed(0)} ND
                  <Waves aria-hidden />{snapshot.waveHeight.toFixed(1)} M
                </span>;
              })()}
            </span>
          </button>;
        })}
      </div>
    </div>
  </section>;
}
