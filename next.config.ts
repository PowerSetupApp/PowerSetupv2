import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Absolute app root (directory containing this file). Turbopack otherwise may infer a wrong root when nested lockfiles exist (e.g. under `docs/`), which triggers "Next.js package not found" panics. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const isDev = process.env.NODE_ENV === "development";
/** VS Code / Cursor Simple Browser & lokale `next start`-Vorschau (iframe). Siehe Kommentar bei CSP. */
const allowEmbeddedPreview = isDev || process.env.ALLOW_EMBEDDED_PREVIEW === "1";

/**
 * Sicherheits-Header — auf alle Routen (inkl. Admin + API).
 *
 * CSP: In **Produktion** kein `unsafe-eval`. In **Entwicklung** setzt React
 * (Strict Mode / DevTools) `eval()` für Stack-Rekonstruktion voraus — ohne
 * `'unsafe-eval'` in `script-src` erscheint die Browser-Konsole-Warnung und
 * Teile des Dev-UX brechen. Produktions-Builds bleiben streng.
 *
 * `unsafe-inline` für Styles: Tailwind/JIT in Next 16. `connect-src` listet
 * AI-Hosts für clientseitige Fetches (serverseitige Calls sind unabhängig).
 */
function buildContentSecurityPolicy(): string {
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";

  const directives = [
    "default-src 'self'",
    "img-src 'self' data: blob: https:",
    "style-src 'self' 'unsafe-inline'",
    scriptSrc,
    "connect-src 'self' https://generativelanguage.googleapis.com https://api.openai.com",
    "font-src 'self' data:",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];

  // VS Code / Cursor „Simple Browser“ rendert oft in einem iframe. Mit
  // `X-Frame-Options: DENY` + `frame-ancestors 'none'` bleibt die Seite dort leer.
  // In Entwicklung (und optional mit ALLOW_EMBEDDED_PREVIEW=1 bei lokalem `next start`)
  // erlauben wir explizit Einbettung; Produktion bleibt ohne diese Variable streng.
  if (allowEmbeddedPreview) {
    directives.push("frame-ancestors *");
  } else {
    directives.splice(6, 0, "frame-ancestors 'none'");
  }

  return directives.join("; ");
}

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
  // HSTS nur in Produktion (lokales http://localhost).
  ...(isDev
    ? []
    : ([{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] as const)),
  ...(allowEmbeddedPreview ? [] : ([{ key: "X-Frame-Options", value: "DENY" }] as const)),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
] as { key: string; value: string }[];

const nextConfig: NextConfig = {
  cacheComponents: true,
  turbopack: {
    root: projectRoot,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
