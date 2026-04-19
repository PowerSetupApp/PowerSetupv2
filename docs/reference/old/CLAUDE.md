# PowerSetup – Claude Context

## Project
Mobile-first Next.js 15 app (TypeScript, TailwindCSS, shadcn/ui, Prisma/PostgreSQL) that guides camping beginners through an 8-step wizard to plan their vehicle electrical setup (battery, solar, cabling). Deployed on Vercel, targeting DACH region.

## Architecture
- **Wizard**: `src/app/wizard/` → Zustand store (`src/lib/store/wizard-store.ts`)
- **Core Algorithm**: `src/lib/algorithm/algorithm.ts` (~2500 lines, 9 calculation phases)
- **Recommendation Engine**: `src/lib/recommendation/` (selection → reasoning → enrichment)
- **AI Layer**: `src/lib/ai.ts` – Gemini 2.0 primary, GPT-4o fallback; DALL-E 3 for schematics
- **Admin Panel**: `/admin/*` protected via HTTP Basic Auth
- **All algorithm constants**: configurable via `AlgorithmSettings` DB record (no redeployment needed)

## Key Decisions
- No user auth – access controlled by Result UUID only
- Product selection mode: `algorithm` or `hybrid` (AI); configurable per `AlgorithmSettings`
- Legacy adapter pattern: `adapter.ts` bridges new `AlgorithmOutput` → old `SystemRequirements` for UI
- Pre-filtering reduces AI token usage before product selection

## Dev Notes
- Run migrations manually via `prisma/migrations/manual/`
- Check settings with `check-settings.ts`, battery calcs with `repro_battery.ts`
