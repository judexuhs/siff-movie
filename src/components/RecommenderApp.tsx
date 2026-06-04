"use client";

import { useState } from "react";
import type { DoubanProfile } from "@/lib/types";
import { FilmCard, type RecommendedFilm } from "./FilmCard";
import {
  MagnifyingGlassIcon,
  SparkleIcon,
  HeartIcon,
  ThumbsDownIcon,
  WarningCircleIcon,
  InfoIcon,
  CaretDownIcon,
} from "@phosphor-icons/react";

interface ApiResp<T> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: string;
}

interface RecommendResponse {
  tasteProfile: string;
  provider: string;
  model: string;
  profileSummary: {
    displayName: string;
    totalWatched: number;
    analyzed: number;
  } | null;
  recommendations: RecommendedFilm[];
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ApiResp<T>;
  if (!json.ok || json.data == null) throw new Error(json.error || "请求失败");
  return json.data;
}

function splitList(text: string): string[] {
  return text
    .split(/[\n,，、;；]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type Mode = "douban" | "manual";
type Stage = "idle" | "loadingProfile" | "recommending";

export function RecommenderApp() {
  const [mode, setMode] = useState<Mode>("douban");
  const [input, setInput] = useState("");
  const [liked, setLiked] = useState("");
  const [disliked, setDisliked] = useState("");
  const [showIdHelp, setShowIdHelp] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [profile, setProfile] = useState<DoubanProfile | null>(null);
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = stage !== "idle";

  async function loadProfile() {
    setError(null);
    setResult(null);
    setProfile(null);
    setStage("loadingProfile");
    try {
      const p = await postJson<DoubanProfile>("/api/douban", { input });
      setProfile(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "读取失败");
    } finally {
      setStage("idle");
    }
  }

  async function recommend() {
    setError(null);
    setStage("recommending");
    try {
      const payload =
        mode === "douban"
          ? { profile }
          : { liked: splitList(liked), disliked: splitList(disliked) };
      const r = await postJson<RecommendResponse>("/api/recommend", payload);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "推荐失败");
    } finally {
      setStage("idle");
    }
  }

  const canRecommend =
    mode === "douban"
      ? Boolean(profile && profile.movies.length)
      : splitList(liked).length > 0;

  const ratedSample = profile?.movies
    .filter((m) => m.rating != null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 14);

  return (
    <div className="mx-auto w-full max-w-screen px-5 pb-28 sm:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Mode tabs */}
        <div className="mb-4 inline-flex rounded-xl border border-white/[0.08] bg-night-850 p-1">
          {(
            [
              ["douban", "用豆瓣记录"],
              ["manual", "手动填写偏好"],
            ] as [Mode, string][]
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                mode === m
                  ? "bg-siff text-white"
                  : "text-cream/55 hover:text-cream"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Input panel */}
        <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-night-850/80 to-night-900/70 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_30px_60px_-30px_rgba(0,0,0,0.8)]">
          {mode === "douban" ? (
            <>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="block text-sm font-medium text-cream">
                  你的豆瓣 ID 或主页链接
                </label>
                <button
                  type="button"
                  onClick={() => setShowIdHelp((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs text-cream/45 transition hover:text-cream/80"
                >
                  <InfoIcon className="h-3.5 w-3.5" />
                  在哪里找 ID？
                  <CaretDownIcon
                    className={`h-3 w-3 transition-transform ${
                      showIdHelp ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {showIdHelp ? (
                <div className="mb-3 animate-fade-up rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-xs leading-relaxed text-cream/65">
                  <p className="font-medium text-cream/85">如何查看自己的豆瓣 ID：</p>
                  <ol className="mt-1.5 list-decimal space-y-1 pl-4">
                    <li>打开豆瓣 App，点右下角「我的」</li>
                    <li>在头像与昵称下方，能看到一行「ID：xxxxxxxx」，那串数字/字母就是你的 ID</li>
                    <li>把它填进上面的输入框即可；也可以直接粘贴你的豆瓣主页链接</li>
                  </ol>
                  <p className="mt-2 text-cream/40">
                    注意：需要把豆瓣「看过」列表设为公开，我们才能读取。
                  </p>
                </div>
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/35" />
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !busy && input.trim()) loadProfile();
                    }}
                    placeholder="例如 131506726 或主页链接"
                    className="w-full rounded-xl border border-white/[0.1] bg-night-900 py-2.5 pl-9 pr-4 text-sm text-cream outline-none transition placeholder:text-cream/30 focus:border-siff focus:ring-2 focus:ring-siff/25"
                  />
                </div>
                <button
                  onClick={loadProfile}
                  disabled={busy || !input.trim()}
                  className="shrink-0 rounded-xl border border-white/[0.12] bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-cream transition hover:bg-white/[0.12] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {stage === "loadingProfile" ? "读取中…" : "读取记录"}
                </button>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-cream/40">
                我们只读取公开的「看过」记录，不保存任何数据。为避免触发豆瓣的访问限制，默认分析你最近约
                450 部观影记录（足以刻画口味）。
                {stage === "loadingProfile" ? " 读取中，请稍候…" : ""}
              </p>

              {profile ? (
                <div className="mt-4 animate-fade-up rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-cream">
                        {profile.displayName}
                      </p>
                      <p className="text-xs text-cream/45">
                        看过 {profile.totalWatched} 部 · 已读取 {profile.movies.length} 部
                      </p>
                    </div>
                  </div>
                  {profile.truncated === "throttle" ? (
                    <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-gold/10 px-2.5 py-1.5 text-[11px] text-gold/90">
                      <WarningCircleIcon className="h-3.5 w-3.5 shrink-0" />
                      豆瓣临时限流，仅读取到部分记录。推荐仍可生成，如需更全可稍后重试。
                    </p>
                  ) : profile.truncated === "cap" ? (
                    <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-cream/45">
                      <InfoIcon className="h-3.5 w-3.5 shrink-0" />
                      已分析最近 {profile.movies.length} 部（共 {profile.totalWatched}{" "}
                      部），用最近的观影足够看懂你的口味。
                    </p>
                  ) : null}
                  {ratedSample && ratedSample.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {ratedSample.map((m) => (
                        <span
                          key={m.subjectId}
                          className="rounded-md bg-white/[0.05] px-2 py-1 text-xs text-cream/60"
                        >
                          {m.title}
                          {m.rating ? (
                            <span className="ml-1 text-gold">★{m.rating}</span>
                          ) : null}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-cream">
                  <HeartIcon weight="fill" className="h-4 w-4 text-siff" />
                  你喜欢的电影
                </label>
                <textarea
                  value={liked}
                  onChange={(e) => setLiked(e.target.value)}
                  rows={5}
                  placeholder={"每行一部，或用逗号分隔\n例如：\n花样年华\n重庆森林\n爱在黎明破晓前"}
                  className="w-full resize-none rounded-xl border border-white/[0.1] bg-night-900 px-3.5 py-2.5 text-sm text-cream outline-none transition placeholder:text-cream/30 focus:border-siff focus:ring-2 focus:ring-siff/25"
                />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-cream">
                  <ThumbsDownIcon className="h-4 w-4 text-cream/50" />
                  你不喜欢的电影
                  <span className="text-xs font-normal text-cream/35">（选填）</span>
                </label>
                <textarea
                  value={disliked}
                  onChange={(e) => setDisliked(e.target.value)}
                  rows={5}
                  placeholder={"想避开的类型 / 影片\n例如：\n某部你看不下去的片"}
                  className="w-full resize-none rounded-xl border border-white/[0.1] bg-night-900 px-3.5 py-2.5 text-sm text-cream outline-none transition placeholder:text-cream/30 focus:border-siff focus:ring-2 focus:ring-siff/25"
                />
              </div>
            </div>
          )}

          {error ? (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-siff/25 bg-siff/[0.08] px-4 py-3 text-sm text-siff-bright">
              <WarningCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <button
            onClick={recommend}
            disabled={busy || !canRecommend}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-siff px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-siff/20 transition hover:bg-siff-bright active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            <SparkleIcon weight="fill" className="h-4 w-4" />
            {stage === "recommending" ? "AI 选片中…" : "生成上影节推荐"}
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {stage === "recommending" ? (
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="shimmer h-64 rounded-2xl border border-white/[0.06] bg-night-850/60"
            />
          ))}
        </div>
      ) : null}

      {/* Results */}
      {result && stage !== "recommending" ? (
        <section className="mt-10">
          {result.tasteProfile ? (
            <div className="mb-6 overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-siff/[0.12] via-night-850 to-night-850 p-6">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-siff-bright">
                你的观影口味
              </p>
              <p className="mt-2 text-lg leading-relaxed text-cream">
                {result.tasteProfile}
              </p>
            </div>
          ) : null}

          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-xl font-semibold text-cream">
              为你精选 {result.recommendations.length} 部
            </h2>
            <span className="text-xs text-cream/35">{result.provider}</span>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {result.recommendations.map((rec, i) => (
              <FilmCard key={rec.filmId} rec={rec} rank={i + 1} />
            ))}
          </div>

          {!result.recommendations.length ? (
            <p className="text-sm text-cream/45">
              暂时没匹配到合适的影片，换个账号或多填几部喜欢的电影试试。
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
