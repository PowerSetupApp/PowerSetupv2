# PowerSetup – Tech Stack & Infrastruktur

## Übersicht

| Bereich | Technologie |
|---------|-------------|
| Framework | Next.js 16.1 |
| Sprache | TypeScript |
| Styling | TailwindCSS |
| Datenbank | PostgreSQL |
| ORM | Prisma |
| KI | Google Gemini (primär), OpenAI (Fallback) |
| PDF | Puppeteer |
| Zahlung | PayPal |
| Hosting | Vercel |
| i18n | next-intl oder next-i18next |

---

## Frontend

### Next.js 16.1
- App Router
- Server Components (Default)
- Server Actions für Mutations
- Streaming für lange Operationen

### Styling
- TailwindCSS
- shadcn/ui Komponenten
- Mobile-first Design

### State Management
- React Hook Form (Formular)
- Zustand oder Context (Global State)
- URL State für Formular-Schritte

---

## Backend

### API Routes
```
/api/
  ├── results/
  │   ├── POST   - Neues Ergebnis erstellen
  │   ├── GET    - Ergebnis abrufen
  │   └── PATCH  - Ergebnis aktualisieren
  ├── products/
  │   └── GET    - Produkte filtern
  ├── calculate/
  │   └── POST   - KI-Berechnung starten
  ├── schematic/
  │   └── POST   - PDF generieren
  └── payments/
      ├── create-order
      └── capture-order
```

### Server Actions
- Formular-Submission
- Berechnungen triggern
- PDF-Generierung

---

## Datenbank

### PostgreSQL auf Vercel
- Vercel Postgres (empfohlen)
- Oder: Neon, Supabase, PlanetScale

### Prisma
- Schema in `prisma/schema.prisma`
- Migrations: `prisma migrate`
- Studio: `prisma studio`

### JSONB
- Produktspezifikationen
- Formular-Daten
- Berechnungsergebnisse

---

## KI-Integration

### Google Gemini
```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

async function generatePlan(prompt: string) {
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

### Fallback: OpenAI
```typescript
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generatePlanFallback(prompt: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
  });
  return response.choices[0].message.content;
}
```

---

## PDF-Generierung

### Puppeteer auf Vercel
```typescript
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

async function generatePDF(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
  
  const page = await browser.newPage();
  await page.setContent(html);
  const pdf = await page.pdf({ format: "A4" });
  await browser.close();
  
  return pdf;
}
```

### PDF-Speicherung
- Vercel Blob Storage
- Oder: AWS S3, Cloudflare R2

---

## Umgebungsvariablen

```env
# Database
DATABASE_URL=postgresql://...

# KI
GEMINI_API_KEY=...
OPENAI_API_KEY=...

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_WEBHOOK_ID=...

# Storage
BLOB_READ_WRITE_TOKEN=...

# App
NEXT_PUBLIC_BASE_URL=https://powersetup.de
```

---

## Deployment

### Vercel
- Automatisches Deployment bei Push
- Preview Deployments für PRs
- Edge Functions für globale Performance

### Domains
- `powersetup.de` (Produktion)
- `staging.powersetup.de` (Staging)

---

## Monitoring

### Vercel Analytics
- Web Vitals
- Page Views
- Errors

### Logging
- Vercel Logs (kostenlos)
- Oder: Axiom, LogTail

---

## Sicherheit

### Headers
```typescript
// next.config.js
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "origin-when-cross-origin" },
];
```

### Rate Limiting
- Vercel Edge Middleware
- Oder: Upstash Redis

### CORS
- Nur eigene Domain erlaubt
- PayPal Webhook-IPs

---

## Ordnerstruktur

```
powersetup/
├── app/
│   ├── (marketing)/
│   │   └── page.tsx          # Landing Page
│   ├── wizard/
│   │   └── [[...step]]/      # Formular Steps
│   ├── result/
│   │   └── [id]/             # Ergebnis-Seite
│   └── api/
│       ├── results/
│       ├── calculate/
│       ├── schematic/
│       └── payments/
├── components/
│   ├── ui/                   # shadcn/ui
│   ├── wizard/               # Formular-Komponenten
│   └── result/               # Ergebnis-Komponenten
├── lib/
│   ├── db.ts                 # Prisma Client
│   ├── ai.ts                 # KI-Integration
│   ├── pdf.ts                # PDF-Generierung
│   └── paypal.ts             # PayPal-Integration
├── prisma/
│   └── schema.prisma
├── public/
│   └── icons/
└── docs/
    └── PRD_*.md
```
