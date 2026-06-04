import Link from "next/link";
import { FilmReelIcon } from "@phosphor-icons/react/dist/ssr";

export function SiteHeader({ active }: { active?: "home" | "films" }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-night-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-screen items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <FilmReelIcon weight="fill" className="h-6 w-6 text-siff" />
          <span className="text-[15px] font-semibold tracking-tight text-cream">
            上影节<span className="text-siff">选片</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/"
            className={`rounded-lg px-3 py-1.5 transition ${
              active === "home"
                ? "bg-white/[0.06] text-cream"
                : "text-cream/55 hover:text-cream"
            }`}
          >
            智能推荐
          </Link>
          <Link
            href="/films"
            className={`rounded-lg px-3 py-1.5 transition ${
              active === "films"
                ? "bg-white/[0.06] text-cream"
                : "text-cream/55 hover:text-cream"
            }`}
          >
            全部影片
          </Link>
        </nav>
      </div>
    </header>
  );
}
