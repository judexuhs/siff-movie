"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SiffFilm, SiffScreening } from "@/lib/types";
import {
  entryFromFilm,
  loadWatchlist,
  saveWatchlist,
  screeningKey,
  WATCHLIST_STORAGE_KEY,
  type WatchlistEntry,
} from "@/lib/watchlist";

type WatchlistContextValue = {
  ready: boolean;
  entries: WatchlistEntry[];
  count: number;
  has: (film: SiffFilm, screening: SiffScreening) => boolean;
  add: (film: SiffFilm, screening: SiffScreening) => void;
  remove: (key: string) => void;
  toggle: (film: SiffFilm, screening: SiffScreening) => void;
  clear: () => void;
};

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setEntries(loadWatchlist());
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === WATCHLIST_STORAGE_KEY) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const persist = useCallback((next: WatchlistEntry[]) => {
    saveWatchlist(next);
    setEntries(next);
  }, []);

  const has = useCallback(
    (film: SiffFilm, screening: SiffScreening) =>
      entries.some(
        (e) => e.screeningKey === screeningKey(film.filmId, screening)
      ),
    [entries]
  );

  const add = useCallback(
    (film: SiffFilm, screening: SiffScreening) => {
      const key = screeningKey(film.filmId, screening);
      if (entries.some((e) => e.screeningKey === key)) return;
      persist([...entries, entryFromFilm(film, screening)]);
    },
    [entries, persist]
  );

  const remove = useCallback(
    (key: string) => {
      persist(entries.filter((e) => e.screeningKey !== key));
    },
    [entries, persist]
  );

  const toggle = useCallback(
    (film: SiffFilm, screening: SiffScreening) => {
      const key = screeningKey(film.filmId, screening);
      if (entries.some((e) => e.screeningKey === key)) {
        remove(key);
      } else {
        add(film, screening);
      }
    },
    [entries, add, remove]
  );

  const clear = useCallback(() => persist([]), [persist]);

  const value = useMemo(
    () => ({
      ready,
      entries,
      count: entries.length,
      has,
      add,
      remove,
      toggle,
      clear,
    }),
    [ready, entries, has, add, remove, toggle, clear]
  );

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist(): WatchlistContextValue {
  const ctx = useContext(WatchlistContext);
  if (!ctx) {
    throw new Error("useWatchlist must be used within WatchlistProvider");
  }
  return ctx;
}
