"use client";

import type { SiffFilm, SiffScreening } from "@/lib/types";
import { useWatchlist } from "./WatchlistProvider";
import { BookmarkSimpleIcon } from "@phosphor-icons/react";

export function WatchlistToggle({
  film,
  screening,
  className = "",
  size = "sm",
}: {
  film: SiffFilm;
  screening: SiffScreening;
  className?: string;
  size?: "sm" | "md";
}) {
  const { ready, has, toggle } = useWatchlist();
  const saved = ready && has(film, screening);

  const dim = size === "md" ? "h-9 w-9" : "h-8 w-8";
  const icon = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggle(film, screening);
      }}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg border transition ${dim} ${
        saved
          ? "border-siff/45 bg-siff/20 text-siff-bright hover:bg-siff/30"
          : "border-white/[0.1] bg-white/[0.04] text-cream/45 hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-cream/80"
      } ${className}`}
      aria-pressed={saved}
      aria-label={saved ? "移出片单" : "加入片单"}
      title={saved ? "移出片单" : "加入片单"}
    >
      <BookmarkSimpleIcon
        className={icon}
        weight={saved ? "fill" : "regular"}
      />
    </button>
  );
}
