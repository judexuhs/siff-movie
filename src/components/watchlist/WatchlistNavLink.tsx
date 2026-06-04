"use client";

import Link from "next/link";
import { useWatchlist } from "./WatchlistProvider";

export function WatchlistNavLink({ active }: { active?: boolean }) {
  const { ready, count } = useWatchlist();

  return (
    <Link
      href="/watchlist"
      className={`relative shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 transition sm:px-3 ${
        active
          ? "bg-white/[0.06] text-cream"
          : "text-cream/55 hover:text-cream"
      }`}
    >
      我的片单
      {ready && count > 0 ? (
        <span className="ml-1.5 inline-flex min-w-[1.125rem] items-center justify-center rounded-md bg-siff/90 px-1 py-0.5 text-[10px] font-semibold leading-none text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
