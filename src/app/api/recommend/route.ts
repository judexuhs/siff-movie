import { recommendFilms, hasTasteSignal, type TasteInput } from "@/lib/recommend";
import { getSiffFilms, findFilmById } from "@/lib/siff";
import { fetchWatchHistory } from "@/lib/douban";
import { handleError, ok, fail } from "@/lib/http";
import type { DoubanProfile, SiffFilm } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface Body {
  /** Either pass a previously-fetched profile, or an input to (re)scrape. */
  profile?: DoubanProfile;
  input?: string;
  /** Manual taste signals (free text, newline/comma separated handled client-side). */
  liked?: string[];
  disliked?: string[];
  topN?: number;
}

function cleanList(list?: string[]): string[] {
  if (!Array.isArray(list)) return [];
  return list.map((s) => s.trim()).filter(Boolean).slice(0, 40);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    let profile = body.profile ?? null;
    if (!profile && body.input?.trim()) {
      profile = await fetchWatchHistory(body.input);
    }

    const taste: TasteInput = {
      profile,
      liked: cleanList(body.liked),
      disliked: cleanList(body.disliked),
    };

    if (!hasTasteSignal(taste)) {
      return fail(
        "请先读取豆瓣观影记录，或手动填写至少一部你喜欢的电影",
        400,
        "NO_TASTE"
      );
    }

    const films = await getSiffFilms();
    const result = await recommendFilms(taste, films, body.topN);

    // Enrich each recommendation with the full film (incl. screenings + douban) for the UI.
    const enriched = result.recommendations
      .map((rec) => {
        const film = findFilmById(films, rec.filmId);
        return film ? { ...rec, film } : null;
      })
      .filter((x): x is typeof x & { film: SiffFilm } => x !== null);

    return ok({
      tasteProfile: result.tasteProfile,
      provider: result.provider,
      model: result.model,
      profileSummary: profile
        ? {
            userId: profile.userId,
            displayName: profile.displayName,
            totalWatched: profile.totalWatched,
            analyzed: profile.movies.length,
          }
        : null,
      recommendations: enriched,
    });
  } catch (err) {
    return handleError(err);
  }
}
