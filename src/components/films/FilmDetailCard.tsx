import type { SiffFilm } from "@/lib/types";
import { sortScreenings } from "@/lib/schedule";
import { posterSrc, doubanHref, isExactDoubanMatch } from "@/lib/poster";
import { ScreeningList } from "@/components/ScreeningList";
import {
  StarIcon,
  ArrowSquareOutIcon,
  FilmSlateIcon,
} from "@phosphor-icons/react/dist/ssr";

/** Full film info on one card — no modal required. */
export function FilmDetailCard({ film }: { film: SiffFilm }) {
  const src = posterSrc(film);
  const href = doubanHref(film);
  const exact = isExactDoubanMatch(film);
  const screenings = sortScreenings(film.screenings);

  return (
    <article
      id={`film-${film.filmId}`}
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-night-800/60 to-night-900/80 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]"
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
        <div className="relative mx-auto h-56 w-40 shrink-0 overflow-hidden rounded-xl bg-night-800 sm:mx-0 sm:h-64 sm:w-44">
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
              <FilmSlateIcon className="h-10 w-10 text-cream/20" />
            </div>
          )}
          {film.douban?.rating ? (
            <span className="absolute bottom-2 left-2 flex items-center gap-0.5 rounded-md bg-black/75 px-2 py-0.5 text-xs font-semibold text-gold backdrop-blur">
              <StarIcon weight="fill" className="h-3.5 w-3.5" />
              {film.douban.rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold leading-tight text-cream sm:text-2xl">
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
            {film.color ? (
              <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-cream/60">
                {film.color}
              </span>
            ) : null}
          </div>

          {film.director ? (
            <p className="mt-2.5 text-sm text-cream/55">导演 · {film.director}</p>
          ) : null}

          {film.synopsis ? (
            <p className="mt-3 text-sm leading-relaxed text-cream/70">
              {film.synopsis}
            </p>
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

      <div className="border-t border-white/[0.06] bg-black/20 px-4 py-3 sm:px-5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-cream/40">
          全部排片 · {screenings.length} 场
        </p>
        <ScreeningList screenings={screenings} film={film} />
      </div>
    </article>
  );
}
