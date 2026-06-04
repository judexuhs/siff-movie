import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "上影节观影推荐 · 基于你的豆瓣口味",
  description:
    "根据你在豆瓣看过的电影，从上海国际电影节排片中智能推荐最适合你的影片。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased min-h-screen selection:bg-siff/30 selection:text-cream">
        <div className="backdrop-glow" aria-hidden />
        <div className="vignette" aria-hidden />
        <div className="grain" aria-hidden />
        {children}
      </body>
    </html>
  );
}
