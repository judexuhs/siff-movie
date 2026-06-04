"use client";

import { useMemo, useState } from "react";
import type { SiffFilm } from "@/lib/types";
import { FilmGridCard } from "./FilmGridCard";
import { FilmModal } from "./FilmModal";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";

const ALL = "__all__";

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "zh")
  );
}

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

export function FilmBrowser({ films }: { films: SiffFilm[] }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState(ALL);
  const [country, setCountry] = useState(ALL);
  const [selected, setSelected] = useState<SiffFilm | null>(null);

  const groups = useMemo(() => uniqueSorted(films.map((f) => f.group)), [films]);
  const countries = useMemo(
    () => uniqueSorted(films.flatMap((f) => f.country.split(/[\/、,，]/).map((c) => c.trim()))),
    [films]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return films.filter((f) => {
      if (group !== ALL && f.group !== group) return false;
      if (country !== ALL && !f.country.includes(country)) return false;
      if (q) {
        const hay = `${f.nameCn} ${f.nameEn} ${f.director}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [films, query, group, country]);

  const selectClass =
    "rounded-xl border border-white/[0.1] bg-night-900 px-3 py-2.5 text-sm text-cream outline-none transition focus:border-siff focus:ring-2 focus:ring-siff/25";

  return (
    <div>
      {/* Filter bar */}
      <div className="sticky top-16 z-40 -mx-5 mb-6 border-b border-white/[0.06] bg-night-950/85 px-5 py-3 backdrop-blur-xl sm:-mx-8 sm:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/35" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索片名、导演…"
              className="w-full rounded-xl border border-white/[0.1] bg-night-900 py-2.5 pl-9 pr-4 text-sm text-cream outline-none transition placeholder:text-cream/30 focus:border-siff focus:ring-2 focus:ring-siff/25"
            />
          </div>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={selectClass}
          >
            <option value={ALL}>全部地区</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Unit chips */}
        <div className="scroll-thin mt-2.5 flex flex-wrap gap-1.5">
          <FilterChip
            label="全部"
            active={group === ALL}
            onClick={() => setGroup(ALL)}
          />
          {groups.map((g) => (
            <FilterChip
              key={g}
              label={g}
              active={group === g}
              onClick={() => setGroup(g)}
            />
          ))}
        </div>

        <p className="mt-2.5 text-xs text-cream/40">
          共 {filtered.length} 部影片
          {(group !== ALL || country !== ALL || query) &&
          films.length !== filtered.length
            ? ` / ${films.length}`
            : ""}
        </p>
      </div>

      {filtered.length ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((film) => (
            <FilmGridCard key={film.filmId} film={film} onOpen={setSelected} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center text-cream/45">
          <p>没有符合条件的影片</p>
          <button
            onClick={() => {
              setQuery("");
              setGroup(ALL);
              setCountry(ALL);
            }}
            className="mt-3 rounded-lg bg-white/[0.06] px-4 py-2 text-sm text-cream/80 transition hover:bg-white/[0.12]"
          >
            清除筛选
          </button>
        </div>
      )}

      <FilmModal film={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
