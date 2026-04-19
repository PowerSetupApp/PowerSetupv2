# Admin — consumer devices & categories (Wizard catalogue)

Maps to Prisma `ConsumerDevice` and `ConsumerCategory` in [`../schema.prisma`](../schema.prisma).

## Consumer categories (`/admin/consumer-categories`)

Source: [`../old/src/app/admin/consumer-categories/[id]/page.tsx`](../old/src/app/admin/consumer-categories/[id]/page.tsx)

**Fields**

- `name` *
- `slug` *
- `icon` (emoji picker)
- `sortOrder`

**API:** `GET/PUT/DELETE /api/admin/consumer-categories/[id]`; list + `POST` on collection route.

## Consumer devices (`/admin/consumer-devices`)

### Liste (`/admin/consumer-devices`)

Quelle: [`../old/src/app/admin/consumer-devices/page.tsx`](../old/src/app/admin/consumer-devices/page.tsx) (und zugehörige Komponenten).

- **Titel:** z. B. „Verbraucher-Geräte“; Untertitel zur Konfiguration für den Wizard; **+ Neues Gerät**.
- Geräte **gruppiert nach ConsumerCategory** (Überschriften mit Geräteanzahl).
- **Tabellenspalten (Zielbild):** Icon; **Name** mit technischem Key/Slug darunter; **Standardwerte** (Watt, System/Benutzer-Spannung, Nutzungsdauer min/Tag); **Optionen** (z. B. Badge „Kühlgerät“); **Featured** (Häkchen); **Aktionen** (Bearbeiten).

### Bearbeiten (`/admin/consumer-devices/[id]`)

Source: [`../old/src/app/admin/consumer-devices/[id]/page.tsx`](../old/src/app/admin/consumer-devices/[id]/page.tsx)

**Basisdaten**

- `name` *
- `i18nKey` (optional)
- `icon` (emoji picker)
- `categoryId` * (`ConsumerCategory`)

**Standardwerte** (UI uses minutes / step %; persisted as hours)

- `defaultPower` (W) *
- `defaultVoltage` * — legacy UI options include “Benutzerauswahl (System)” (`user`) and `230V` (see DB schema for full allowed values in new app).
- `defaultMinutesPerDay` * → stored as `defaultHoursPerDay`
- `stepPercentage` → derived `stepHours` from duration and percentage

**Konfiguration & UI** (switches)

- `isFeatured` — “Featured (Sektion)”
- `isActive` — “Sichtbar (Aktiv)”
- `showHoursField` — show hours adjustment in wizard
- `showFixedOption` — “Fest verbaut” option
- `isCooling` — compressor/absorber logic flag

**Sortierung:** `sortOrder`

**API:** `GET/PUT/DELETE /api/admin/consumer-devices/[id]`; list/create on collection.

> **Note:** `keywords` and other schema fields exist on `ConsumerDevice` but may not appear on this simplified admin form; verify API route body vs [`../schema.prisma`](../schema.prisma) when porting.
