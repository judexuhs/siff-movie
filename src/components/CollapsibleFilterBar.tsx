"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CaretDownIcon, FunnelIcon } from "@phosphor-icons/react";

/**
 * Sticky filter bar that collapses chip rows when the user scrolls down,
 * keeping search + summary visible.
 */
export function CollapsibleFilterBar({
  topRow,
  filters,
  summary,
  collapseAfter = 72,
}: {
  topRow: ReactNode;
  filters: ReactNode;
  summary: ReactNode;
  collapseAfter?: number;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y <= collapseAfter) {
        setCollapsed(false);
        setManualOpen(false);
        return;
      }
      setCollapsed(true);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [collapseAfter]);

  const showFilters = !collapsed || manualOpen;

  return (
    <div className="sticky top-16 z-40 -mx-5 mb-6 border-b border-white/[0.06] bg-night-950/90 px-5 py-3 backdrop-blur-xl sm:-mx-8 sm:px-8">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">{topRow}</div>
        {collapsed ? (
          <button
            type="button"
            onClick={() => setManualOpen((v) => !v)}
            className={`mt-0.5 flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-medium transition ${
              manualOpen
                ? "border-siff/40 bg-siff/15 text-siff-bright"
                : "border-white/[0.1] bg-white/[0.04] text-cream/70 hover:text-cream"
            }`}
            aria-expanded={manualOpen}
            aria-label={manualOpen ? "收起筛选" : "展开筛选"}
          >
            <FunnelIcon className="h-3.5 w-3.5" />
            筛选
            <CaretDownIcon
              className={`h-3 w-3 transition-transform ${manualOpen ? "rotate-180" : ""}`}
            />
          </button>
        ) : null}
      </div>

      <div
        className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out ${
          showFilters ? "mt-2.5 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">{filters}</div>
      </div>

      <div className="mt-2.5">{summary}</div>
    </div>
  );
}
