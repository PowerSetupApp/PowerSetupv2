import * as z from "zod";

import { getGenerateLimiter } from "@/lib/ratelimit";
import { GenerateResultError, runGenerateForResultId } from "@/lib/results/generate-for-result";

type RouteContext = { params: Promise<{ id: string }> };

function clientKey(request: Request, id: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `${ip}:${id}`;
}

export async function POST(request: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) {
    return Response.json({ error: "Ungültige ID" }, { status: 400 });
  }

  const decision = getGenerateLimiter().consume(clientKey(request, id));
  if (!decision.ok) {
    return Response.json(
      { error: "Zu viele Anfragen. Bitte kurz warten." },
      { status: 429, headers: { "Retry-After": String(decision.retryAfterSeconds) } },
    );
  }

  try {
    const outcome = await runGenerateForResultId(id);
    const status = outcome.status === "already-pending" ? 202 : 200;
    return Response.json(outcome, { status });
  } catch (e) {
    if (e instanceof GenerateResultError) {
      return Response.json({ error: e.message }, { status: e.status });
    }
    if (process.env.NODE_ENV !== "test") {
      console.error("[api/generate] unhandled", e);
    }
    return Response.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
