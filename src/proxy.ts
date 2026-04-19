import { timingSafeEqual } from "node:crypto";
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

/**
 * Timing-sichere Gleichheit zweier Strings. Unterschiedliche Längen werden auf
 * Buffer gleicher Länge gepadded, damit `timingSafeEqual` kein `RangeError`
 * wirft und kein Längen-Leak entsteht.
 */
function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  const len = Math.max(aBuf.length, bBuf.length);
  const aPad = Buffer.alloc(len);
  const bPad = Buffer.alloc(len);
  aBuf.copy(aPad);
  bBuf.copy(bPad);
  const ok = timingSafeEqual(aPad, bPad);
  return ok && aBuf.length === bBuf.length;
}

function skipBasicAuthInDevelopment(): boolean {
  return (
    process.env.NODE_ENV === "development" && process.env.ADMIN_SKIP_BASIC_AUTH_IN_DEV === "1"
  );
}

/** Eingebettete Browser (z. B. Cursor Simple Browser) zeigen bei 401 oft keine Basic-Auth-UI — nur weiße Fläche. */
function adminAuthHtmlPage(status: number, title: string, body: string, wwwAuthenticate?: string): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; color: #111; }
    code { background: #f4f4f5; padding: 0.1em 0.35em; border-radius: 4px; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${body}
</body>
</html>`;
  const headers: Record<string, string> = { "Content-Type": "text/html; charset=utf-8" };
  if (wwwAuthenticate) {
    headers["WWW-Authenticate"] = wwwAuthenticate;
  }
  return new NextResponse(html, { status, headers });
}

export function proxy(request: NextRequest) {
  if (skipBasicAuthInDevelopment()) {
    return NextResponse.next();
  }

  const expectedPassword = process.env.ADMIN_PASSWORD?.trim();
  if (!expectedPassword) {
    return adminAuthHtmlPage(
      503,
      "Admin nicht konfiguriert",
      `<p>Setze <code>ADMIN_PASSWORD</code> in <code>.env.local</code>, um <code>/admin</code> und <code>/api/admin</code> zu nutzen.</p>`,
    );
  }

  const expectedUsername = process.env.ADMIN_USERNAME?.trim() || "admin";
  const parsed = parseBasicAuth(request.headers.get("authorization"));
  if (!parsed) {
    return adminAuthHtmlPage(
      401,
      "Admin: Anmeldung nötig",
      `<p>HTTP-Basic-Auth: Nutzername (Standard <code>admin</code>) und Passwort aus <code>ADMIN_PASSWORD</code>.</p>
      <p><strong>Cursor / eingebetteter Browser:</strong> Oft erscheint hier kein Login-Dialog (weiße Seite). Dann im normalen Browser öffnen oder in <code>.env.local</code> für <strong>nur Entwicklung</strong> setzen:</p>
      <p><code>ADMIN_SKIP_BASIC_AUTH_IN_DEV=1</code></p>`,
      'Basic realm="Admin Area"',
    );
  }

  const userOk = safeEqual(parsed.username, expectedUsername);
  const passOk = safeEqual(parsed.password, expectedPassword);
  if (!(userOk && passOk)) {
    return adminAuthHtmlPage(
      401,
      "Admin: Zugang verweigert",
      `<p>Benutzername oder Passwort ist falsch.</p>
      <p>In eingebetteten Browsern: siehe Hinweise unter „Admin: Anmeldung nötig“ (nach erneutem Aufruf ohne gespeicherte Zugangsdaten).</p>`,
      'Basic realm="Admin Area"',
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
