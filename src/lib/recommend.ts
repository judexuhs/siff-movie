import { chat, getAiConfig } from "./ai";
import type {
  DoubanProfile,
  Recommendation,
  RecommendationResult,
  SiffFilm,
} from "./types";

// Keep prompts bounded so we stay within context limits and control cost.
const MAX_HISTORY = 80; // most-relevant watched movies sent to the model
const SYNOPSIS_CHARS = 70;
const DEFAULT_TOP_N = 12;

/**
 * Taste signals that drive a recommendation. At least one of `profile` or
 * `liked` must be present. This abstraction lets us add new signal types later
 * (e.g. genre tags, directors) without changing the engine's public shape.
 */
export interface TasteInput {
  profile?: DoubanProfile | null;
  /** Free-text titles the user likes (manual input). */
  liked?: string[];
  /** Free-text titles the user dislikes. */
  disliked?: string[];
}

export function hasTasteSignal(taste: TasteInput): boolean {
  return Boolean(
    (taste.profile && taste.profile.movies.length) ||
      (taste.liked && taste.liked.length)
  );
}

function truncate(s: string, n: number): string {
  if (!s) return "";
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

/**
 * Select the most informative slice of watch history: rated movies first
 * (higher ratings preferred), then recent unrated ones.
 */
function selectHistory(profile: DoubanProfile) {
  const rated = profile.movies
    .filter((m) => m.rating != null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const unrated = profile.movies.filter((m) => m.rating == null);
  return [...rated, ...unrated].slice(0, MAX_HISTORY);
}

function buildHistoryBlock(profile: DoubanProfile): string {
  const lines = selectHistory(profile).map((m) => {
    const stars = m.rating ? `★${m.rating}` : "未评分";
    const name = m.titles.slice(0, 2).join(" / ");
    return `- ${name}（${stars}）`;
  });
  return lines.join("\n");
}

/** Assemble the taste section from a Douban profile and/or manual input. */
function buildTasteSection(taste: TasteInput): string {
  const parts: string[] = [];
  if (taste.profile && taste.profile.movies.length) {
    parts.push(
      `【用户豆瓣看过的影片（含评分，★越多越喜欢）】\n${buildHistoryBlock(
        taste.profile
      )}`
    );
  }
  if (taste.liked && taste.liked.length) {
    parts.push(`【用户特别喜欢的电影】\n${taste.liked.map((t) => `- ${t}`).join("\n")}`);
  }
  if (taste.disliked && taste.disliked.length) {
    parts.push(
      `【用户不喜欢/想避开的电影】\n${taste.disliked
        .map((t) => `- ${t}`)
        .join("\n")}`
    );
  }
  return parts.join("\n\n");
}

/**
 * Build a compact catalog. Films are referenced by a short numeric index to
 * save tokens; we map indexes back to real films afterwards.
 */
function buildCatalog(films: SiffFilm[]): {
  block: string;
  indexToFilm: Map<number, SiffFilm>;
} {
  const indexToFilm = new Map<number, SiffFilm>();
  const lines = films.map((f, i) => {
    indexToFilm.set(i, f);
    const meta = [f.country, f.director, f.group]
      .filter(Boolean)
      .join(" · ");
    const name = [f.nameCn, f.nameEn].filter(Boolean).join(" / ");
    return `${i}|${name}|${meta}|${truncate(f.synopsis, SYNOPSIS_CHARS)}`;
  });
  return { block: lines.join("\n"), indexToFilm };
}

const SYSTEM_PROMPT = `你是一位资深电影策展人，熟悉世界各国电影与上海国际电影节（SIFF）的选片。
你的任务：根据用户提供的观影口味信息（可能来自豆瓣"看过"记录，也可能是手动填写的喜欢/不喜欢的电影），分析其口味，并从给定的上影节排片片单中挑选最契合的影片进行推荐。
要求：
1. 先用1-2句话凝练用户的观影口味（类型、地区、导演、风格偏好）。
2. 只能从给定片单中推荐，使用片单每行开头的数字编号来指代影片，禁止编造编号。
3. 优先推荐与用户喜欢的影片在风格/题材/导演/地区上相近、但又能带来新鲜感的影片；明确避开与"不喜欢"列表风格相近的影片。
4. 给每部推荐影片打一个0-100的契合度分数，并写一段较为充实的中文推荐理由（大约3到4句、80-140字）。理由要做到：
   (a) 具体点出这部影片本身的看点（题材、风格、导演手法、情绪或它在上影节的意义）；
   (b) 明确说明它与用户口味的关联——和用户看过/喜欢的哪部、哪种类型或哪位导演呼应；
   (c) 给出一个"为什么值得你专门去影院看这一场"的理由。
   语气像一位懂电影的朋友在真诚安利，避免空泛套话和"AI腔"。
5. basedOn 列出促成该推荐的用户喜欢的影片名（1-3部）。
严格只输出 JSON，不要任何多余文字。`;

function buildUserPrompt(
  tasteSection: string,
  catalogBlock: string,
  topN: number
): string {
  return `${tasteSection}

【上影节排片片单】（格式：编号|片名|国家·导演·单元|简介）
${catalogBlock}

请推荐最契合的 ${topN} 部影片，按契合度从高到低排序。
只输出如下 JSON 结构：
{
  "tasteProfile": "对用户口味的1-2句凝练描述",
  "recommendations": [
    { "index": 数字编号, "score": 0到100的整数, "reason": "推荐理由", "basedOn": ["影片名"] }
  ]
}`;
}

interface RawRec {
  index: number;
  score?: number;
  reason?: string;
  basedOn?: string[];
}

function extractJson(text: string): unknown {
  // Models sometimes wrap JSON in code fences despite instructions.
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("AI 返回的内容不是有效 JSON");
  }
}

export async function recommendFilms(
  taste: TasteInput,
  films: SiffFilm[],
  topN = DEFAULT_TOP_N
): Promise<RecommendationResult> {
  const config = getAiConfig();
  const tasteSection = buildTasteSection(taste);
  const { block: catalogBlock, indexToFilm } = buildCatalog(films);

  const content = await chat(
    [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: buildUserPrompt(tasteSection, catalogBlock, topN),
      },
    ],
    { temperature: 0.6, jsonMode: true, maxTokens: 6000 },
    config
  );

  const parsed = extractJson(content) as {
    tasteProfile?: string;
    recommendations?: RawRec[];
  };

  const recommendations: Recommendation[] = [];
  const usedFilmIds = new Set<string>();

  for (const rec of parsed.recommendations ?? []) {
    const film = indexToFilm.get(Number(rec.index));
    if (!film || usedFilmIds.has(film.filmId)) continue;
    usedFilmIds.add(film.filmId);
    recommendations.push({
      filmId: film.filmId,
      score: Math.max(0, Math.min(100, Math.round(rec.score ?? 0))),
      reason: rec.reason?.trim() || "与你的观影口味相符。",
      basedOn: Array.isArray(rec.basedOn) ? rec.basedOn.slice(0, 3) : [],
    });
  }

  recommendations.sort((a, b) => b.score - a.score);

  return {
    recommendations,
    tasteProfile: parsed.tasteProfile?.trim() || "",
    provider: config.provider,
    model: config.model,
  };
}
