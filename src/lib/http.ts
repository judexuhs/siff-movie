import { NextResponse } from "next/server";

export function ok<T>(data: T) {
  return NextResponse.json({ ok: true, data });
}

export function fail(message: string, status = 400, code?: string) {
  return NextResponse.json({ ok: false, error: message, code }, { status });
}

/** Maps a thrown error to a user-friendly JSON response. */
export function handleError(err: unknown) {
  const message = err instanceof Error ? err.message : "服务器内部错误";
  const code = (err as { code?: string })?.code;
  // Auth/config issues should surface as 400 so the UI can guide the user.
  const status = code === "NO_API_KEY" ? 400 : 500;
  return fail(message, status, code);
}
