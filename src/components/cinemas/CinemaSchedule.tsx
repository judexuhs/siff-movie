"use client";

import { useMemo, useState } from "react";
import type { CinemaSchedule } from "@/lib/schedule";
import { screeningSortKey } from "@/lib/schedule";
import { CollapsibleFilterBar } from "@/components/CollapsibleFilterBar";
import { CinemaScreeningRow } from "./CinemaScreeningRow";
import { MagnifyingGlassIcon, MapPinIcon } from "@phosphor-icons/react";

const ALL = "__all__";

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-[0.97] ${
        active
          ? "bg-siff text-white shadow-sm shadow-siff/30"
          : "border border-white/[0.1] bg-white/[0.03] text-cream/60 hover:border-white/20 hover:text-cream"
      }`}
    >
      {label}
    </button>
  );
}

export function CinemaScheduleView({ schedules }: { schedules: CinemaSchedule[] }) {
  const [query, setQuery] = useState("");
  const [cinema, setCinema] = useState(ALL);

  const cinemaNames = useMemo(
    () => schedules.map((s) => s.cinema).sort((a, b) => a.localeCompare(b, "zh")),
    [schedules]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return schedules.filter((s) => {
      if (cinema !== ALL && s.cinema !== cinema) return false;
      if (!q) return true;
      if (s.cinema.toLowerCase().includes(q)) return true;
      return s.items.some(
        ({ film, screening }) =>
          `${film.nameCn} ${film.nameEn} ${film.director} ${film.synopsis} ${screening.hallName}`
            .toLowerCase()
            .includes(q)
      );
    });
  }, [schedules, cinema, query]);

  const totalScreenings = visible.reduce((n, s) => n + s.items.length, 0);

  return (
    <div>
      <CollapsibleFilterBar
        topRow={
          <div className="relative min-w-0 flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/35" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索影院、片名、影厅…"
              className="w-full rounded-xl border border-white/[0.1] bg-night-900 py-2.5 pl-9 pr-4 text-sm text-cream outline-none transition placeholder:text-cream/30 focus:border-siff focus:ring-2 focus:ring-siff/25"
            />
          </div>
        }
        filters={
          <div className="scroll-thin flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
            <FilterChip label="全部影院" active={cinema === ALL} onClick={() => setCinema(ALL)} />
            {cinemaNames.map((name) => (
              <FilterChip
                key={name}
                label={name}
                active={cinema === name}
                onClick={() => setCinema(name)}
              />
            ))}
          </div>
        }
        summary={
          <p className="text-xs text-cream/40">
            {visible.length} 家影院 · {totalScreenings} 场放映 · 点击场次可展开简介
          </p>
        }
      />

      <div className="space-y-8">
        {visible.map((block) => (
          <section
            key={block.cinema}
            id={`cinema-${encodeURIComponent(block.cinema)}`}
            className="scroll-mt-24"
          >
            <div className="mb-3 border-b border-white/[0.08] pb-3">
              <h2 className="text-lg font-semibold text-cream">{block.cinema}</h2>
              {block.address ? (
                <p className="mt-1 flex items-start gap-1.5 text-xs text-cream/50">
                  <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {block.address}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-cream/40">{block.items.length} 场 · 按时间排序</p>
            </div>

            <ul className="space-y-2">
              {block.items.map(({ film, screening }) => {
                const key =
                  screening.id || `${film.filmId}-${screeningSortKey(screening)}`;
                return (
                  <CinemaScreeningRow key={key} film={film} screening={screening} />
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {!visible.length ? (
        <div className="py-24 text-center text-cream/45">
          <p>没有符合条件的影院或场次</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCinema(ALL);
            }}
            className="mt-3 rounded-lg bg-white/[0.06] px-4 py-2 text-sm text-cream/80 transition hover:bg-white/[0.12]"
          >
            清除筛选
          </button>
        </div>
      ) : null}
    </div>
  );
}
