"use client";

import { useState } from "react";
import type { SiffFilm, SiffScreening } from "@/lib/types";
import { WatchlistToggle } from "@/components/watchlist/WatchlistToggle";
import {
  CalendarBlankIcon,
  MapPinIcon,
  CaretDownIcon,
} from "@phosphor-icons/react";

export function ScreeningList({
  screenings,
  max,
  film,
}: {
  screenings: SiffScreening[];
  /** Initial number of screenings to show. Omit to show all. */
  max?: number;
  /** When set, each row gets a local watchlist toggle (per screening). */
  film?: SiffFilm;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!screenings.length) {
    return <p className="text-sm text-cream/40">暂无排片信息</p>;
  }

  const collapsible = typeof max === "number" && screenings.length > max;
  const shown = collapsible && !expanded ? screenings.slice(0, max) : screenings;
  const hidden = screenings.length - shown.length;

  return (
    <div>
      <div className="scroll-thin max-h-72 space-y-1 overflow-y-auto pr-1">
        {shown.map((s) => (
          <div
            key={s.id || `${s.date}-${s.startTime}-${s.cinema}`}
            className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-xs"
          >
            <CalendarBlankIcon className="h-3.5 w-3.5 shrink-0 text-cream/35" />
            <span className="shrink-0 font-medium text-cream">
              {s.date}
              <span className="ml-1 text-cream/40">{s.weekday}</span>
            </span>
            <span className="shrink-0 font-mono text-siff-bright">
              {s.startTime}
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-1 text-cream/55">
              <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-cream/30" />
              <span className="truncate">{s.cinema}</span>
            </span>
            {s.liveActivity ? (
              <span className="shrink-0 rounded bg-gold/15 px-1.5 py-0.5 text-[10px] font-medium text-gold">
                见面会
              </span>
            ) : null}
            {film ? <WatchlistToggle film={film} screening={s} /> : null}
          </div>
        ))}
      </div>

      {collapsible ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-cream/55 transition hover:bg-white/[0.05] hover:text-cream/80"
        >
          {expanded ? "收起场次" : `展开全部 ${screenings.length} 场`}
          <CaretDownIcon
            className={`h-3 w-3 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
          {!expanded ? (
            <span className="text-cream/35">（还有 {hidden} 场）</span>
          ) : null}
        </button>
      ) : null}
    </div>
  );
}
