import Link from "next/link";
import { FilmReelIcon } from "@phosphor-icons/react/dist/ssr";
import { WatchlistNavLink } from "@/components/watchlist/WatchlistNavLink";

export type NavActive = "home" | "films" | "films-detail" | "cinemas" | "watchlist";

const NAV: { href: string; label: string; key: NavActive }[] = [
  { href: "/", label: "智能推荐", key: "home" },
  { href: "/films", label: "海报墙", key: "films" },
  { href: "/films/detail", label: "影片详览", key: "films-detail" },
  { href: "/cinemas", label: "影院排片", key: "cinemas" },
];

export function SiteHeader({ active }: { active?: NavActive }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-night-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-screen items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <FilmReelIcon weight="fill" className="h-6 w-6 text-siff" />
          <span className="text-[15px] font-semibold tracking-tight text-cream">
            上影节<span className="text-siff">选片</span>
          </span>
        </Link>
        <nav className="flex max-w-[70vw] items-center gap-0.5 overflow-x-auto text-sm sm:max-w-none sm:gap-1">
          {NAV.map(({ href, label, key }) => (
            <Link
              key={key}
              href={href}
              className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 transition sm:px-3 ${
                active === key
                  ? "bg-white/[0.06] text-cream"
                  : "text-cream/55 hover:text-cream"
              }`}
            >
              {label}
            </Link>
          ))}
          <WatchlistNavLink active={active === "watchlist"} />
        </nav>
      </div>
    </header>
  );
}
