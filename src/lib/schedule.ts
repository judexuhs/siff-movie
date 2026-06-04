import type { SiffFilm, SiffScreening } from "./types";

/** Numeric sort key from SIFF date/time strings (e.g. 6月13日 + 18:30). */
export function screeningSortKey(s: SiffScreening): number {
  const dm = s.date.match(/(\d+)月(\d+)日/);
  const month = dm ? Number(dm[1]) : 0;
  const day = dm ? Number(dm[2]) : 0;
  const tm = s.startTime.match(/(\d+):(\d+)/);
  const hour = tm ? Number(tm[1]) : 0;
  const min = tm ? Number(tm[2]) : 0;
  return month * 1_000_000 + day * 10_000 + hour * 100 + min;
}

export function sortScreenings(screenings: SiffScreening[]): SiffScreening[] {
  return [...screenings].sort((a, b) => screeningSortKey(a) - screeningSortKey(b));
}

export function firstScreeningTime(film: SiffFilm): number {
  if (!film.screenings.length) return Number.MAX_SAFE_INTEGER;
  return Math.min(...film.screenings.map(screeningSortKey));
}

export interface CinemaScheduleItem {
  film: SiffFilm;
  screening: SiffScreening;
}

export interface CinemaSchedule {
  cinema: string;
  address: string;
  items: CinemaScheduleItem[];
}

/** Group all screenings by cinema; each cinema's list is chronological. */
export function buildCinemaSchedules(films: SiffFilm[]): CinemaSchedule[] {
  const map = new Map<string, CinemaSchedule>();

  for (const film of films) {
    for (const screening of film.screenings) {
      const cinema = screening.cinema?.trim() || "未知影院";
      let entry = map.get(cinema);
      if (!entry) {
        entry = {
          cinema,
          address: screening.cinemaAddress?.trim() || "",
          items: [],
        };
        map.set(cinema, entry);
      }
      if (!entry.address && screening.cinemaAddress?.trim()) {
        entry.address = screening.cinemaAddress.trim();
      }
      entry.items.push({ film, screening });
    }
  }

  const schedules = [...map.values()];
  for (const s of schedules) {
    s.items.sort(
      (a, b) => screeningSortKey(a.screening) - screeningSortKey(b.screening)
    );
  }
  schedules.sort((a, b) => a.cinema.localeCompare(b.cinema, "zh"));
  return schedules;
}
