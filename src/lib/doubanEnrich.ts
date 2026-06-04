import type { DoubanLink, SiffFilm } from "./types";
import { proxyFetch } from "./proxyFetch";

/**
 * Resolves SIFF films to their Douban subjects using Douban's lightweight
 * `subject_suggest` JSON endpoint (no HTML scraping, low block risk).
 *
 * Results are cached on disk (see scripts/enrich-douban.mjs) and merged into the
 * SIFF film list at read time. Films without a confident match fall back to a
 * Douban search link in the UI, so every film always has a usable link.
 */

interface SuggestItem {
  id: string;
  title: string;
  sub_title?: string;
  year?: string;
  img?: string;
  url?: string;
  type?: string;
}

/** Normalize a title for fuzzy comparison (strip 4K/格式/标点/空白). */
export function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(?\b(4k|2k|imax|3d|修复版|数字修复|未删减版|导演剪辑版|restored)\b\)?/gi, "")
    .replace(/[\s·:：,，.。!！?？'"“”‘’\-—()（）\/]/g, "")
    .trim();
}

const SUGGEST_URL = "https://movie.douban.com/j/subject_suggest";

export async function suggestDoubanSubject(
  film: Pick<SiffFilm, "nameCn" | "nameEn">
): Promise<DoubanLink | null> {
  const query = film.nameCn || film.nameEn;
  if (!query) return null;

  const url = `${SUGGEST_URL}?q=${encodeURIComponent(query)}`;
  const res = await proxyFetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      Referer: "https://movie.douban.com/",
      "Accept-Language": "zh-CN,zh;q=0.9",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;

  let items: SuggestItem[];
  try {
    items = (await res.json()) as SuggestItem[];
  } catch {
    return null;
  }
  const movies = items.filter((i) => i.type === "movie" && i.id);
  if (!movies.length) return null;

  const targetCn = normalizeTitle(film.nameCn);
  const targetEn = normalizeTitle(film.nameEn);

  // Prefer an exact normalized title match; otherwise take the top suggestion.
  const exact = movies.find((m) => {
    const t = normalizeTitle(m.title);
    const st = normalizeTitle(m.sub_title || "");
    return (
      (targetCn && (t === targetCn || st === targetCn)) ||
      (targetEn && (t === targetEn || st === targetEn))
    );
  });

  const best = exact || movies[0];
  return {
    subjectId: best.id,
    url: `https://movie.douban.com/subject/${best.id}/`,
    year: best.year || "",
    poster: (best.img || "").replace(/\\\//g, "/"),
    rating: null,
    matched: Boolean(exact),
  };
}

/** Deterministic Douban search URL, used as a fallback when no subject matched. */
export function doubanSearchUrl(film: Pick<SiffFilm, "nameCn" | "nameEn">): string {
  const q = film.nameCn || film.nameEn || "";
  return `https://search.douban.com/movie/subject_search?search_text=${encodeURIComponent(
    q
  )}`;
}
