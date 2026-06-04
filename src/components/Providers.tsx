"use client";

import type { ReactNode } from "react";
import { WatchlistProvider } from "@/components/watchlist/WatchlistProvider";

export function Providers({ children }: { children: ReactNode }) {
  return <WatchlistProvider>{children}</WatchlistProvider>;
}
