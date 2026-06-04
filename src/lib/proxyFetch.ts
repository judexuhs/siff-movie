import "server-only";
import { ProxyAgent, fetch as undiciFetch, type RequestInit as UndiciRequestInit } from "undici";

const agentCache = new Map<string, ProxyAgent>();

/** Whether the URL should use the Douban proxy (movie.douban.com, www.douban.com, img*.doubanio.com). */
function isDoubanHost(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host.includes("douban.com") || host.includes("doubanio.com");
  } catch {
    return false;
  }
}

/**
 * Resolve proxy URL for an outbound request.
 * - DOUBAN_PROXY: only for douban.* hosts (recommended for Clash HTTP 8118)
 * - HTTPS_PROXY / HTTP_PROXY: all outbound server fetches when set
 */
function resolveProxy(url: string): string | undefined {
  const doubanProxy = process.env.DOUBAN_PROXY?.trim();
  if (doubanProxy && isDoubanHost(url)) {
    return normalizeProxyUrl(doubanProxy);
  }
  const global = process.env.HTTPS_PROXY?.trim() || process.env.HTTP_PROXY?.trim();
  if (global) return normalizeProxyUrl(global);
  return undefined;
}

function normalizeProxyUrl(raw: string): string {
  if (/^https?:\/\//i.test(raw)) return raw;
  return `http://${raw}`;
}

function getAgent(proxyUrl: string): ProxyAgent {
  let agent = agentCache.get(proxyUrl);
  if (!agent) {
    agent = new ProxyAgent(proxyUrl);
    agentCache.set(proxyUrl, agent);
  }
  return agent;
}

/**
 * Server-side fetch with optional HTTP proxy from env.
 * Local dev: HTTP_PROXY=http://127.0.0.1:8118 (Clash 等).
 * Cloudflare Workers 无法使用 127.0.0.1 代理，线上请勿配置本地地址。
 */
export async function proxyFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const proxy = resolveProxy(url);
  if (!proxy) {
    return fetch(url, init);
  }

  const agent = getAgent(proxy);
  const undiciInit: UndiciRequestInit = {
    method: init?.method,
    headers: init?.headers as UndiciRequestInit["headers"],
    body: init?.body as UndiciRequestInit["body"],
    redirect: init?.redirect,
    signal: init?.signal,
    dispatcher: agent,
  };
  const res = await undiciFetch(url, undiciInit);
  return res as unknown as Response;
}
