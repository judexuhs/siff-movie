/**
 * Image proxy for SIFF posters. The poster host (obs.siff.com) returns 403
 * unless the request carries a siff.com Referer, and the source URLs contain
 * unencoded spaces/CJK characters. We proxy through here so the browser can
 * render them, and cache aggressively since posters are immutable.
 */

const ALLOWED_HOSTS = new Set(["obs.siff.com", "www.siff.com"]);

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("u");
  if (!raw) return new Response("missing url", { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("bad url", { status: 400 });
  }
  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
    return new Response("host not allowed", { status: 403 });
  }

  // Re-encode the path so spaces / CJK characters are valid in the request.
  const encoded = `${target.origin}${target.pathname
    .split("/")
    .map((seg) => encodeURIComponent(decodeURIComponent(seg)))
    .join("/")}${target.search}`;

  const upstream = await fetch(encoded, {
    headers: {
      Referer: "https://www.siff.com/",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    },
  });

  if (!upstream.ok || !upstream.body) {
    return new Response("upstream error", { status: 502 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
