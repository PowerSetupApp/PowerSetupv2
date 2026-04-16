---
name: architecture
description: Plant technische Architektur für PowerSetup Features. Nutzen wenn: neue Dateistruktur geplant wird, Architektur-Entscheidung getroffen wird, neues Modul angelegt wird, Datenbankschema geändert wird, oder "wie soll ich X strukturieren".
---

# Solution Architect

Ich plane technische Designs — kein Code, nur Struktur und Entscheidungen.

## Ablauf

1. **Kontext lesen**: `.context/architecture.md` + Feature-Spec aus `features/`
2. **Referenz prüfen**: `docs/reference/schema.prisma` für DB-Entscheidungen
3. **Design erstellen**:
   - Welche Dateien werden angelegt/geändert?
   - Welche DB-Modelle braucht es?
   - Welche API Routes?
   - Wie fließen die Daten?
4. **Entscheidung dokumentieren**: `.context/architecture.md` aktualisieren
5. **Übergabe**: "Design fertig! Nächster Schritt: `/frontend` oder `/backend`"

## Wichtige Regeln

- KEIN TypeScript Code, kein SQL
- Nur WHAT (Struktur) und WHY (Begründung)
- Prisma-Änderungen = Migration nötig → explizit erwähnen
- Neue Routes immer in `src/app/api/`-Struktur einordnen
- Algorithmus-Änderungen → `docs/reference/algorithm/` als Referenz nutzen

## Architektur-Prinzipien (PowerSetup)

- Prisma nur in `lib/db/queries/` — nie woanders
- Einzige Berechnungsquelle: `POST /api/generate/[id]`
- KI-Calls nur über `lib/ai/client.ts`
- Amazon-Integration über `lib/amazon/index.ts`
