import type { SiffFilm, SiffScreening } from "./types";
import { loadDoubanLinks } from "./doubanCache";

/**
 * SIFF publishes the full schedule as a single JSON document. We keep a small
 * list of candidate endpoints so the app keeps working if SIFF rotates the URL
 * between editions; the first one that returns valid data wins.
 */
const SIFF_ENDPOINTS = [
  "https://www.siff.com/schedule/paipiandatacn",
  "https://www.siff.com/static/json/cndata.json",
];

const SIFF_REFERER = "https://www.siff.com/page/paipian";

/** Raw record shape as returned by SIFF (one row per screening). */
interface SiffRawRecord {
  filmId?: string;
  id?: string;
  nameCn?: string;
  nameEn?: string;
  director?: string;
  country?: string;
  group?: string;
  length?: string;
  color?: string;
  synopsis?: string;
  photoMvUrl?: string;
  date?: string;
  weekday?: string;
  stime?: string;
  etime?: string;
  cinema?: string;
  cinemaAddress?: string;
  hallsName?: string;
  liveActivity?: string;
}

interface SiffCache {
  films: SiffFilm[];
  fetchedAt: number;
}

// Module-level cache. SIFF data only changes a few times a day at most.
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes
let cache: SiffCache | null = null;
let inflight: Promise<SiffFilm[]> | null = null;

function parseLengthMinutes(label: string | undefined): number | null {
  if (!label) return null;
  const m = label.match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

/** A stable key for grouping screenings into the same film. */
function filmKey(r: SiffRawRecord): string {
  if (r.filmId && r.filmId.trim()) return `id:${r.filmId.trim()}`;
  // Fallback for editions/records without a filmId.
  return `name:${(r.nameCn || r.nameEn || "").trim()}`;
}

async function fetchRaw(): Promise<SiffRawRecord[]> {
  let lastErr: unknown = null;
  for (const url of SIFF_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        headers: {
          Referer: SIFF_REFERER,
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        },
        // We do our own in-memory caching; let SIFF responses be fresh.
        cache: "no-store",
      });
      if (!res.ok) {
        lastErr = new Error(`SIFF ${url} responded ${res.status}`);
        continue;
      }
      const data = (await res.json()) as SiffRawRecord[];
      if (Array.isArray(data) && data.length > 0) return data;
      lastErr = new Error(`SIFF ${url} returned empty data`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(
    `无法获取上影节排片数据: ${
      lastErr instanceof Error ? lastErr.message : String(lastErr)
    }`
  );
}

/** Collapse per-screening rows into deduplicated films with grouped showtimes. */
function groupFilms(rows: SiffRawRecord[]): SiffFilm[] {
  const byFilm = new Map<string, SiffFilm>();

  for (const r of rows) {
    const key = filmKey(r);
    let film = byFilm.get(key);
    if (!film) {
      film = {
        filmId: r.filmId?.trim() || key,
        nameCn: (r.nameCn || "").trim(),
        nameEn: (r.nameEn || "").trim(),
        director: (r.director || "").trim(),
        country: (r.country || "").trim(),
        group: (r.group || "").trim(),
        lengthLabel: (r.length || "").trim(),
        lengthMinutes: parseLengthMinutes(r.length),
        color: (r.color || "").trim(),
        synopsis: (r.synopsis || "").trim(),
        posterUrl: (r.photoMvUrl || "").trim(),
        screenings: [],
      };
      byFilm.set(key, film);
    }

    const screening: SiffScreening = {
      id: (r.id || "").trim(),
      date: (r.date || "").trim(),
      weekday: (r.weekday || "").trim(),
      startTime: (r.stime || "").trim(),
      endTime: (r.etime || "").trim(),
      cinema: (r.cinema || "").trim(),
      cinemaAddress: (r.cinemaAddress || "").trim().replace(/\s+/g, " "),
      hallName: (r.hallsName || "").trim(),
      liveActivity: r.liveActivity === "1",
    };
    film.screenings.push(screening);
  }

  // Sort screenings within each film by date then time.
  for (const film of byFilm.values()) {
    film.screenings.sort((a, b) =>
      `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`, "zh")
    );
  }

  return Array.from(byFilm.values()).sort((a, b) =>
    a.nameCn.localeCompare(b.nameCn, "zh")
  );
}

/** Returns all SIFF films (deduped, with grouped screenings), cached in memory. */
export async function getSiffFilms(forceRefresh = false): Promise<SiffFilm[]> {
  if (
    !forceRefresh &&
    cache &&
    Date.now() - cache.fetchedAt < CACHE_TTL_MS
  ) {
    return cache.films;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const [rows, links] = await Promise.all([fetchRaw(), loadDoubanLinks()]);
      const films = groupFilms(rows);
      for (const film of films) {
        const link = links[film.filmId];
        if (link) film.douban = link;
      }
      cache = { films, fetchedAt: Date.now() };
      return films;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function findFilmById(
  films: SiffFilm[],
  filmId: string
): SiffFilm | undefined {
  return films.find((f) => f.filmId === filmId);
}
