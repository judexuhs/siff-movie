import { SiteHeader } from "@/components/SiteHeader";
import { CinemaScheduleView } from "@/components/cinemas/CinemaSchedule";
import { buildCinemaSchedules } from "@/lib/schedule";
import { getSiffFilms } from "@/lib/siff";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "影院排片 · 上影节选片",
};

export default async function CinemasPage() {
  let schedules: ReturnType<typeof buildCinemaSchedules> = [];
  let error = "";

  try {
    const films = await getSiffFilms();
    schedules = buildCinemaSchedules(films);
  } catch (e) {
    error = e instanceof Error ? e.message : "加载失败";
  }

  return (
    <>
      <SiteHeader active="cinemas" />
      <main className="mx-auto max-w-screen px-5 py-10 sm:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-cream">
            按影院看排片
          </h1>
          <p className="mt-1.5 text-sm text-cream/50">
            每家影院内的场次按日期与时间顺序排列，一眼看清何时在哪看哪部片。
          </p>
        </div>

        {error ? (
          <p className="rounded-xl border border-siff/25 bg-siff/[0.08] px-4 py-3 text-sm text-siff-bright">
            {error}
          </p>
        ) : (
          <CinemaScheduleView schedules={schedules} />
        )}
      </main>
    </>
  );
}
