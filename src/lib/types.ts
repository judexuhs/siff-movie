// ---------- SIFF ----------

/** A single screening session of a film (一场排片). */
export interface SiffScreening {
  id: string;
  date: string; // e.g. "6月13日"
  weekday: string; // e.g. "周六"
  startTime: string; // e.g. "18:30"
  endTime: string;
  cinema: string;
  cinemaAddress: string;
  hallName: string;
  liveActivity: boolean; // 观众见面会场次
}

/** A film in the SIFF program, with all of its screenings grouped together. */
export interface SiffFilm {
  filmId: string;
  nameCn: string;
  nameEn: string;
  director: string;
  country: string;
  /** Program section / unit, e.g. "向大师致敬". */
  group: string;
  lengthLabel: string; // e.g. "108分钟"
  lengthMinutes: number | null;
  color: string;
  synopsis: string;
  posterUrl: string;
  screenings: SiffScreening[];
  /** Linked Douban subject, populated from the enrichment cache when available. */
  douban?: DoubanLink;
}

/** A SIFF film matched to its Douban subject (via the suggest endpoint). */
export interface DoubanLink {
  subjectId: string;
  url: string;
  year: string;
  /** Douban-hosted poster (often higher quality / always loadable). */
  poster: string;
  /** Douban average rating, if it was fetched. */
  rating: number | null;
  /** How confident the name match is. */
  matched: boolean;
}

// ---------- Douban ----------

export interface DoubanMovie {
  subjectId: string;
  url: string;
  /** Primary (Chinese) title, normalized. */
  title: string;
  /** All title variants found (cn / original), for matching. */
  titles: string[];
  /** User's star rating 1-5, or null if unrated. */
  rating: number | null;
  /** Watched date, e.g. "2026-05-12". */
  watchedDate: string | null;
  comment: string | null;
}

export interface DoubanProfile {
  userId: string;
  displayName: string;
  totalWatched: number;
  movies: DoubanMovie[];
  /**
   * Why the fetch stopped before reading the entire list, if at all.
   * - null: read everything.
   * - "cap": stopped at our page cap by design (to avoid anti-scraping).
   * - "throttle": Douban throttled us before we finished.
   */
  truncated: "cap" | "throttle" | null;
}

// ---------- Recommendation ----------

export interface Recommendation {
  filmId: string;
  /** 0-100 match score. */
  score: number;
  reason: string;
  /** Douban titles that informed this recommendation. */
  basedOn: string[];
}

export interface RecommendationResult {
  recommendations: Recommendation[];
  tasteProfile: string;
  provider: string;
  model: string;
}
