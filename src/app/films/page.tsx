import { SiteHeader } from "@/components/SiteHeader";
import { FilmBrowser } from "@/components/films/FilmBrowser";
import { getSiffFilms } from "@/lib/siff";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "全部影片 · 上影节选片",
};

export default async function FilmsPage() {
  let films: Awaited<ReturnType<typeof getSiffFilms>> = [];
  let error = "";
  try {
    films = await getSiffFilms();
  } catch (e) {
    error = e instanceof Error ? e.message : "加载失败";
  }

  return (
    <>
      <SiteHeader active="films" />
      <main className="mx-auto max-w-screen px-5 py-10 sm:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-cream">
            全部上影节影片
          </h1>
          <p className="mt-1.5 text-sm text-cream/50">
            浏览本届完整片单，点击任意影片查看简介、排片与豆瓣链接。
          </p>
        </div>

        {error ? (
          <p className="rounded-xl border border-siff/25 bg-siff/[0.08] px-4 py-3 text-sm text-siff-bright">
            {error}
          </p>
        ) : (
          <FilmBrowser films={films} />
        )}
      </main>
    </>
  );
}
