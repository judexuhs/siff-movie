import { getSiffFilms } from "@/lib/siff";
import { handleError, ok } from "@/lib/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  try {
    const force = new URL(req.url).searchParams.get("refresh") === "1";
    const films = await getSiffFilms(force);
    return ok(films);
  } catch (err) {
    return handleError(err);
  }
}
