import type { SiffFilm } from "./types";

/** Deterministic Douban search URL (safe for client components). */
export function doubanSearchUrl(film: Pick<SiffFilm, "nameCn" | "nameEn">): string {
  const q = film.nameCn || film.nameEn || "";
  return `https://search.douban.com/movie/subject_search?search_text=${encodeURIComponent(
    q
  )}`;
}
