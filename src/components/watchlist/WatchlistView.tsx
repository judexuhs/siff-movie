"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { WatchlistEntry } from "@/lib/watchlist";
import { screeningSortKey } from "@/lib/schedule";
import { posterSrc } from "@/lib/poster";
import { useWatchlist } from "./WatchlistProvider";
import {
  CalendarBlankIcon,
  MapPinIcon,
  FilmSlateIcon,
  TrashIcon,
  ArrowSquareOutIcon,
} from "@phosphor-icons/react";

function groupByDate(entries: WatchlistEntry[]): { date: string; items: WatchlistEntry[] }[] {
  const sorted = [...entries].sort(
    (a, b) => screeningSortKey(a.screening) - screeningSortKey(b.screening)
  );
  const map = new Map<string, WatchlistEntry[]>();
  for (const e of sorted) {
    const date = e.screening.date || "日期待定";
    const list = map.get(date) ?? [];
    list.push(e);
    map.set(date, list);
  }
  return [...map.entries()].map(([date, items]) => ({ date, items }));
}

export function WatchlistView() {
  const { ready, entries, remove, clear } = useWatchlist();
  const [confirmClear, setConfirmClear] = useState(false);
  const groups = useMemo(() => groupByDate(entries), [entries]);

  if (!ready) {
    return (
      <p className="text-sm text-cream/45">正在读取本机片单…</p>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-night-800/40 px-6 py-14 text-center">
        <FilmSlateIcon className="mx-auto h-10 w-10 text-cream/20" />
        <p className="mt-4 text-lg font-medium text-cream">片单还是空的</p>
        <p className="mt-2 text-sm text-cream/50">
          在影片详览、推荐结果或影院排片里，点击场次旁的
          <span className="mx-1 text-siff-bright">书签</span>
          即可按具体场次加入片单。无需登录，数据只保存在本浏览器。
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            href="/films/detail"
            className="rounded-xl bg-siff px-4 py-2 text-sm font-medium text-white transition hover:bg-siff-bright"
          >
            去影片详览
          </Link>
          <Link
            href="/cinemas"
            className="rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm font-medium text-cream/80 transition hover:bg-white/[0.08]"
          >
            去影院排片
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-cream/50">
          共 <span className="font-medium text-cream">{entries.length}</span> 场
          · 按放映日期排序 · 仅存于本机
        </p>
        {confirmClear ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-cream/55">确认清空？</span>
            <button
              type="button"
              onClick={() => {
                clear();
                setConfirmClear(false);
              }}
              className="rounded-lg bg-siff px-3 py-1.5 font-medium text-white hover:bg-siff-bright"
            >
              清空
            </button>
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="rounded-lg border border-white/[0.12] px-3 py-1.5 text-cream/70 hover:text-cream"
            >
              取消
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="text-xs text-cream/40 transition hover:text-cream/70"
          >
            清空片单
          </button>
        )}
      </div>

      {groups.map(({ date, items }) => (
        <section key={date}>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-cream">
            <CalendarBlankIcon className="h-4 w-4 text-siff" />
            {date}
            <span className="font-normal text-cream/40">（{items.length} 场）</span>
          </h2>
          <ul className="space-y-2">
            {items.map((entry) => (
              <WatchlistItemCard
                key={entry.screeningKey}
                entry={entry}
                onRemove={() => remove(entry.screeningKey)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function WatchlistItemCard({
  entry,
  onRemove,
}: {
  entry: WatchlistEntry;
  onRemove: () => void;
}) {
  const s = entry.screening;
  const src = posterSrc({ posterUrl: entry.posterUrl });

  return (
    <li className="flex gap-3 overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-r from-night-800/50 to-night-900/60 p-3 sm:p-4">
      <div className="relative h-24 w-[4.25rem] shrink-0 overflow-hidden rounded-lg bg-night-800 sm:h-28 sm:w-[5.5rem]">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={entry.filmNameCn}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FilmSlateIcon className="h-6 w-6 text-cream/20" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/films/detail#film-${entry.filmId}`}
              className="text-base font-semibold text-cream transition hover:text-siff-bright sm:text-lg"
            >
              {entry.filmNameCn}
            </Link>
            {entry.filmNameEn ? (
              <p className="truncate text-xs text-cream/40">{entry.filmNameEn}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.1] text-cream/40 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
            aria-label="移出片单"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="font-mono font-semibold text-siff-bright">
            {s.startTime}
            {s.endTime ? (
              <span className="ml-1 font-normal text-cream/35">– {s.endTime}</span>
            ) : null}
          </span>
          <span className="text-cream/50">{s.weekday}</span>
        </div>

        <p className="mt-1.5 flex items-start gap-1.5 text-sm text-cream/65">
          <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-cream/35" />
          <span>
            {s.cinema}
            {s.hallName ? (
              <span className="text-cream/45"> · {s.hallName}</span>
            ) : null}
          </span>
        </p>

        {s.cinemaAddress ? (
          <p className="mt-0.5 pl-5.5 text-xs text-cream/40">{s.cinemaAddress}</p>
        ) : null}

        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
          {entry.group ? (
            <span className="rounded-md border border-siff/30 bg-siff/10 px-2 py-0.5 text-siff-bright">
              {entry.group}
            </span>
          ) : null}
          {entry.country ? (
            <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-cream/60">
              {entry.country}
            </span>
          ) : null}
          {entry.lengthLabel ? (
            <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-cream/60">
              {entry.lengthLabel}
            </span>
          ) : null}
          {s.liveActivity ? (
            <span className="rounded bg-gold/15 px-1.5 py-0.5 font-medium text-gold">
              见面会
            </span>
          ) : null}
        </div>

        {entry.director ? (
          <p className="mt-1.5 text-xs text-cream/50">导演 · {entry.director}</p>
        ) : null}

        <Link
          href={`/films/detail#film-${entry.filmId}`}
          className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-cream/55 transition hover:text-siff-bright"
        >
          查看影片详情
          <ArrowSquareOutIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
    </li>
  );
}
