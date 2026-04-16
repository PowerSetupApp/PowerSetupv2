import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function parseBasicAuth(header: string | null): { username: string; password: string } | null {
  if (!header?.startsWith("Basic ")) return null;
  try {
    const decoded = atob(header.slice(6));
    const colon = decoded.indexOf(":");
    if (colon === -1) return null;
    return {
      username: decoded.slice(0, colon),
      password: decoded.slice(colon + 1),
    };
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    return new NextResponse(
      "ADMIN_PASSWORD is not set. Configure it in .env.local for /admin and /api/admin.",
      { status: 503 },
    );
  }

  const expectedUsername = process.env.ADMIN_USERNAME ?? "admin";
  const parsed = parseBasicAuth(request.headers.get("authorization"));
  if (!parsed) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Admin Area"' },
    });
  }

  if (parsed.username !== expectedUsername || parsed.password !== expectedPassword) {
    return new NextResponse("Invalid credentials", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Admin Area"' },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
