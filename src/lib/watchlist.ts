import type { SiffFilm, SiffScreening } from "./types";

/** One saved screening (场次粒度), with a snapshot for offline display. */
export interface WatchlistEntry {
  screeningKey: string;
  filmId: string;
  addedAt: number;
  filmNameCn: string;
  filmNameEn: string;
  director: string;
  group: string;
  country: string;
  lengthLabel: string;
  posterUrl: string;
  screening: SiffScreening;
}

export const WATCHLIST_STORAGE_KEY = "siff-watchlist-v1";

/** Stable id for a screening — prefers SIFF record id, else composite key. */
export function screeningKey(filmId: string, screening: SiffScreening): string {
  const id = screening.id?.trim();
  if (id) return id;
  return [filmId, screening.date, screening.startTime, screening.cinema]
    .map((s) => s.trim())
    .join("|");
}

export function entryFromFilm(
  film: SiffFilm,
  screening: SiffScreening
): WatchlistEntry {
  return {
    screeningKey: screeningKey(film.filmId, screening),
    filmId: film.filmId,
    addedAt: Date.now(),
    filmNameCn: film.nameCn,
    filmNameEn: film.nameEn,
    director: film.director,
    group: film.group,
    country: film.country,
    lengthLabel: film.lengthLabel,
    posterUrl: film.posterUrl,
    screening: { ...screening },
  };
}

export function loadWatchlist(): WatchlistEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isWatchlistEntry);
  } catch {
    return [];
  }
}

export function saveWatchlist(entries: WatchlistEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(entries));
}

function isWatchlistEntry(v: unknown): v is WatchlistEntry {
  if (!v || typeof v !== "object") return false;
  const e = v as WatchlistEntry;
  return (
    typeof e.screeningKey === "string" &&
    typeof e.filmId === "string" &&
    typeof e.filmNameCn === "string" &&
    e.screening != null &&
    typeof e.screening.date === "string" &&
    typeof e.screening.startTime === "string"
  );
}
