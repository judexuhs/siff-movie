import { fetchWatchHistory } from "@/lib/douban";
import { handleError, ok } from "@/lib/http";

export const dynamic = "force-dynamic";
// Capped at ~30 pages; allow headroom for retry backoffs under throttling.
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const { input } = (await req.json()) as { input?: string };
    if (!input || !input.trim()) {
      return ok(null);
    }
    const profile = await fetchWatchHistory(input);
    return ok(profile);
  } catch (err) {
    return handleError(err);
  }
}
