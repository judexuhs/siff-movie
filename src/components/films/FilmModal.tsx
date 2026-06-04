"use client";

import { useEffect } from "react";
import type { SiffFilm } from "@/lib/types";
import { posterSrc, doubanHref, isExactDoubanMatch } from "@/lib/poster";
import { ScreeningList } from "@/components/ScreeningList";
import {
  XIcon,
  StarIcon,
  ArrowSquareOutIcon,
  FilmSlateIcon,
} from "@phosphor-icons/react";

export function FilmModal({
  film,
  onClose,
}: {
  film: SiffFilm | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!film) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [film, onClose]);

  if (!film) return null;
  const src = posterSrc(film);
  const href = doubanHref(film);
  const exact = isExactDoubanMatch(film);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="scroll-thin max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-white/[0.1] bg-night-850 animate-scale-in sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-cream/80 backdrop-blur transition hover:bg-black/70 hover:text-cream"
            aria-label="关闭"
          >
            <XIcon className="h-4 w-4" />
          </button>

          <div className="flex gap-4 p-5">
            <div className="relative h-52 w-36 shrink-0 overflow-hidden rounded-xl bg-night-800">
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={film.nameCn} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <FilmSlateIcon className="h-8 w-8 text-cream/20" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold leading-tight text-cream">
                {film.nameCn}
              </h2>
              {film.nameEn ? (
                <p className="mt-1 text-sm text-cream/45">{film.nameEn}</p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                {film.group ? (
                  <span className="rounded-md border border-siff/30 bg-siff/10 px-2 py-0.5 text-siff-bright">
                    {film.group}
                  </span>
                ) : null}
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

              {film.director ? (
                <p className="mt-2.5 text-sm text-cream/55">导演 · {film.director}</p>
              ) : null}

              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-cream/80 transition hover:bg-white/[0.12] hover:text-cream"
              >
                <ArrowSquareOutIcon className="h-3.5 w-3.5" />
                {exact ? "豆瓣详情" : "豆瓣搜索"}
              </a>
            </div>
          </div>
        </div>

        {film.synopsis ? (
          <div className="px-5 pb-2">
            <p className="text-sm leading-relaxed text-cream/70">{film.synopsis}</p>
          </div>
        ) : null}

        <div className="border-t border-white/[0.06] p-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-cream/40">
            全部排片 · {film.screenings.length}
          </p>
          <ScreeningList screenings={film.screenings} film={film} />
        </div>
      </div>
    </div>
  );
}
