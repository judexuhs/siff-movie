#!/usr/bin/env node
/**
 * Resolves every SIFF film to its Douban subject via the lightweight
 * `subject_suggest` endpoint and caches the result to data/douban-links.json.
 *
 * Usage:
 *   node scripts/enrich-douban.mjs           # only fill in missing films
 *   node scripts/enrich-douban.mjs --force   # re-resolve everything
 *
 * Safe to interrupt and re-run: progress is written incrementally.
 */
import { promises as fs } from "fs";
import path from "path";
import { ProxyAgent, fetch as undiciFetch } from "undici";

const SIFF_ENDPOINTS = [
  "https://www.siff.com/schedule/paipiandatacn",
  "https://www.siff.com/static/json/cndata.json",
];
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const OUT = path.join(process.cwd(), "data", "douban-links.json");
const DELAY_MS = 1200; // Douban soft-throttles the suggest endpoint; go slow.
const COOLDOWN_MS = 90_000; // when throttled (sustained empties), pause this long.
const EMPTY_STREAK_LIMIT = 6; // consecutive empties that trigger a cooldown.
const force = process.argv.includes("--force");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function proxyUrl() {
  const raw =
    process.env.DOUBAN_PROXY?.trim() ||
    process.env.HTTPS_PROXY?.trim() ||
    process.env.HTTP_PROXY?.trim();
  if (!raw) return null;
  return /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
}

/** Fetch Douban endpoints via local HTTP proxy when env is set (e.g. Clash :8118). */
async function fetchDouban(url, init) {
  const proxy = proxyUrl();
  if (!proxy) return fetch(url, init);
  const agent = new ProxyAgent(proxy);
  return undiciFetch(url, { ...init, dispatcher: agent });
}

function normalizeTitle(s) {
  return (s || "")
    .toLowerCase()
    .replace(/\(?\b(4k|2k|imax|3d|修复版|数字修复|未删减版|导演剪辑版|restored)\b\)?/gi, "")
    .replace(/[\s·:：,，.。!！?？'"“”‘’\-—()（）\/]/g, "")
    .trim();
}

async function fetchSiff() {
  for (const url of SIFF_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        headers: { Referer: "https://www.siff.com/page/paipian", "User-Agent": UA },
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data) && data.length) return data;
    } catch {}
  }
  throw new Error("无法获取 SIFF 排片数据");
}

function dedupeFilms(rows) {
  const map = new Map();
  for (const r of rows) {
    const id = (r.filmId && r.filmId.trim()) || `name:${(r.nameCn || r.nameEn || "").trim()}`;
    if (!map.has(id)) {
      map.set(id, { filmId: id, nameCn: (r.nameCn || "").trim(), nameEn: (r.nameEn || "").trim() });
    }
  }
  return [...map.values()];
}

async function suggest(film) {
  const q = film.nameCn || film.nameEn;
  if (!q) return null;
  const res = await fetchDouban(
    `https://movie.douban.com/j/subject_suggest?q=${encodeURIComponent(q)}`,
    { headers: { "User-Agent": UA, Referer: "https://movie.douban.com/", "Accept-Language": "zh-CN,zh;q=0.9" } }
  );
  if (!res.ok) return null;
  let items;
  try {
    items = await res.json();
  } catch {
    return null;
  }
  const movies = items.filter((i) => i.type === "movie" && i.id);
  if (!movies.length) return null;

  const tCn = normalizeTitle(film.nameCn);
  const tEn = normalizeTitle(film.nameEn);
  const exact = movies.find((m) => {
    const t = normalizeTitle(m.title);
    const st = normalizeTitle(m.sub_title || "");
    return (tCn && (t === tCn || st === tCn)) || (tEn && (t === tEn || st === tEn));
  });
  const best = exact || movies[0];
  return {
    subjectId: best.id,
    url: `https://movie.douban.com/subject/${best.id}/`,
    year: best.year || "",
    poster: (best.img || "").replace(/\\\//g, "/"),
    rating: null,
    matched: Boolean(exact),
  };
}

async function main() {
  await fs.mkdir(path.dirname(OUT), { recursive: true });
  let cache = {};
  try {
    cache = JSON.parse(await fs.readFile(OUT, "utf-8"));
  } catch {}

  const films = dedupeFilms(await fetchSiff());
  console.log(`SIFF 影片总数: ${films.length}`);

  let done = 0;
  let resolved = 0;
  let saveCounter = 0;
  let emptyStreak = 0;
  for (const film of films) {
    done++;
    if (!force && cache[film.filmId]) {
      resolved++;
      continue;
    }
    try {
      const link = await suggest(film);
      if (link) {
        cache[film.filmId] = link;
        resolved++;
        emptyStreak = 0;
      } else {
        emptyStreak++;
      }
    } catch (e) {
      emptyStreak++;
      console.warn(`  跳过 ${film.nameCn}: ${e.message}`);
    }

    if (done % 20 === 0)
      console.log(`  进度 ${done}/${films.length} (已解析 ${resolved})`);
    if (++saveCounter % 10 === 0)
      await fs.writeFile(OUT, JSON.stringify(cache, null, 0));

    // Sustained empties => we're being throttled; cool down and let it reset.
    if (emptyStreak >= EMPTY_STREAK_LIMIT) {
      console.log(`  检测到限流，冷却 ${COOLDOWN_MS / 1000}s …`);
      await fs.writeFile(OUT, JSON.stringify(cache, null, 0));
      await sleep(COOLDOWN_MS);
      emptyStreak = 0;
    }
    await sleep(DELAY_MS);
  }

  await fs.writeFile(OUT, JSON.stringify(cache, null, 0));
  const exact = Object.values(cache).filter((v) => v.matched).length;
  console.log(
    `完成: 写入 ${OUT}，共 ${Object.keys(cache).length} 条（精确匹配 ${exact}）`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
