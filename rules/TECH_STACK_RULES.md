# Tech Stack Regeln

## Stack-Übersicht
| Bereich | Technologie |
|---------|-------------|
| Framework | Next.js 16.1 (App Router) |
| Sprache | TypeScript |
| Styling | TailwindCSS + shadcn/ui |
| Datenbank | PostgreSQL + Prisma |
| KI | Google Gemini (primär), OpenAI (Fallback) |
| PDF | Puppeteer + @sparticuz/chromium |
| Zahlung | PayPal |
| Hosting | Vercel |
| i18n | next-intl oder next-i18next |

## Frontend-Regeln
- **Server Components** als Default
- **Server Actions** für Mutations
- **React Hook Form** für Formulare
- **Zustand** oder Context für Global State
- **URL State** für Wizard-Schritte

## API-Struktur
```
/api/
  ├── results/      POST, GET, PATCH
  ├── products/     GET (filtern)
  ├── calculate/    POST (KI-Berechnung)
  ├── schematic/    POST (PDF generieren)
  └── payments/     create-order, capture-order
```

## Ordnerstruktur
```
app/
  ├── (marketing)/page.tsx    # Landing Page
  ├── wizard/[[...step]]/     # Formular Steps
  ├── result/[id]/            # Ergebnis-Seite
  └── api/
components/
  ├── ui/                     # shadcn/ui
  ├── wizard/                 # Formular-Komponenten
  └── result/                 # Ergebnis-Komponenten
lib/
  ├── db.ts                   # Prisma Client
  ├── ai.ts                   # KI-Integration
  ├── pdf.ts                  # PDF-Generierung
  └── paypal.ts               # PayPal-Integration
```

## Sicherheit
- Security Headers: X-Frame-Options, X-Content-Type-Options
- Rate Limiting via Edge Middleware / Upstash
- CORS: Nur eigene Domain + PayPal Webhooks

## Environment Variables
```env
DATABASE_URL, GEMINI_API_KEY, OPENAI_API_KEY
PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_WEBHOOK_ID
BLOB_READ_WRITE_TOKEN, NEXT_PUBLIC_BASE_URL
```
