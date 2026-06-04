import { RecommenderApp } from "@/components/RecommenderApp";
import { SiteHeader } from "@/components/SiteHeader";
import { PosterMarquee } from "@/components/PosterMarquee";
import { getSiffFilms } from "@/lib/siff";

export const dynamic = "force-dynamic";

export default async function Home() {
  let films: Awaited<ReturnType<typeof getSiffFilms>> = [];
  try {
    films = await getSiffFilms();
  } catch {
    films = [];
  }
  const screenings = films.reduce((n, f) => n + f.screenings.length, 0);

  return (
    <>
      <SiteHeader active="home" />

      <section className="relative mx-auto max-w-screen px-5 pt-16 sm:px-8 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-3.5 py-1 text-xs tracking-wide text-cream/60">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-siff" />
            上海国际电影节 · 你的私人策展人
          </p>
          <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-cream sm:text-[3.75rem]">
            一整届上影节，
            <br />
            <span className="text-siff">为你收成一张片单。</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-cream/55 sm:text-lg">
            读懂你在豆瓣留下的观影偏好，从{" "}
            <span className="font-medium text-cream/75">
              {films.length || "全部"} 部
            </span>{" "}
            排片中替你筛掉噪音，只留下最对胃口的几部——附上每一场的时间、影院与豆瓣资料。
          </p>
        </div>
      </section>

      {films.length ? (
        <div className="mt-12">
          <PosterMarquee films={films} />
        </div>
      ) : (
        <div className="h-8" />
      )}

      <div className="mt-12">
        <RecommenderApp />
      </div>

      <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-cream/35">
        <p>
          {films.length ? `${films.length} 部影片 · ${screenings} 场放映 · ` : ""}
          数据来自上海国际电影节官网与豆瓣公开记录
        </p>
        <p className="mt-1">推荐由 AI 生成，仅供参考</p>
      </footer>
    </>
  );
}
