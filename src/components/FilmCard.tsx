import type { Recommendation, SiffFilm } from "@/lib/types";
import { ScreeningList } from "./ScreeningList";
import { posterSrc, doubanHref, isExactDoubanMatch } from "@/lib/poster";
import {
  StarIcon,
  ArrowSquareOutIcon,
  FilmSlateIcon,
} from "@phosphor-icons/react/dist/ssr";

export type RecommendedFilm = Recommendation & { film: SiffFilm };

function MatchRing({ score }: { score: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  return (
    <div className="relative h-12 w-12 shrink-0">
      <svg viewBox="0 0 44 44" className="h-12 w-12 -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="3" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="#e2362b"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-cream">
        {score}
      </div>
    </div>
  );
}

export function FilmCard({ rec, rank }: { rec: RecommendedFilm; rank: number }) {
  const { film } = rec;
  const src = posterSrc(film);
  const href = doubanHref(film);
  const exact = isExactDoubanMatch(film);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-night-800/70 to-night-900/80 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_24px_48px_-24px_rgba(0,0,0,0.7)] ring-1 ring-white/[0.02] transition duration-300 hover:border-white/[0.14] hover:from-night-750/70 animate-fade-up">
      <div className="flex gap-4 p-4">
        <div className="relative h-44 w-[7.5rem] shrink-0 overflow-hidden rounded-xl bg-night-800">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={film.nameCn}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <FilmSlateIcon className="h-8 w-8 text-cream/20" />
            </div>
          )}
          <span className="absolute left-0 top-0 rounded-br-xl bg-siff px-2 py-0.5 text-xs font-bold text-white">
            {rank}
          </span>
          {film.douban?.rating ? (
            <span className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-gold backdrop-blur">
              <StarIcon weight="fill" className="h-3 w-3" />
              {film.douban.rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[17px] font-semibold leading-tight text-cream">
                {film.nameCn}
              </h3>
              {film.nameEn ? (
                <p className="mt-0.5 truncate text-xs text-cream/40">{film.nameEn}</p>
              ) : null}
            </div>
            <MatchRing score={rec.score} />
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
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
          </div>

          {film.director ? (
            <p className="mt-2 text-xs text-cream/50">导演 · {film.director}</p>
          ) : null}

          <div className="mt-2.5 rounded-xl border-l-2 border-siff/60 bg-white/[0.03] px-3 py-2">
            <p className="text-[13px] leading-relaxed text-cream/80">{rec.reason}</p>
            {rec.basedOn.length ? (
              <p className="mt-1 text-[11px] text-cream/40">
                因为你喜欢 {rec.basedOn.join(" / ")}
              </p>
            ) : null}
          </div>

          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 inline-flex w-fit items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-xs font-medium text-cream/80 transition hover:bg-white/[0.12] hover:text-cream"
          >
            <ArrowSquareOutIcon className="h-3.5 w-3.5" />
            {exact ? "豆瓣详情" : "豆瓣搜索"}
          </a>
        </div>
      </div>

      <div className="border-t border-white/[0.06] bg-black/20 px-4 py-3">
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-cream/40">
          排片场次 · {film.screenings.length}
        </p>
        <ScreeningList screenings={film.screenings} max={4} film={film} />
      </div>
    </article>
  );
}
