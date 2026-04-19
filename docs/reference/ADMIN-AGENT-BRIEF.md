# PowerSetup — Agent-Briefing: Zwei Oberflächen & wo dokumentiert ist

Diese Datei ist der **kurze Einstieg für jede Ausführung** (Implementierung/Rebuild). Ziel: klar trennen, was **Endnutzer** sehen vs. was nur **Admin** ist, und auf die vollständigen Specs verweisen.

## 1. Zwei getrennte UI-Bereiche (nicht verwechseln)


| Bereich       | Publikum          | Routen (Zielbild)                                                         | Design                                                                                                                                                                   |
| ------------- | ----------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Endnutzer** | Camper / Anfänger | Wizard (8 Schritte), **Ergebnis**-Seite (`/result/[id]`), später PDF/Kauf | **Mobile-first**, hochwertig, Skills: `.agents/skills/frontend/SKILL.md` + verlinkte Design-Leitlinien / UI-UX Pro Max                                                   |
| **Admin**     | Nur Betreiber     | `/admin/`* + geschützte `/api/admin/`*                                    | **Funktionale Parität** mit Legacy: Felder, Aktionen, Einstellungen. **Kein** Pixel-perfect-Zwang an altes Layout — neues UI erlaubt, solange Verhalten gleichwertig ist |


**Wichtig:** Screenshots und Legacy-UI beschreiben fast ausschließlich **Admin**. Der Wizard/Result sieht anders aus und wird über **PS-1 … PS-6** + Wizard-Code in `docs/reference/old/src` spezifiziert.

## 2. Wo steht was? (Reihenfolge zum Lesen)

1. **[AGENTS.md](../../AGENTS.md)** — globale Regeln, Produkt-Flow, Skills.
2. **[features/PS-7-admin-panel.md](../../features/PS-7-admin-panel.md)** — **Checkliste Admin** (Muss-Funktionen + Abnahme).
3. **[docs/reference/admin/README.md](admin/README.md)** — Index aller Admin-Detailseiten.
4. **[docs/reference/schema.prisma](schema.prisma)** — Datenmodell (Produkt, Kategorie, Filter, Marken, AlgorithmSettings, …).
5. **[docs/reference/old/README.md](old/README.md)** — Legacy-`src/`-Snapshot: echtes Verhalten aus Code lesen.

## 3. Admin: Endzustand (funktional)

- **Navigation:** wie [routes-and-navigation.md](admin/routes-and-navigation.md) (Dashboard, Produkte, Marken, Kategorien, Mediathek, Verbraucher, Verbr.-Kategorien, Ergebnisse, Einstellungen, Link zur Website).
- **Jede Route:** CRUD bzw. Listen/Detail wie in den jeweiligen `admin/*.md` Dateien; **Einstellungen** = 4 Tabs (KI, Algorithmus, Preise, Amazon) inkl. aller persistierten Keys (siehe [system-settings-keys.md](admin/system-settings-keys.md)).
- **Produkte:** Liste mit Suche, Kategorie-Filter, „Nur unvollständige“, Bulk-Update sichtbarer Zeilen, Import-Dialog (Amazon/KI), Bearbeiten mit dynamischen Filter-Werten, Mediathek-Modal, Specs-KI-Optimierung — siehe [products.md](admin/products.md).
- **Marken:** Tabelle + Suche, Dialog „Neue Marke“, Zuordnung Wizard-Gruppen → Produktkategorien (Checkbox-Raster) — siehe [brands.md](admin/brands.md).
- **Mediathek:** Produktfluss über Upload-API; eigenständige Galerie-Seite an echten Storage anbinden — siehe [media.md](admin/media.md).

## 4. Bekannte Legacy-Inkonsistenz (beim Implementieren lösen)

- Produktseiten rufen `fetch("/api/admin/brands")` auf; im Snapshot **fehlt** `app/api/admin/brands/route.ts`. **Server Actions** in `app/actions/brands.ts` existieren.  
**Empfehlung für Neubau:** eine konsistente Schicht wählen (z. B. nur Server Actions + keine tote `fetch`-URL, oder REST-Route ergänzen). Dokumentiert in [api-routes.md](admin/api-routes.md).

## 5. Technische Nicht verhandelbare Regeln (Auszug)

Aus `AGENTS.md` / Konventionen — bei Admin-Implementierung ebenfalls einhalten:

- Berechnung nur über `**POST /api/generate/[id]`** (nicht im Admin „nachrechnen“ außerhalb des definierten Flows).
- Prisma-Zugriffe zentral wie im Zielprojekt vorgesehen (`src/lib/db/queries/` — siehe `.context/conventions.md`).

## 6. Feature-IDs (Überblick)


| ID          | Thema                                                                       |
| ----------- | --------------------------------------------------------------------------- |
| PS-1 … PS-6 | Wizard, Algorithmus, KI, Result, PDF, Payments                              |
| **PS-7**    | **Admin-Panel** — [PS-7-admin-panel.md](../../features/PS-7-admin-panel.md) |
| PS-8        | Amazon-Import                                                               |
| PS-9        | i18n                                                                        |


Nach Abschluss von Admin-Arbeiten: Checkboxen in **PS-7** abhaken und bei strukturellen App-Änderungen `.context/architecture.md` pflegen.

**Gesamt-Roadmap:** [REWRITE_PLAN.md](../../REWRITE_PLAN.md) (u. a. **Phase 7: Admin Panel**) verweist auf diese Dateien.