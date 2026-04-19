# PowerSetup – Fehler & Verbesserungspotenzial

> Erstellt durch automatischen Code-Review am 2026-04-10  
> Schweregrade: 🔴 Kritisch | 🟠 Hoch | 🟡 Mittel | 🟢 Niedrig

---

## Übersicht

| # | Schweregrad | Kategorie | Titel |
|---|-------------|-----------|-------|
| 1 | 🔴 | Bug | Prisma `DATABASE_URL` auskommentiert |
| 2 | 🔴 | Bug | Unreachable Code in `adapter.ts` |
| 3 | 🔴 | Sicherheit | Admin-API-Routes nicht durch Middleware geschützt |
| 4 | 🔴 | Bug | DALL-E URL läuft nach 1h ab – kein Fehler bei Blob-Fehler |
| 5 | 🔴 | Feature-Lücke | `detectWarnings()` ist leer – nie implementiert |
| 6 | 🟠 | Bug | Brand Preferences werden in Preselection ignoriert |
| 7 | 🟠 | Bug | Race Condition beim `generate`-Endpunkt |
| 8 | 🟠 | Bug | Keine Expiration-Prüfung bei PATCH |
| 9 | 🟠 | Bug | Inverter-Prefilter zu aggressiv (reiner Sinus immer Pflicht) |
| 10 | 🟠 | Bug | `maxCapacityAh` ist nur grobe Schätzung |
| 11 | 🟡 | Bug | Hardcoded `sunHoursPerDay: 4` im Adapter |
| 12 | 🟡 | Bug | AlgorithmSettings-Defaults divergieren von `constants.ts` |
| 13 | 🟡 | Performance | Doppelte Neuberechnung in `results` und `generate` |
| 14 | 🟡 | Code-Qualität | `pdfUrl` für JPEG-Bild missbraucht |
| 15 | 🟡 | Sicherheit | `console.log` sensibler Daten in Production |
| 16 | 🟡 | Sicherheit | Hardcoded Fallback-Passwort `admin123` |
| 17 | 🟢 | Code-Qualität | `type` Feld in `Brand` deprecated, aber nicht entfernt |
| 18 | 🟢 | Bug | `alternatorType: 'standard'` hardcoded – Nutzer-Input ignoriert |
| 19 | 🟢 | Feature-Lücke | `needsSeparatePortableController` immer `false` |
| 20 | 🟢 | Bug | Präzisionsverlust im `autarchyDaysMap()` |
| 21 | 🟢 | Feature-Lücke | PayPal-Integration unvollständig |
| 22 | 🟢 | Code-Qualität | Keine Pagination bei `GET /api/results` |

---

## Kritische Fehler (🔴)

---

### #1 – Prisma `DATABASE_URL` auskommentiert

**Datei**: [prisma/schema.prisma:11](prisma/schema.prisma#L11)

**Problem**: Die `url`-Direktive im `datasource`-Block ist auskommentiert:

```prisma
datasource db {
  provider = "postgresql"
  // url      = env("DATABASE_URL")   ← AUSKOMMENTIERT!
}
```

Ohne diese Zeile kann Prisma keine Datenbankverbindung herstellen. Das Projekt kann lokal nur laufen, wenn eine separate Konfiguration (z.B. über `prisma.config.ts`) die URL bereitstellt.

**Risiko**: Prisma-Migrationen (`prisma migrate`) und `prisma generate` schlagen fehl. Neuentwickler werden sofort blockiert.

**Fix**:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

### #2 – Unreachable Code in `adapter.ts`

**Datei**: [src/lib/algorithm/adapter.ts:393-398](src/lib/algorithm/adapter.ts#L393-L398)

**Problem**: Zwei `console.log`-Aufrufe stehen **nach** dem `return`-Statement der Funktion `convertWizardInputToAlgorithmInput()`:

```typescript
    return {
        systemVoltage: wizard.systemVoltage as 12 | 24 | 48,
        // ...
    };

    // ← Diese Zeilen werden NIE ausgeführt:
    console.log('[ADAPTER] wizard.customOverrides:', wizard.customOverrides);
    console.log('[ADAPTER] mapped customOverrides:', { ... });
}
```

**Risiko**: Debug-Logs für `customOverrides` – ein kritischer Parameter für Nutzer-Overrides – funktionieren nie. Wenn Overrides nicht korrekt übergeben werden, gibt es kein Debugging.

**Fix**: `console.log`-Aufrufe vor das `return`-Statement verschieben oder entfernen.

---

### #3 – Admin-API-Routes nicht durch Middleware geschützt

**Datei**: [src/middleware.ts:39-41](src/middleware.ts#L39-L41)

**Problem**: Der Middleware-Matcher schützt nur UI-Routen unter `/admin/*`, aber nicht die API-Routen unter `/api/admin/*`:

```typescript
export const config = {
    matcher: '/admin/:path*',  // ← /api/admin/* ist NICHT geschützt!
};
```

Das bedeutet: Alle Admin-API-Endpunkte (`/api/admin/products`, `/api/admin/categories`, `/api/admin/settings` etc.) sind **ohne Authentifizierung** erreichbar. Jeder kann Produkte löschen, Einstellungen ändern oder Daten einsehen.

**Fix**:
```typescript
export const config = {
    matcher: ['/admin/:path*', '/api/admin/:path*'],
};
```

---

### #4 – DALL-E URL läuft nach 1h ab – kein Fehler bei Blob-Upload-Fehler

**Datei**: [src/app/api/result/[id]/schematic/generate/route.ts:103-118](src/app/api/result/[id]/schematic/generate/route.ts#L103-L118)

**Problem**: Wenn der Vercel-Blob-Upload fehlschlägt, wird die temporäre OpenAI-URL (läuft nach **1 Stunde** ab) in der Datenbank gespeichert und an den Nutzer zurückgegeben – ohne Fehlermeldung:

```typescript
if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
        // ... Blob-Upload ...
        finalUrl = blob.url;
    } catch (blobError) {
        console.error("Blob upload failed:", blobError);
        // Fallback zu OpenAI-URL (LÄUFT AB!)
        // Kein Fehler an Nutzer zurückgegeben!
    }
}
// finalUrl kann jetzt eine ablaufende URL sein
await prisma.result.update({ data: { pdfUrl: finalUrl } });
```

**Risiko**: Nutzer kaufen Credits, der Schaltplan ist nach 1h nicht mehr abrufbar. Kein Refund-Mechanismus.

**Fix**: Bei Blob-Upload-Fehler eine klare Fehlerantwort zurückgeben (HTTP 500) statt stille Degradierung.

---

### #5 – `detectWarnings()` ist leer – nie implementiert

**Datei**: [src/lib/recommendation/index.ts:104-108](src/lib/recommendation/index.ts#L104-L108)

**Problem**: Die Funktion ist als TODO markiert und gibt immer ein leeres Array zurück:

```typescript
function detectWarnings(products: any[], requirements: any): string[] {
    const warnings: string[] = [];
    // Todo: Implement checks for missing categories
    return warnings;
}
```

**Risiko**: Nutzer erhalten keine Warnung wenn:
- Eine kritische Kategorie (z.B. Batterien) keine passenden Produkte hat
- Der Algorithmus einen Wechselrichter empfiehlt, aber kein passendes Produkt vorhanden ist
- Sicherheitsrelevante Konfigurationen (z.B. keine Sicherung empfohlen) unbemerkt fehlen

**Fix**: Implementierung von Mindestprüfungen:
- Prüfen ob jede `required: true` Kategorie mindestens 1 Kandidaten hat
- Warnung wenn Wechselrichter benötigt aber kein Produkt verfügbar
- Warnung bei sehr kleiner Batterie relativ zum Tagesverbrauch

---

## Hohe Priorität (🟠)

---

### #6 – Brand Preferences werden in Preselection ignoriert

**Datei**: [src/lib/algorithm/product-preselection.ts:56-80](src/lib/algorithm/product-preselection.ts#L56-L80)

**Problem**: `AlgorithmInput` enthält `brandPreferences` (charger/battery/solar), aber `getCategoryRequirements()` nutzt diese nicht. Nutzer-Markenpräferenzen aus Schritt 7 des Wizards haben **keinen Effekt** auf die Produktauswahl.

```typescript
export function getCategoryRequirements(
    requirements: SystemRequirements,
    formData: any
): CategoryRequirement[] {
    // formData.brandPreferenceCharger, brandPreferenceBattery etc.
    // werden hier NICHT ausgelesen
```

**Risiko**: Nutzererfahrung: Nutzer wählen bewusst eine Marke (z.B. Victron), erhalten aber Produkte anderer Marken.

**Fix**: In `getCategoryRequirements()` Brand-Präferenzen als `additionalFilters` übergeben und im Scoring-System berücksichtigen.

---

### #7 – Race Condition beim `generate`-Endpunkt

**Datei**: [src/app/api/results/[id]/generate/route.ts:222-235](src/app/api/results/[id]/generate/route.ts#L222-L235)

**Problem**: Der Generate-Endpunkt überschreibt `schematicData` mit einem leeren Objekt `{}` bei jeder Ausführung und setzt `version: result.version + 1`. Wird der Endpunkt mehrfach gleichzeitig aufgerufen (z.B. durch doppelten Klick), können beide Anfragen denselben `result.version` lesen und unkontrolliert schreiben.

```typescript
const updatedResult = await prisma.result.update({
    where: { id },
    data: {
        schematicData: {},           // ← Überschreibt vorhandene Schaltplan-Daten!
        version: result.version + 1, // ← Nicht atomar
    },
});
```

**Risiko**: Ein bereits generierter Schaltplan (URL in `pdfUrl`) wird durch eine erneute Generate-Anfrage gelöscht (`schematicData: {}`).

**Fix**: Optimistic Locking verwenden: `where: { id, version: result.version }`, bei Konflikt HTTP 409 zurückgeben.

---

### #8 – Keine Expiration-Prüfung bei PATCH

**Datei**: `src/app/api/results/[id]/route.ts` (PATCH-Handler)

**Problem**: Der PATCH-Endpunkt erlaubt das Aktualisieren von abgelaufenen Results, obwohl `expiresAt` schon überschritten ist. Der GET-Endpunkt und der Generate-Endpunkt prüfen korrekt:

```typescript
// ✅ Korrekt in generate/route.ts:
if (new Date() > result.expiresAt) {
    return NextResponse.json({ error: "Result ist abgelaufen" }, { status: 410 });
}

// ❌ Fehlt im PATCH-Handler
```

**Risiko**: Abgelaufene Results können weiterhin geändert werden, was zu Inkonsistenzen führen kann.

**Fix**: Identische Expiration-Prüfung in den PATCH-Handler einbauen.

---

### #9 – Inverter-Prefilter zu aggressiv (reiner Sinus immer Pflicht)

**Datei**: [src/lib/algorithm/adapter.ts:460-464](src/lib/algorithm/adapter.ts#L460-L464)

**Problem**: In `preFilterProducts()` werden alle Wechselrichter mit modifiziertem Sinus komplett herausgefiltert:

```typescript
if (slug === 'wechselrichter') {
    if (p.waveform && p.waveform !== 'pure_sine') return false; // Alle modified_sine raus!
```

**Risiko**: Modifizierter Sinus ist für viele einfache Verbraucher (Heizlüfter, einfache Ladegeräte) ausreichend und deutlich günstiger. Nutzer mit einfachen Anforderungen sehen keine günstigeren Optionen.

**Richtiger Ansatz**: Reiner Sinus nur erzwingen, wenn 230V-Verbraucher vorhanden sind, die ihn benötigen (Laptops, Geräte mit Schaltnetzteilen, Elektrowerkzeug).

---

### #10 – `maxCapacityAh` ist nur grobe Schätzung

**Datei**: [src/lib/algorithm/adapter.ts:159](src/lib/algorithm/adapter.ts#L159)

**Problem**: Das `BatteryRequirement`-Interface hat ein `maxCapacityAh`-Feld, das im Adapter als einfache Verdopplung berechnet wird:

```typescript
maxCapacityAh: output.battery.recommendedCapacityAh * 2, // Rough estimate
```

**Risiko**: Wenn `maxCapacityAh` in der Produktauswahl als obere Grenze verwendet wird (z.B. "Batterie nicht größer als X Ah"), werden valide größere Batterien ausgeschlossen oder zu kleine akzeptiert.

**Fix**: Entweder `maxCapacityAh` korrekt berechnen (z.B. basierend auf verfügbarem Bauraum oder einer konfigurierbaren Obergrenze) oder aus dem Interface entfernen, wenn nicht benötigt.

---

## Mittlere Priorität (🟡)

---

### #11 – Hardcoded `sunHoursPerDay: 4` im Adapter

**Datei**: [src/lib/algorithm/adapter.ts:211](src/lib/algorithm/adapter.ts#L211)

**Problem**: Im Legacy-Adapter wird `sunHoursPerDay` hardcoded auf `4` gesetzt, obwohl der Algorithmus die echten PSH-Werte aus der Matrix berechnet und im Output verfügbar hat:

```typescript
solarModules: output.solar.needed ? {
    sunHoursPerDay: 4, // Estimate, not exposed in new output
```

**Risiko**: Die UI zeigt immer 4h Sonnenstunden an, unabhängig von Region und Saison. Bei einem Winterreisenden in Skandinavien (real: ~1.2h) ist dies irreführend.

**Fix**: PSH-Wert aus dem AlgorithmOutput exponieren oder direkt im Adapter aus `systemVoltage`, `season`, `winterLocation` neu berechnen.

---

### #12 – AlgorithmSettings-Defaults divergieren von `constants.ts`

**Dateien**: [prisma/schema.prisma:323-325](prisma/schema.prisma#L323-L325) vs [src/lib/algorithm/constants.ts](src/lib/algorithm/constants.ts)

**Problem**: Die Standardwerte in der Datenbank (`AlgorithmSettings`) unterscheiden sich von den hardcodierten Konstanten im Code:

| Parameter | `constants.ts` | `AlgorithmSettings` DB-Default |
|-----------|----------------|-------------------------------|
| `WP_PER_M2_RIGID` | `235` Wp/m² | `180` Wp/m² |
| `WP_PER_M2_FLEXIBLE` | `180` Wp/m² | `150` Wp/m² |

**Risiko**: Eine frisch aufgesetzte Datenbank hat andere Werte als der Code-Kommentar suggeriert. Wenn jemand die `AlgorithmSettings` in der DB löscht/resettet, werden andere Werte verwendet als erwartet.

**Fix**: Alle Konstanten in `constants.ts` und die DB-Defaults synchronisieren. Idealerweise nur eine einzige Quelle der Wahrheit.

---

### #13 – Doppelte Neuberechnung der Systemanforderungen

**Dateien**: [src/app/api/results/route.ts:37-57](src/app/api/results/route.ts#L37-L57) und [src/app/api/results/[id]/generate/route.ts:99-118](src/app/api/results/[id]/generate/route.ts#L99-L118)

**Problem**: Die `calculateSystemRequirements()`-Funktion wird zweimal aufgerufen:
1. Beim Erstellen des Results (`POST /api/results`)
2. Beim Generieren der Empfehlungen (`POST /api/results/[id]/generate`)

Im Generate-Kommentar steht sogar: `// FORCE RE-CALCULATION to ensure latest algorithm logic is applied` – das überschreibt also absichtlich die gespeicherten Berechnungen.

**Risiko**: 
- Inkonsistenz zwischen gespeicherten `calculations` und den tatsächlich für Empfehlungen verwendeten Werten
- Unnötiger Rechenaufwand und DB-Roundtrips
- Wenn sich der Algorithmus zwischen Create und Generate ändert, erhalten Nutzer andere Ergebnisse als in der Vorschau

**Verbesserung**: Klare Entscheidung treffen: Entweder einmal berechnen und cachen, oder immer neu berechnen – nicht beides.

---

### #14 – `pdfUrl` Feld für JPEG-Bild missbraucht

**Datei**: [prisma/schema.prisma:32](prisma/schema.prisma#L32), [src/app/api/result/[id]/schematic/generate/route.ts:121](src/app/api/result/[id]/schematic/generate/route.ts#L121)

**Problem**: Das Datenbankfeld heißt `pdfUrl`, wird aber für eine JPEG-Bildurl des DALL-E-Schaltplans verwendet:

```typescript
await prisma.result.update({
    where: { id },
    data: { pdfUrl: finalUrl } // ← JPEG-URL in pdfUrl-Feld
});
```

Der Kommentar im Code bestätigt das: `// Using pdfUrl field for the schematic image for now`

**Risiko**: Semantisch verwirrend. Wenn später ein echter PDF-Export hinzugefügt wird, entsteht ein Namenskonflikt.

**Fix**: Feld in `schematicImageUrl` umbenennen und eine Migration erstellen.

---

### #15 – `console.log` sensibler Daten in Production

**Dateien**: Diverse API-Routes

**Problem**: Über 20 `console.log`-Aufrufe loggen in Production-Umgebungen potenziell sensible Daten:

```typescript
// src/app/api/results/route.ts:55
console.log("Calculated requirements (with overrides):", JSON.stringify(calculations, null, 2));

// src/app/api/results/[id]/generate/route.ts:26
console.log("--- API ROUTE HIT: /api/results/[id]/generate ---");

// src/lib/ai.ts:103-104
console.log("--- AI Raw Response ---");
console.log(text.substring(0, 500) + "...");
```

**Risiko**: Berechnungsergebnisse, KI-Rohantworten und API-Request-Details erscheinen in Production-Logs. Bei Serverless-Deployments (Vercel) sind Logs für alle Team-Mitglieder einsehbar.

**Fix**: 
- Logging-Bibliothek einführen (z.B. `pino`) mit Log-Level-Unterstützung
- `console.log` → `logger.debug()` (in Production deaktiviert)
- `console.error` → `logger.error()` beibehalten

---

### #16 – Hardcoded Fallback-Passwort `admin123`

**Datei**: [src/middleware.ts:23-24](src/middleware.ts#L23-L24)

**Problem**: Das Middleware-Fallback-Passwort ist trivial:

```typescript
const validUsername = process.env.ADMIN_USERNAME || 'admin';
const validPassword = process.env.ADMIN_PASSWORD || 'admin123';
```

**Risiko**: Wenn `ADMIN_PASSWORD` nicht in der Produktionsumgebung gesetzt ist (z.B. bei einem Vercel-Deployment ohne korrekte Env-Vars), ist das Admin-Panel mit `admin:admin123` zugänglich. Dies ist ein weit verbreitetes Standard-Passwort.

**Fix**: 
- Fallback auf `null` setzen und bei fehlender Env-Var eine aussagekräftige Fehlermeldung werfen
- Alternativ: Deployment-Check, der fehlende Env-Vars als Fehler markiert

```typescript
const validPassword = process.env.ADMIN_PASSWORD;
if (!validPassword) {
    throw new Error("ADMIN_PASSWORD environment variable is required");
}
```

---

## Niedrige Priorität (🟢)

---

### #17 – `type` Feld in `Brand` deprecated, aber nicht entfernt

**Datei**: [prisma/schema.prisma:408-410](prisma/schema.prisma#L408-L410)

**Problem**: Das `Brand`-Modell hat zwei Felder für den gleichen Zweck:

```prisma
types     String[] @default([])  // Neu: Array ["CHARGER", "BATTERY", ...]
type      String?  // Deprecated, use types instead
```

**Risiko**: Code, der das alte `type`-Feld schreibt, befüllt das neue `types`-Array nicht. Inkonsistente Datenlage.

**Fix**: Migration schreiben, die `type` → `types` konvertiert, altes Feld entfernen.

---

### #18 – `alternatorType: 'standard'` hardcoded im Adapter

**Datei**: [src/lib/algorithm/adapter.ts:186](src/lib/algorithm/adapter.ts#L186)

**Problem**:
```typescript
booster: output.booster.needed ? {
    alternatorType: 'standard', // No longer asked, default
```

Der Kommentar sagt "No longer asked" – das heißt, eine potenziell wichtige Information (Standard-Lichtmaschine vs. Euro-6d-Smart-Alternator) wird nicht mehr erfasst. Smart-Alternatoren erfordern andere Booster-Typen.

**Risiko**: Nutzer mit Euro-6d+ Fahrzeugen erhalten möglicherweise falsche Booster-Empfehlungen (Batterie-zu-Batterie-Lader statt normaler Booster).

**Verbesserung**: Alternator-Typ entweder wieder im Wizard abfragen (Schritt 1 oder 2) oder zumindest eine Warnung ausgeben wenn das Fahrzeug neueren Datums ist.

---

### #19 – `needsSeparatePortableController` immer `false`

**Datei**: [src/lib/algorithm/adapter.ts:206](src/lib/algorithm/adapter.ts#L206)

**Problem**:
```typescript
needsSeparatePortableController: false, // Simplified
```

**Risiko**: Wenn Nutzer sowohl Dach-Solar als auch portable Solar-Taschen haben, kann ein separater MPPT-Regler für die Taschen sinnvoll sein (besonders bei unterschiedlichen Panel-Typen oder großen Leistungsunterschieden). Diese Empfehlung fehlt vollständig.

**Verbesserung**: Logik implementieren: Wenn `portableWp > 0` UND `roofWp > 0`, einen separaten Controller empfehlen.

---

### #20 – Präzisionsverlust im `autarchyDaysMap()`

**Datei**: [src/lib/algorithm/adapter.ts:329-337](src/lib/algorithm/adapter.ts#L329-L337)

**Problem**: Die Funktion mappt kontinuierliche Werte auf diskrete Stufen:

```typescript
const autarchyDaysMap = (days: number): 2 | 6 | 10 | 14 | 20 | 999 => {
    if (days <= 2) return 2;
    if (days <= 6) return 6;  // 3, 4, 5 Tage → alle zu 6 Tage!
    if (days <= 10) return 10;
```

**Risiko**: Ein Nutzer der "3 Tage Autarkie" wählt, bekommt eine Batterie für 6 Tage dimensioniert – 100% Überdimensionierung. Dies führt zu Mehrkosten und eventuell zu Ablehnung ("zu teuer").

**Verbesserung**: Entweder kontinuierliche Eingabe direkt übergeben, oder den Mapping-Schritt transparenter machen (z.B. in der UI anzeigen: "Wir dimensionieren für 6 Tage").

---

### #21 – PayPal-Integration unvollständig

**Problem**: Das Zahlungssystem ist als Kernfeature im PRD beschrieben, aber in der Implementierung nicht vollständig:
- `POST /api/payments` ist ein Stub (gibt 200 OK ohne Logik zurück)
- `CreditPurchase`-Modell existiert, wird aber nicht befüllt
- `CreditBalance` und `CreditUsage` existieren, werden bei Schaltplan-Generierung aber nicht aktualisiert
- Die `/result/[id]/schematic/generate`-Route prüft Credits nicht vor der Generierung

**Risiko**: Nutzer können theoretisch unbegrenzt Schaltpläne generieren ohne zu zahlen.

**Fix**: Vollständigen PayPal-Flow implementieren: Order-Create → Capture → Credit-Buchung → Credit-Prüfung vor Generierung.

---

### #22 – Keine Pagination bei `GET /api/results`

**Datei**: [src/app/api/results/route.ts:88-100](src/app/api/results/route.ts#L88-L100)

**Problem**: Der Admin-Endpunkt limitiert die Ergebnisse auf 50, hat aber keine Paginierung:

```typescript
const results = await prisma.result.findMany({
    where: { expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    take: 50, // ← Hartcodiertes Limit ohne Pagination
});
```

**Risiko**: Bei mehr als 50 aktiven Results sind ältere Einträge im Admin nicht mehr sichtbar.

**Fix**: Query-Parameter `page` und `limit` einführen, Gesamtzahl im Response mitgeben.

---

## Weitere Verbesserungsvorschläge

### Architektur

- **Rate Limiting**: Öffentliche Endpunkte (`/api/results`, `/api/results/[id]/generate`) haben kein Rate-Limiting. Bei Missbrauch können KI-Kosten explodieren.
- **Input-Sanitierung**: Wizard-Eingaben werden per Zod validiert, aber mehrere Admin-Endpunkte akzeptieren unvalidierte Rohdaten.
- **CSRF-Schutz**: Keine CSRF-Token-Validierung für public POST-Endpunkte.
- **Idempotency-Keys**: Der Generate-Endpunkt hat keinen Schutz gegen doppelte Ausführung (z.B. bei Netzwerkfehler und Retry).

### Performance

- **Caching**: `getAlgorithmSettings()` und `getAISettings()` werden bei jedem Request aus der DB geladen – Redis-Cache würde diese Roundtrips eliminieren.
- **Produkt-Preload**: Alle aktiven Produkte werden bei jeder Generate-Anfrage vollständig geladen. Bei vielen Produkten ist ein gezielter Query sinnvoller.
- **Parallele DB-Abfragen**: In `generate/route.ts` werden Settings sequenziell abgerufen (`aiSettings`, `generalSettings`, `algorithmSettings`). Diese sollten mit `Promise.all()` parallelisiert werden.

### Code-Qualität

- **TypeScript `any` Casting**: Zahlreiche `as any` Casts in API-Routes untergraben die Typsicherheit. Besonders `formData = result.formData as any` ist riskant.
- **Error-Handling in Wizard**: `handleFinish()` in `wizard-wrapper.tsx` fängt Fehler ab, gibt aber keine Rückmeldung an den Nutzer – der Nutzer bleibt im Ladezustand hängen.
- **Leere `warnings[]` in Response**: `recommendations.warnings` im Generate-Response enthält immer ein leeres Array (wegen #5). Das Response-Format sollte an die Implementierung angepasst werden.

### Sicherheit

- **Secrets-Management**: API-Keys (Gemini, OpenAI, Amazon) werden in `SystemSetting` in der Datenbank gespeichert. Idealerweise sollten diese in Umgebungsvariablen oder einem Secret-Manager (Vercel Environment Variables) liegen.
- **SQL-Injection über `filterValues`**: Das `filterValues`-JSONB-Feld wird ohne Schema-Validierung gespeichert. Obwohl Prisma Parameterized Queries verwendet, könnte manipulierter Content die KI-Prompts beeinflussen (Prompt-Injection via Produktdaten).

---

*Analyse generiert durch automatischen Code-Review. Stand: 2026-04-10*
