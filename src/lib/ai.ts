/**
 * Provider-agnostic chat client targeting any OpenAI-compatible
 * `/chat/completions` endpoint (DeepSeek, Moonshot, Qwen, OpenAI, ...).
 *
 * Configure entirely through environment variables so the provider can be
 * swapped without touching code:
 *   AI_API_KEY   - required
 *   AI_BASE_URL  - e.g. https://api.deepseek.com/v1  (default: DeepSeek)
 *   AI_MODEL     - e.g. deepseek-chat                 (default: deepseek-chat)
 *   AI_PROVIDER  - label for display only             (default: deepseek)
 */

export interface AiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: string;
}

export class AiError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = "AiError";
  }
}

const DEFAULTS = {
  baseUrl: "https://api.deepseek.com/v1",
  model: "deepseek-chat",
  provider: "deepseek",
};

export function getAiConfig(): AiConfig {
  const apiKey = process.env.AI_API_KEY?.trim();
  if (!apiKey) {
    throw new AiError(
      "未配置 AI API Key。请在 .env.local 中设置 AI_API_KEY（默认使用 DeepSeek）。",
      "NO_API_KEY"
    );
  }
  return {
    apiKey,
    baseUrl: (process.env.AI_BASE_URL?.trim() || DEFAULTS.baseUrl).replace(
      /\/$/,
      ""
    ),
    model: process.env.AI_MODEL?.trim() || DEFAULTS.model,
    provider: process.env.AI_PROVIDER?.trim() || DEFAULTS.provider,
  };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  jsonMode?: boolean;
  maxTokens?: number;
}

/** Calls the chat completions endpoint and returns the assistant text. */
export async function chat(
  messages: ChatMessage[],
  options: ChatOptions = {},
  config: AiConfig = getAiConfig()
): Promise<string> {
  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    temperature: options.temperature ?? 0.7,
    stream: false,
  };
  if (options.jsonMode) body.response_format = { type: "json_object" };
  if (options.maxTokens) body.max_tokens = options.maxTokens;

  let res: Response;
  try {
    res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new AiError(
      `无法连接 AI 服务 (${config.baseUrl}): ${
        err instanceof Error ? err.message : String(err)
      }`,
      "NETWORK"
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AiError(
      `AI 服务返回错误 ${res.status}: ${text.slice(0, 300)}`,
      "HTTP_ERROR"
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new AiError("AI 服务返回了空结果", "EMPTY");
  return content;
}
