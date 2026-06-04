import type { SiffFilm } from "@/lib/types";
import { posterSrc } from "@/lib/poster";

/**
 * Decorative poster strip that sets the festival mood and hints at the breadth
 * of the program. Pure CSS marquee, paused under prefers-reduced-motion.
 */
export function PosterMarquee({ films }: { films: SiffFilm[] }) {
  const posters = films
    .filter((f) => f.posterUrl)
    .slice(0, 22)
    .map((f) => ({ id: f.filmId, name: f.nameCn, src: posterSrc(f)! }));
  if (posters.length < 8) return null;

  const loop = [...posters, ...posters];

  return (
    <div
      className="relative w-full overflow-hidden py-2"
      aria-hidden
      style={{
        maskImage:
          "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
      }}
    >
      <div className="marquee flex w-max gap-3">
        {loop.map((p, i) => (
          <div
            key={`${p.id}-${i}`}
            className="h-40 w-[6.7rem] shrink-0 overflow-hidden rounded-lg border border-white/[0.06] bg-night-800"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.src}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover opacity-70"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
