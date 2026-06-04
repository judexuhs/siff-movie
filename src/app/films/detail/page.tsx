import { SiteHeader } from "@/components/SiteHeader";
import { FilmDetailList } from "@/components/films/FilmDetailList";
import { getSiffFilms } from "@/lib/siff";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "影片详览 · 上影节选片",
};

export default async function FilmsDetailPage() {
  let films: Awaited<ReturnType<typeof getSiffFilms>> = [];
  let error = "";

  try {
    films = await getSiffFilms();
  } catch (e) {
    error = e instanceof Error ? e.message : "加载失败";
  }

  return (
    <>
      <SiteHeader active="films-detail" />
      <main className="mx-auto max-w-screen px-5 py-10 sm:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-cream">
            影片详览
          </h1>
          <p className="mt-1.5 text-sm text-cream/50">
            每部影片完整展开：简介、元信息与全部场次，无需点开弹窗。
          </p>
        </div>

        {error ? (
          <p className="rounded-xl border border-siff/25 bg-siff/[0.08] px-4 py-3 text-sm text-siff-bright">
            {error}
          </p>
        ) : (
          <FilmDetailList films={films} />
        )}
      </main>
    </>
  );
}
