import { promises as fs } from "fs";
import path from "path";
import type { DoubanLink } from "./types";

/** filmId -> Douban link. Populated by scripts/enrich-douban.mjs. */
export type DoubanLinkMap = Record<string, DoubanLink>;

const CACHE_PATH = path.join(process.cwd(), "data", "douban-links.json");

let memo: { map: DoubanLinkMap; at: number } | null = null;
const TTL = 1000 * 60 * 5;

/** Loads the on-disk enrichment cache. Returns {} if it hasn't been built yet. */
export async function loadDoubanLinks(): Promise<DoubanLinkMap> {
  if (memo && Date.now() - memo.at < TTL) return memo.map;
  try {
    const raw = await fs.readFile(CACHE_PATH, "utf-8");
    const map = JSON.parse(raw) as DoubanLinkMap;
    memo = { map, at: Date.now() };
    return map;
  } catch {
    return {};
  }
}

export const DOUBAN_CACHE_PATH = CACHE_PATH;
