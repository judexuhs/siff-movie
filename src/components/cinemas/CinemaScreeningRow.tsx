"use client";

import { useState } from "react";
import type { SiffFilm, SiffScreening } from "@/lib/types";
import { posterSrc, doubanHref, isExactDoubanMatch } from "@/lib/poster";
import { WatchlistToggle } from "@/components/watchlist/WatchlistToggle";
import {
  CalendarBlankIcon,
  FilmSlateIcon,
  CaretDownIcon,
  ArrowSquareOutIcon,
  StarIcon,
} from "@phosphor-icons/react";

export function CinemaScreeningRow({
  film,
  screening,
}: {
  film: SiffFilm;
  screening: SiffScreening;
}) {
  const [open, setOpen] = useState(false);
  const src = posterSrc(film);
  const href = doubanHref(film);
  const exact = isExactDoubanMatch(film);

  return (
    <li
      className={`overflow-hidden rounded-xl border transition ${
        open
          ? "border-siff/25 bg-siff/[0.06]"
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full gap-3 p-3 text-left"
        aria-expanded={open}
      >
        <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-night-800">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={film.nameCn}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <FilmSlateIcon className="h-5 w-5 text-cream/20" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-mono text-base font-semibold text-siff-bright">
                  {screening.startTime}
                </span>
                {screening.endTime ? (
                  <span className="text-xs text-cream/35">– {screening.endTime}</span>
                ) : null}
                <span className="text-[15px] font-medium text-cream">{film.nameCn}</span>
              </div>
              {film.nameEn ? (
                <p className="truncate text-xs text-cream/40">{film.nameEn}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <WatchlistToggle film={film} screening={screening} />
              <CaretDownIcon
                className={`mt-1 h-4 w-4 text-cream/40 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-cream/55">
            <span className="inline-flex items-center gap-1">
              <CalendarBlankIcon className="h-3.5 w-3.5 text-cream/35" />
              {screening.date}
              <span className="text-cream/40">{screening.weekday}</span>
            </span>
            {screening.hallName ? (
              <span className="text-cream/50">{screening.hallName}</span>
            ) : null}
            {film.group ? (
              <span className="rounded bg-siff/10 px-1.5 py-0.5 text-[10px] text-siff-bright">
                {film.group}
              </span>
            ) : null}
            {film.director ? (
              <span className="text-cream/45">导演 · {film.director}</span>
            ) : null}
            {screening.liveActivity ? (
              <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[10px] font-medium text-gold">
                见面会
              </span>
            ) : null}
          </div>

          {!open && film.synopsis ? (
            <p className="mt-2 line-clamp-1 text-xs text-cream/40">
              点击展开简介
            </p>
          ) : null}
        </div>
      </button>

      {open ? (
        <div className="animate-fade-up border-t border-white/[0.06] px-3 pb-3 pt-0 sm:pl-[4.75rem]">
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {film.country ? (
              <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-cream/60">
                {film.country}
              </span>
            ) : null}
            {film.lengthLabel ? (
              <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-cream/60">
                {film.lengthLabel}
              </span>
            ) : null}
            {film.douban?.rating ? (
              <span className="flex items-center gap-0.5 rounded-md bg-gold/15 px-2 py-0.5 text-gold">
                <StarIcon weight="fill" className="h-3 w-3" />
                {film.douban.rating.toFixed(1)}
              </span>
            ) : null}
          </div>

          {film.synopsis ? (
            <p className="mt-2.5 text-sm leading-relaxed text-cream/75">
              {film.synopsis}
            </p>
          ) : (
            <p className="mt-2.5 text-sm text-cream/40">暂无简介</p>
          )}

          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-xs font-medium text-cream/80 transition hover:bg-white/[0.12] hover:text-cream"
          >
            <ArrowSquareOutIcon className="h-3.5 w-3.5" />
            {exact ? "豆瓣详情" : "豆瓣搜索"}
          </a>
        </div>
      ) : null}
    </li>
  );
}
