"use client";

import type { SiffFilm } from "@/lib/types";
import { posterSrc } from "@/lib/poster";
import { StarIcon, FilmSlateIcon } from "@phosphor-icons/react";

export function FilmGridCard({
  film,
  onOpen,
}: {
  film: SiffFilm;
  onOpen: (film: SiffFilm) => void;
}) {
  const src = posterSrc(film);
  return (
    <button
      onClick={() => onOpen(film)}
      className="group flex flex-col text-left"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-white/[0.07] bg-night-800">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={film.nameCn}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FilmSlateIcon className="h-8 w-8 text-cream/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
        {film.douban?.rating ? (
          <span className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-gold backdrop-blur">
            <StarIcon weight="fill" className="h-3 w-3" />
            {film.douban.rating.toFixed(1)}
          </span>
        ) : null}
        <span className="absolute right-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-cream/80 backdrop-blur">
          {film.screenings.length} 场
        </span>
      </div>
      <p className="mt-2 line-clamp-1 text-sm font-medium text-cream">
        {film.nameCn}
      </p>
      <p className="line-clamp-1 text-xs text-cream/40">
        {film.country}
        {film.group ? ` · ${film.group}` : ""}
      </p>
    </button>
  );
}
