# SIFF Movie Recommender · 上影节智能选片

[English](#english) · [中文](#中文)

**Live demo (Cloudflare):** https://siff-recommender.judexuhs.workers.dev  
**Repository:** https://github.com/judexuhs/siff-movie

---

## English

### What is this?

A **self-hostable** web app that recommends films from the **Shanghai International Film Festival (SIFF)** based on your taste — using your **Douban “watched” history** or **manual likes/dislikes**, plus an **OpenAI-compatible LLM** (DeepSeek, Moonshot, Qwen, OpenAI, etc.).

Why self-host? Douban may **rate-limit or block** automated access (especially from cloud datacenter IPs). Running the app **on your own machine or account** lets you use a **local HTTP proxy**, your own API key, and optional Douban cookie — which often works better than a shared public deployment.

### Features

- Fetches the full SIFF schedule (films + screenings) from official sources
- Reads a user’s **public** Douban “watched” list (paginated, with polite delays)
- **Manual taste input** if you don’t want to use Douban
- AI-ranked recommendations with reasons, match scores, and showtimes
- **Pages**
  - `/` — AI recommendations from your taste
  - `/films` — poster wall with filters
  - `/films/detail` — full film cards (synopsis, metadata, all screenings)
  - `/cinemas` — schedule grouped by cinema; tap a row to expand synopsis
  - `/watchlist` — **local watchlist** (no login; per-screening granularity)
- **Local watchlist** — bookmark specific screenings in `localStorage`; nav shows count badge
- **Sticky filters** collapse on scroll (search + summary stay visible; “筛选” to reopen)
- Douban links per film (cached mapping + search fallback)
- Dark, poster-forward UI

### Quick start (local)

**Requirements:** Node.js 18+ (20+ recommended), npm

```bash
git clone https://github.com/judexuhs/siff-movie.git
cd siff-movie
npm install

# 1. Configure YOUR API key (never commit this file)
cp .env.example .env.local
# Edit .env.local — set AI_API_KEY at minimum

# 2. Run
npm run dev
```

Open http://localhost:3000

### API key configuration (required)

| File | Purpose |
|------|---------|
| `.env.example` | Template committed to the repo — **no real secrets** |
| `.env.local` | **Your** local secrets — **gitignored**, create this yourself |

Minimum variable:

```env
AI_API_KEY=sk-your-key-here
```

Optional (defaults target DeepSeek):

```env
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
AI_PROVIDER=deepseek
```

### Douban access & anti-scraping

- Only **public** “watched” lists are supported.
- By default we read about the **most recent ~450 titles** (30 pages) to reduce block risk; enough for taste profiling.
- If Douban blocks you locally, try in `.env.local`:
  - `DOUBAN_PROXY=http://127.0.0.1:8118` (Clash / similar HTTP proxy)
  - `DOUBAN_COOKIE=...` (logged-in cookie, optional)

Cloudflare Workers **cannot** use `127.0.0.1` proxies; self-hosting locally or on a VPS with proxy is more reliable for Douban.

### Local watchlist

- No account required; data is stored in the browser under `siff-watchlist-v1`.
- Each entry is **one screening** (date, time, cinema), not just the film.
- Use the **bookmark** button on screening rows (recommendations, film detail, cinema schedule).
- Clearing site data or switching browsers removes the list.

### Optional: enrich Douban links for all SIFF films

```bash
npm run enrich:douban
```

Writes `data/douban-links.json` (resumable, rate-limit aware).

### Deploy to Cloudflare Workers (optional)

```bash
npx wrangler login
# Add account_id to wrangler.jsonc or set CLOUDFLARE_ACCOUNT_ID
npm run cf:secrets   # uploads AI_API_KEY from .env.local
npm run deploy:cf
```

Public URL is shown after deploy (e.g. `https://siff-recommender.<subdomain>.workers.dev`).

### Tech stack

Next.js 14 · TypeScript · Tailwind CSS · OpenNext (Cloudflare)

### License

MIT — use and modify freely; no warranty. SIFF/Douban data belong to their respective owners; use responsibly.

---

## 中文

### 这是什么？

一个可**自行部署**的网站：根据你在**豆瓣「看过」**或**手动填写的喜好/避雷片单**，从**上海国际电影节（SIFF）**官方排片里，用 **OpenAI 兼容的大模型 API** 帮你筛出最对胃口的几部，并附上**场次、影院**和**豆瓣链接**。

**在线演示：** https://siff-recommender.judexuhs.workers.dev  

为什么建议自己部署？豆瓣对自动化访问有**反爬和限流**（云服务器 IP 更容易被封）。在自己电脑或自己的服务器上跑，可以配**本地代理**、**自己的 API Key**、可选 **Cookie**，往往比公用演示站更稳定。

### 功能

- 拉取本届上影节全部影片与排片
- 读取豆瓣**公开**「看过」列表（分页、限速、重试）
- 支持**不用豆瓣**，手动填写喜欢/讨厌的电影
- AI 推荐：契合度、较长推荐理由、排片列表
- **页面**
  - `/` 智能推荐
  - `/films` 海报墙（单元/地区/搜索筛选）
  - `/films/detail` 影片详览（简介、元信息、全部场次）
  - `/cinemas` 影院排片（按影院分组；点击场次可展开简介）
  - `/watchlist` **我的片单**（无需登录，按场次收藏）
- **本地片单** — 场次旁书签按钮加入；导航显示数量；数据存在浏览器 `localStorage`
- **筛选栏** — 向下滚动自动收起标签区，保留搜索与统计，可点「筛选」再展开
- 影片关联豆瓣（缓存匹配 + 搜索兜底）
- 暗色影院风界面

### 本地快速开始

**环境：** Node.js 18+（建议 20+）、npm

```bash
git clone https://github.com/judexuhs/siff-movie.git
cd siff-movie
npm install

# 1. 配置你自己的 API Key（不要提交到 Git）
cp .env.example .env.local
# 编辑 .env.local，至少填写 AI_API_KEY

# 2. 启动
npm run dev
```

浏览器打开 http://localhost:3000

### API Key 配置（必填）

| 文件 | 说明 |
|------|------|
| `.env.example` | 仓库里的**模板**，不含真实密钥 |
| `.env.local` | **你本地**的密钥，已在 `.gitignore` 中，需自行创建 |

最少填写：

```env
AI_API_KEY=sk-你的密钥
```

可选（默认 DeepSeek）：

```env
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
AI_PROVIDER=deepseek
```

### 豆瓣抓取与反爬说明

- 仅支持**公开**的「看过」列表。
- 默认只读最近约 **450 部**（30 页），降低被封概率；对口味画像通常足够。
- 若本地读豆瓣失败，可在 `.env.local` 尝试：
  - `DOUBAN_PROXY=http://127.0.0.1:8118`（Clash 等 HTTP 代理）
  - `DOUBAN_COOKIE=...`（登录后 Cookie，可选）

部署到 Cloudflare 时**无法**使用本机 `127.0.0.1` 代理；豆瓣相关功能建议**本地自托管**或自备可访问豆瓣的网络环境。

### 本地片单

- 无需登录；键名 `siff-watchlist-v1`，仅存于当前浏览器。
- 收藏粒度是**具体一场**（日期、时间、影院），不是整部影片。
- 在推荐结果、影片详览、影院排片的场次行旁点击**书签**即可加入。
- 清空浏览器网站数据或换设备会丢失片单。

### 可选：批量匹配豆瓣条目

```bash
npm run enrich:douban
```

结果保存在 `data/douban-links.json`，可中断后继续。

### 部署到 Cloudflare Workers（可选）

```bash
npx wrangler login
# 在 wrangler.jsonc 填写 account_id，或设置环境变量 CLOUDFLARE_ACCOUNT_ID
npm run cf:secrets   # 从 .env.local 上传 AI_API_KEY
npm run deploy:cf
```

部署成功后会输出 Workers 访问地址。

### 技术栈

Next.js 14 · TypeScript · Tailwind CSS · OpenNext（Cloudflare）

### 免责声明

MIT 开源。上影节/豆瓣数据版权归各自所有；请合理使用，勿高频爬取。推荐结果由 AI 生成，仅供参考。

---

## Project structure · 项目结构

```
src/
  app/
    page.tsx              # AI recommendations
    films/                # poster wall + detail
    cinemas/              # cinema schedule
    watchlist/            # local watchlist page
    api/                  # douban, recommend, siff, poster
  components/
    watchlist/            # provider, toggle, list UI
    cinemas/              # cinema schedule rows
    films/                # browser, detail cards, modal
    CollapsibleFilterBar.tsx
  lib/
    siff.ts, douban.ts, recommend.ts, schedule.ts, watchlist.ts, ...
scripts/
  enrich-douban.mjs
  cf-sync-secrets.sh
data/
  douban-links.json       # optional enrichment cache
.env.example
wrangler.jsonc            # Cloudflare Workers (OpenNext)
```

## Contributing

Issues and PRs welcome at https://github.com/judexuhs/siff-movie
