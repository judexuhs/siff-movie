import { SiteHeader } from "@/components/SiteHeader";
import { WatchlistView } from "@/components/watchlist/WatchlistView";

export const metadata = {
  title: "我的片单 · 上影节选片",
};

export default function WatchlistPage() {
  return (
    <>
      <SiteHeader active="watchlist" />
      <main className="mx-auto max-w-screen px-5 py-10 sm:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-cream">
            我的片单
          </h1>
          <p className="mt-1.5 text-sm text-cream/50">
            按场次收藏想看的放映，无需登录；数据仅保存在当前浏览器的本地存储中。
          </p>
        </div>
        <WatchlistView />
      </main>
    </>
  );
}
