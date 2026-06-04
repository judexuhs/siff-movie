import "server-only";
import type { DoubanMovie, DoubanProfile } from "./types";
import { proxyFetch } from "./proxyFetch";

const PAGE_SIZE = 15;
// Default cap: only read the most recent ~30 pages (≈450 films). This keeps us
// well within Douban's anti-scraping tolerance while still capturing more than
// enough rated history to characterise taste. Callers may raise it explicitly.
const DEFAULT_MAX_PAGES = 30;
// Hard ceiling so a custom cap can't loop forever.
const MAX_PAGES = 200;
const REQUEST_DELAY_MS = 360; // base politeness delay between pages
// When a page comes back empty/blocked but we KNOW more remain, treat it as a
// transient throttle: pause and retry instead of truncating the whole history.
const PAGE_RETRIES = 3;
const RETRY_BACKOFF_MS = [1500, 4000, 9000];

export class DoubanError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = "DoubanError";
  }
}

/**
 * Accepts a raw Douban user id, a /people/<id>/ URL, or a full collect URL and
 * returns the bare user id.
 */
export function parseUserId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new DoubanError("请填写豆瓣 ID 或主页链接", "EMPTY");

  const urlMatch = trimmed.match(/douban\.com\/people\/([^/?#]+)/i);
  if (urlMatch) return decodeURIComponent(urlMatch[1]);

  // A bare id: letters, digits, dashes, underscores.
  if (/^[A-Za-z0-9_-]+$/.test(trimmed)) return trimmed;

  throw new DoubanError(
    "无法识别豆瓣 ID，请填写形如 131506726 的数字 ID 或主页链接",
    "BAD_INPUT"
  );
}

function buildHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9",
    Referer: "https://movie.douban.com/",
  };
  // Optional cookie for reliability / private-ish profiles, never exposed to client.
  if (process.env.DOUBAN_COOKIE) headers.Cookie = process.env.DOUBAN_COOKIE;
  return headers;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/**
 * Strong anti-bot signals only. Weak phrases like "请稍后重试" appear in the
 * normal page boilerplate, so we must not treat them as a block.
 */
function isBlocked(html: string): boolean {
  return (
    html.includes("有异常请求") ||
    html.includes("sec.douban.com") ||
    html.includes("window.location.href='https://sec.douban") ||
    (html.includes("安全验证") && !html.includes("看过的影视"))
  );
}

interface ParsedPage {
  displayName: string;
  total: number;
  movies: DoubanMovie[];
  /** True if the page explicitly says the user hasn't marked anything. */
  rawHadEmptyNotice: boolean;
  /** True if the paginator still has a "后页" (next) link. Authoritative end signal. */
  hasNext: boolean;
}

/** Splits the collect page into individual item blocks and extracts each movie. */
function parsePage(html: string): ParsedPage {
  if (isBlocked(html)) {
    throw new DoubanError(
      "豆瓣触发了安全验证（可能是访问过于频繁）。请稍后重试，或在服务端配置 DOUBAN_COOKIE。",
      "BLOCKED"
    );
  }

  const totalMatch = html.match(/看过的影视\((\d+)\)/);
  const total = totalMatch ? Number(totalMatch[1]) : 0;

  const nameMatch = html.match(/<title>\s*([\s\S]*?)看过的影视/);
  const displayName = nameMatch
    ? decodeEntities(nameMatch[1].trim())
    : "豆瓣用户";

  const movies: DoubanMovie[] = [];
  // Each watched movie lives in a `.item.comment-item` block.
  const itemRegex = /<div class="item comment-item"[\s\S]*?<\/li>\s*<\/ul>/g;
  const blocks = html.match(itemRegex) || [];

  for (const block of blocks) {
    const linkMatch = block.match(
      /<li class="title">\s*<a href="(https:\/\/movie\.douban\.com\/subject\/(\d+)\/?)"[^>]*>\s*<em>([\s\S]*?)<\/em>([\s\S]*?)<\/a>/
    );
    if (!linkMatch) continue;

    const url = linkMatch[1];
    const subjectId = linkMatch[2];
    const cnTitle = decodeEntities(linkMatch[3].trim());
    // Text after </em> often holds " / Original Title".
    const extra = decodeEntities(
      linkMatch[4].replace(/<[^>]+>/g, "").trim()
    ).replace(/^\/\s*/, "");

    const titles = [cnTitle];
    if (extra) {
      for (const part of extra.split("/")) {
        const t = part.trim();
        if (t && !titles.includes(t)) titles.push(t);
      }
    }

    const ratingMatch = block.match(/rating(\d)-t/);
    const rating = ratingMatch ? Number(ratingMatch[1]) : null;

    const dateMatch = block.match(/<span class="date">([^<]+)<\/span>/);
    const watchedDate = dateMatch ? dateMatch[1].trim() : null;

    const commentMatch = block.match(/<span class="comment">([^<]*)<\/span>/);
    const comment = commentMatch ? decodeEntities(commentMatch[1].trim()) : null;

    movies.push({
      subjectId,
      url,
      title: cnTitle,
      titles,
      rating,
      watchedDate,
      comment,
    });
  }

  // The paginator's "后页" (next) link only renders an <a> when more pages exist.
  const nextMatch = html.match(/<span class="next">([\s\S]*?)<\/span>/);
  const hasNext = nextMatch ? /<a\s/i.test(nextMatch[1]) : false;

  return {
    displayName,
    total,
    movies,
    rawHadEmptyNotice: html.includes("还没有"),
    hasNext,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fetches and parses a single collect page (no retry). */
async function fetchPage(
  userId: string,
  start: number,
  headers: HeadersInit
): Promise<ParsedPage> {
  const url = `https://movie.douban.com/people/${encodeURIComponent(
    userId
  )}/collect?start=${start}&sort=time&type=all&filter=all&mode=grid`;

  const res = await proxyFetch(url, { headers, cache: "no-store" });

  if (res.status === 404) {
    throw new DoubanError("找不到该豆瓣用户，请检查 ID 是否正确", "NOT_FOUND");
  }
  if (res.status === 403) {
    throw new DoubanError(
      "豆瓣拒绝了访问（该用户的观影记录可能未公开，或触发了反爬）。",
      "FORBIDDEN"
    );
  }
  if (!res.ok) {
    throw new DoubanError(`豆瓣返回错误状态 ${res.status}`, "HTTP_ERROR");
  }

  const html = await res.text();
  const parsed = parsePage(html); // throws DoubanError("BLOCKED") on anti-bot
  return parsed;
}

/**
 * Fetches a user's "看过" list, paginating up to `maxMovies` (default ≈450).
 *
 * Pagination uses Douban's own "后页" next-page link as the authoritative end
 * signal. If a page comes back empty/blocked while more are expected, we treat
 * it as a transient throttle and retry with exponential backoff; only after
 * exhausting retries do we return a partial result (flagged via `truncated`)
 * instead of failing outright.
 *
 * @param userInput raw id / profile url / collect url
 * @param maxMovies cap on how many movies to read (default ≈ first 30 pages)
 */
export async function fetchWatchHistory(
  userInput: string,
  maxMovies = DEFAULT_MAX_PAGES * PAGE_SIZE
): Promise<DoubanProfile> {
  const userId = parseUserId(userInput);
  const headers = buildHeaders();

  const all: DoubanMovie[] = [];
  const seen = new Set<string>();
  let displayName = "豆瓣用户";
  let total = 0;
  let truncated: "cap" | "throttle" | null = null;
  // We continue while the previous page advertised a "next" link.
  let expectMore = true;

  for (let page = 0; page < MAX_PAGES; page++) {
    const start = page * PAGE_SIZE;
    if (start >= maxMovies) {
      truncated = "cap"; // stopped at the page cap by design
      break;
    }

    let parsed: ParsedPage | null = null;

    // Attempt the page, retrying transient empties (likely throttling).
    for (let attempt = 0; attempt <= PAGE_RETRIES; attempt++) {
      try {
        const p = await fetchPage(userId, start, headers);
        // An empty page is only legitimate if the page explicitly says the list
        // is empty. Otherwise, since we only got here because more pages were
        // expected, an empty page means a throttle and is worth retrying. This
        // covers page 0 too, so a throttled first page is not mistaken for a
        // private profile.
        if (p.movies.length === 0 && !p.rawHadEmptyNotice) {
          throw new DoubanError("空页（疑似限流）", "EMPTY_PAGE");
        }
        parsed = p;
        break;
      } catch (err) {
        const code = (err as DoubanError)?.code;
        // A definitive 404 (no such user) is never retryable. A 403 on the very
        // first page means the list is private (or our IP is blocked), so fail
        // fast there. But a 403 / anti-bot / empty page *mid-fetch* is almost
        // always a transient throttle: retry with backoff and, if it persists,
        // keep whatever pages we already gathered.
        if (code === "NOT_FOUND") throw err;
        if (code === "FORBIDDEN" && page === 0) throw err;
        if (attempt < PAGE_RETRIES) {
          await sleep(RETRY_BACKOFF_MS[attempt] ?? 9000);
        }
      }
    }

    // Retries exhausted.
    if (!parsed) {
      if (page === 0) {
        throw new DoubanError(
          "未能读取到观影记录：该用户的记录可能未公开，或豆瓣暂时限流，请稍后重试。",
          "UNAVAILABLE"
        );
      }
      truncated = "throttle"; // keep what we have as a partial result
      break;
    }

    if (page === 0) {
      displayName = parsed.displayName;
      total = parsed.total;
      if (parsed.movies.length === 0 && parsed.rawHadEmptyNotice) {
        throw new DoubanError("该用户还没有标记过看过的影视", "EMPTY");
      }
    }

    for (const m of parsed.movies) {
      if (!seen.has(m.subjectId)) {
        seen.add(m.subjectId);
        all.push(m);
      }
    }

    expectMore = parsed.hasNext;
    if (!expectMore) break; // authoritative end of list
    if (all.length >= maxMovies) {
      truncated = "cap";
      break;
    }

    await sleep(REQUEST_DELAY_MS);
  }

  return {
    userId,
    displayName,
    totalWatched: total || all.length,
    movies: all,
    truncated,
  };
}
