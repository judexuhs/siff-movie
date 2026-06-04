import type { SiffFilm } from "./types";
import { doubanSearchUrl } from "./doubanUrls";

/** SIFF posters need a referer + URL encoding, so route them through our proxy. */
export function posterSrc(film: Pick<SiffFilm, "posterUrl">): string | null {
  if (!film.posterUrl) return null;
  return `/api/poster?u=${encodeURIComponent(film.posterUrl)}`;
}

/**
 * Always returns a usable Douban link: the exact subject when we've resolved it,
 * otherwise a Douban search for the title.
 */
export function doubanHref(
  film: Pick<SiffFilm, "nameCn" | "nameEn" | "douban">
): string {
  if (film.douban?.url) return film.douban.url;
  return doubanSearchUrl(film);
}

export function isExactDoubanMatch(film: Pick<SiffFilm, "douban">): boolean {
  return Boolean(film.douban?.matched);
}
