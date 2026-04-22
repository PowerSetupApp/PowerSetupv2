# Algorithmus-Brief: Eingaben, Konstanten, Ausgaben (mit Typen)

Dieses Dokument ist die **kanonische Spezifikation** für eine KI, die einen neuen Berechnungs-Algorithmus entwirft. Es beschreibt nur **Datenformen und Grenzen** — keine Rechenlogik.

**Trennung:**

1. **Nutzer-Eingaben** — alles, was aus dem Wizard (und ggf. ergänzende Listen wie `solarBags`) in den Algorithmus fließt.
2. **Konstanten & Grenzen** — feste Wertemengen, Einheiten, Validierungs-Obergrenzen und UI-abgeleitete Schranken (keine physikalischen Algorithmus-Konstanten wie DoD oder PSH — die legt der neue Algorithmus selbst fest).
3. **Ausgaben** — alles, was der Algorithmus zurückliefert (Rohzahlen; Rundung und Klartexte außerhalb).

Referenz im Code (Formen, nicht Logik): `AlgorithmInput` / `AlgorithmOutput` in `src/lib/algorithm/types.ts`; Validierung des Wizard-Body: `src/lib/schemas/wizard-input.ts`.

---

## Legende: Typbezeichnungen

| Typbezeichnung | Bedeutung |
|----------------|-----------|
| `string` | Text (UTF-8), beliebige Länge sofern nicht anders begrenzt |
| `string (non-empty)` | Text, mindestens 1 Zeichen |
| `int` | Ganzzahl (kein Bruchteil) |
| `decimal` | Fließkommazahl (IEEE double), endliche Werte |
| `boolean` | `true` oder `false` |
| `literal` | genau einer der aufgeführten Werte |
| `enum` | feste Menge von `literal`-Werten (wie `literal`, nur gruppiert) |
| `array<T>` | Liste von `T`, 0…n Elemente sofern nicht anders begrenzt |
| `object { … }` | zusammengesetzter Datensatz mit benannten Feldern |
| `optional` | Feld darf fehlen (`undefined`) |
| `nullable` | Feld darf `null` sein |

**Einheiten** in Klammern hinter dem Feldnamen: `[V]`, `[W]`, `[Wh]`, `[Ah]`, `[A]`, `[h]`, `[m]`, `[cm]`, `[mm²]`, `[Wp]` — Zahlen sind **numerische Werte** (`int` oder `decimal`) in genau dieser Einheit, sofern nicht als dimensionslos bezeichnet.

---

# Teil A — Nutzer-Eingaben

Alle Felder gehören zum Objekt **`AlgorithmInput`** (bzw. dessen Teilobjekten). Marken und manuelle Overrides sind **kein** Algorithmus-Input und fehlen hier. **`alternatorTier`** ist kein Wizard-Feld und fehlt ebenfalls.

## A.1 Schritt 1 — System-Basis

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `systemVoltage` | `literal` `12` \| `24` \| `48` | Bordnetz [V] |
| `vehicleVoltage` | `literal` `12` \| `24` \| `48` | Starter / Lichtmaschine [V] |
| `batteryPreference` | `enum` `lifepo4` \| `agm` \| `gel` | Chemie Versorgerbatterie |

## A.2 Schritt 2 — Energiequellen

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `energySources` | `array<enum>` | Jeder Eintrag: `solar` \| `alternator` \| `shore_power`. **Produktregel:** mindestens eine Quelle (Schema prüft das nicht zwingend; UI erzwingt es). |
| `roofModuleType` | `enum` `rigid` \| `flexible` | Modultyp Dach (nur relevant wenn `solar` gewählt) |
| `roofAreas` | `array<object>` | Rechteckige Dachflächen, siehe A.2.1 |
| `solarBags` | `array<object>` | Portable Solartaschen, siehe A.2.2 |
| `chargerSpeed` | `enum` `slow` \| `normal` \| `fast` | Landstrom-Ladegeschwindigkeit (nur wenn `shore_power` gewählt) |

### A.2.1 Objekt `RoofArea` (ein Element von `roofAreas`)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `string (non-empty)` | stabile ID |
| `name` | `string (non-empty)` | Anzeigename |
| `length` | `decimal` | Länge [cm], ≥ 0, ≤ `MAX_ROOF_DIM_CM` (siehe Teil B) |
| `width` | `decimal` | Breite [cm], ≥ 0, ≤ `MAX_ROOF_DIM_CM` |

### A.2.2 Objekt `SolarBag` (ein Element von `solarBags`)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `string (non-empty)` | stabile ID |
| `power` | `decimal` | Peak-Leistung der Tasche [Wp], ≥ 0, ≤ `MAX_SOLAR_BAG_W` (siehe Teil B) |

## A.3 Schritt 3 — Verbraucher

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `consumers` | `array<object>` | Liste; jedes Element siehe A.3.1 |
| `simultaneousLoad` | `enum` `low` \| `moderate` \| `high` | Gleichzeitigkeit (u. a. 230-V-Peak, DC-Sicherungskasten-Logik — genaue Nutzung offen) |

### A.3.1 Objekt `Consumer`

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `string (non-empty)` | UUID oder andere stabile ID |
| `name` | `string (non-empty)` | Gerätename |
| `power` | `decimal` | Nennleistung [W], ≥ 0, ≤ `MAX_POWER_W` |
| `daily` | `decimal` | Nutzungsdauer [h/Tag], ≥ 0, ≤ `MAX_HOURS_PER_DAY` |
| `voltage` | `literal` `12` \| `24` \| `48` \| `230` | DC entspricht i. d. R. `systemVoltage`; `230` = AC-Verbraucher |
| `coolingMethod` | `optional` `enum` `compressor` \| `absorber` | nur für Kühlgeräte |
| `electricShare` | `optional` `decimal` | Anteil elektrisch bei Absorber, 0…1 |
| `averageLoadPercent` | `optional` `int` | 1…100, Durchschnittslast relativ zu `power` für Tages-Wh (fehlend = volle Nennleistung) |
| `sourceDeviceId` | `optional` `string (non-empty)` | Katalog-Referenz, nur Metadaten |
| `deviceIcon` | `optional` `string` \| `null` | UI |
| `categoryIcon` | `optional` `string` \| `null` | UI |
| `showHoursField` | `optional` `boolean` | UI: Stundenfeld anzeigen |
| `dailyStep` | `optional` `decimal` | UI: Schrittweite h/Tag, > 0 |

*Nur für den Algorithmus zwingend: `id`, `name`, `power`, `daily`, `voltage` und ggf. Kühlfelder / `averageLoadPercent`.*

## A.4 Schritt 4 — Reiseverhalten (`travelBehavior`)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `season` | `enum` `summer` \| `all_year` \| `winter` | Hauptreisezeit |
| `tripDuration` | `enum` `weekend` \| `week` \| `extended` \| `permanent` | typische Reisedauer |
| `winterLocation` | `enum` `scandinavia` \| `germany` \| `southern` \| `eastern` \| `varies` | Winterregion |
| `standingDuration` | `enum` `short` \| `medium` \| `long` | typische Standzeit ohne Fahrt |

**UI-Konstante (kein Schema):** `tripDuration = permanent` ist nur wählbar, wenn `season = all_year`.

## A.5 Schritt 5 — Autarkie

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `autarchyDays` | `int` | 1…999 laut Schema; **Wizard-Obergrenze** dynamisch aus `(tripDuration, energySources)` (siehe B.2). **Semantik: „weiche Autarkie"** — Solar und Lichtmaschine speisen während der Tage weiter ein; die Batterie deckt nur die Rest-Lücke. Sonderwert `999` = „Maximum / unbegrenzt“ — Wizard klappt auf `maxDays` ein. |

## A.6 Schritt 6 — Kabellängen (`cableLengths`)

Alle Werte: `decimal`, Länge [m], ≥ 0, jeweils ≤ `MAX_CABLE_LENGTH_M`.

| Feld | Typ | Bedeutung der Strecke |
|------|-----|------------------------|
| `starterToService` | `decimal` [m] | Starter → Ladebooster |
| `boosterToService` | `decimal` [m] | Ladebooster → Versorgerbatterie |
| `solarToRegulator` | `decimal` [m] | PV → Laderegler |
| `regulatorToService` | `decimal` [m] | Laderegler → Versorgerbatterie |
| `chargerToService` | `decimal` [m] | Landlader → Versorgerbatterie |
| `serviceToInverter` | `decimal` [m] | Versorgerbatterie → Wechselrichter |
| `batteryToFuseBox` | `decimal` [m] | Versorgerbatterie → Sicherungskasten |

---

# Teil B — Konstanten & Grenzen

Hier: **keine** physikalischen Modellkonstanten (DoD, PSH, Wirkungsgrade) — die definiert der neue Algorithmus. Hier nur **Schnittstellen- und Produktkonstanten**.

## B.1 Validierungs-Obergrenzen (Wizard-Schema)

Quelle: `src/lib/schemas/wizard-input.ts`

| Konstante | Typ | Wert | Bedeutung |
|-----------|-----|------|-----------|
| `MAX_POWER_W` | `int` | `20000` | max. `Consumer.power` [W] |
| `MAX_HOURS_PER_DAY` | `int` | `24` | max. `Consumer.daily` [h/Tag] |
| `MAX_SOLAR_BAG_W` | `int` | `4000` | max. `SolarBag.power` [Wp] |
| `MAX_ROOF_DIM_CM` | `int` | `5000` | max. `RoofArea.length` / `width` [cm] (= 50 m) |
| `MAX_CABLE_LENGTH_M` | `int` | `100` | max. jede Kabellänge [m] |

## B.2 Obergrenze Autarkie-Tage im Wizard (`getAutarchyWizardMaxDays`)

Quelle: `src/lib/wizard/autarchy-ui.ts` + `src/lib/algorithm/constants.ts` (`MAX_AUTARCHY_DAYS`).

**Top-Up-Profil** (aus `energySources` — Shore Power zählt nicht):

| Profile | Bedingung |
|---------|-----------|
| `battery_only`  | weder `solar` noch `alternator` |
| `solar_or_alt`  | genau eine der beiden Quellen |
| `solar_and_alt` | beide Quellen |

**Cap (inklusive) je `(tripDuration, profile)`:**

| `tripDuration` | `battery_only` | `solar_or_alt` | `solar_and_alt` |
|----------------|----------------|----------------|-----------------|
| `weekend`   | `3`  | `5`  | `7`  |
| `week`      | `7`  | `10` | `14` |
| `extended`  | `14` | `30` | `45` |
| `permanent` | `21` | `60` | `90` |

Der Slider setzt `autarchyDays` als `int` im Bereich **1 … `maxDays`**. Preset-Karten skalieren adaptiv:

| Preset-ID | Typ | Ziel-Tage | Effekt |
|-----------|-----|-----------|--------|
| `weekend` | `literal` | `min(2, maxDays)` | kurzer Puffer |
| `holiday` | `literal` | `~ round(maxDays · 0.4)`, Floor 3 | auf `maxDays` gekappt |
| `full`    | `literal` | `~ round(maxDays · 0.85)`, Floor 5 | auf `maxDays` gekappt |

Preset-Typ `AutarchyPreset`: `enum` `weekend` \| `holiday` \| `full` (nur UI, nicht im `AlgorithmInput` gespeichert).

## B.3 Sonderwert Autarkie

| Wert | Typ | Bedeutung |
|------|-----|-----------|
| `999` | `int` | Domain: „Maximum / unbegrenzt“. Schema erlaubt 1…999; Wizard kann bei `maxDays < 999` auf `maxDays` zurücksetzen. |

## B.4 Aufzählungstypen (Komplettlisten)

Diese Mengen sind **geschlossen** — keine anderen Strings erlaubt, sofern nicht erweitert:

- `SystemVoltage` / gleiche Literals für DC-Consumer: `12`, `24`, `48` (`int` literale)
- `BatteryPreference`: `lifepo4`, `agm`, `gel`
- `EnergySource`: `solar`, `alternator`, `shore_power`
- `RoofModuleType`: `rigid`, `flexible`
- `ChargerSpeed`: `slow`, `normal`, `fast`
- `SimultaneousLoad`: `low`, `moderate`, `high`
- `Season`: `summer`, `all_year`, `winter`
- `TripDuration`: `weekend`, `week`, `extended`, `permanent`
- `WinterLocation`: `scandinavia`, `germany`, `southern`, `eastern`, `varies`
- `StandingDuration`: `short`, `medium`, `long`
- `ControllerType` (nur Ausgabe): `mppt`, `pwm` — geforderter Output nutzt faktisch nur `mppt`

## B.5 Kabel-Routen-IDs (Ausgabe, feste Strings)

`CableRecommendation.route` muss einer dieser Werte sein (`string` mit festem Inhalt):

- `starter_to_booster`
- `booster_to_service`
- `charger_to_service`
- `service_to_inverter`
- `solar_to_regulator`
- `regulator_to_service`
- `battery_to_fuse_box`

---

# Teil C — Ausgaben

Top-Level: **`AlgorithmOutput`** — Objekt mit den Keys `battery`, `solar`, `booster`, `charger`, `inverter`, `controller`, `cables`.

**Vereinbarung:** reine **Rohzahlen** (`decimal` / `int` / `boolean`); **keine** marketing-Klartexte aus dem Algorithmus. **Keine** Rundung auf Handelsgrößen — nachgelagerte KI übernimmt das.

*Hinweis zum bestehenden TypeScript-Typ:* Felder wie `solar.recommendation` oder `recommendedCrossSection` existieren noch im Code. Bis der Typ angepasst ist: `recommendation` als leerer `string` `""` setzen; `recommendedCrossSection` = gleicher Rohwert wie `minCrossSection` (nachgelagerte KI überschreibt).

## C.1 `battery` — `BatteryRecommendation`

| Feld | Typ | Einheit / Bezug |
|------|-----|-----------------|
| `dailyWh` | `decimal` | [Wh/Tag] |
| `minCapacityAh` | `decimal` | [Ah] |
| `recommendedCapacityAh` | `decimal` | [Ah] |
| `type` | `enum` | gleiche Menge wie `batteryPreference` |
| `voltage` | `literal` `12` \| `24` \| `48` | [V] |
| `autarchyDays` | `decimal` oder `int` | geklammter Slider-Wert (maxDays aus `tripDuration × energySources`) |
| `hasSolar` | `boolean` | |
| `hasAlternator` | `boolean` | |
| `solarTopUpWh` | `decimal` | [Wh/Tag] — Solar-Nachschub während der Autarkie (PSH × `AUTARCHY_PSH_DERATE`); `0` ohne Solar |
| `alternatorTopUpWh` | `decimal` | [Wh/Tag] — Alternator-Nachschub (ohne Batterie-Acceptance-Clamp); `0` ohne `alternator` |
| `dailyTopUpWh` | `decimal` | [Wh/Tag] — Summe beider Top-Ups |
| `netDailyDeficitWh` | `decimal` | [Wh/Tag] — `max(dailyWh - dailyTopUpWh, 0)` |
| `bindingBranch` | `enum` `soft` \| `hard` | `hard` wenn der 1-Tages-Floor größer wurde als `netDeficit · autarchyDays` |
| `shoreBridgeReliefBaseDays` | `decimal` | [Tage] — Landstrom-Basis-Relief für Soft-Bridge |
| `shoreBridgeReliefEffectiveDays` | `decimal` | [Tage] — Relief nach Schwelle + Ladebooster-Skalierung |
| `shoreReliefAlternatorScale` | `decimal` | dimensionslos |
| `autarchyBridgeDaysRaw` | `decimal` | [Tage] — vor Landstrom-Relief |
| `autarchyBridgeDaysForSoft` | `decimal` | [Tage] — Multiplikator auf `bridgeDailyDeficitWh` |

## C.2 `solar` — `SolarRecommendation`

| Feld | Typ | Einheit |
|------|-----|---------|
| `needed` | `boolean` | |
| `requiredWp` | `decimal` | [Wp] |
| `maxRoofWp` | `decimal` | [Wp] |
| `portableWp` | `decimal` | [Wp] aus Summe / Plan `solarBags` |
| `totalAvailableWp` | `decimal` | [Wp] |
| `dailySolarYieldWh` | `decimal` | [Wh/Tag] |
| `solarShortfallWh` | `decimal` | [Wh/Tag], ≥ 0 |
| `recommendation` | `string` | **Pflicht im aktuellen TS-Typ:** leerer String `""`, wenn keine Texte aus dem Algorithmus |

## C.3 `booster` — `BoosterRecommendation`

| Feld | Typ | Einheit |
|------|-----|---------|
| `needed` | `boolean` | |
| `inputCurrentA` | `decimal` | [A] |
| `outputCurrentA` | `decimal` | [A] |
| `currentA` | `decimal` | [A] — gleich `outputCurrentA` (Legacy, TS-pflichtig) |
| `inputVoltage` | `literal` `12` \| `24` \| `48` | [V] |
| `outputVoltage` | `literal` `12` \| `24` \| `48` | [V] |
| `needsConversion` | `boolean` | |
| `dailyAlternatorChargeWh` | `decimal` | [Wh/Tag] |
| `originalCurrentA` | `optional` `decimal` | [A] — nur wenn ihr Zwischenwerte ausgeben wollt |

## C.4 `charger` — `ChargerRecommendation`

| Feld | Typ | Einheit |
|------|-----|---------|
| `needed` | `boolean` | |
| `targetCurrentA` | `decimal` | [A] |
| `recommendedCurrentA` | `decimal` | [A] Rohwert |
| `chargingTimeHours` | `decimal` | [h] |
| `originalRecommendedCurrentA` | `optional` `decimal` | [A] |

## C.5 `inverter` — `InverterRecommendation`

| Feld | Typ | Einheit |
|------|-----|---------|
| `needed` | `boolean` | |
| `peakLoadW` | `decimal` | [W] |
| `recommendedW` | `decimal` | [W] Rohwert |
| `originalRecommendedW` | `optional` `decimal` | [W] |

## C.6 `controller` — `ControllerRecommendation`

| Feld | Typ | Einheit |
|------|-----|---------|
| `needed` | `boolean` | |
| `type` | `enum` `mppt` \| `pwm` | fachlich immer `mppt` |
| `currentA` | `decimal` | [A] |
| `maxInputWp` | `decimal` | [Wp] |
| `originalCurrentA` | `optional` `decimal` | [A] |

## C.7 `cables` — `array<CableRecommendation>`

Pro Eintrag:

| Feld | Typ | Einheit / Werte |
|------|-----|-----------------|
| `route` | `string` | eine ID aus Teil B.5 |
| `displayName` | `string` | z. B. deutsch, für UI |
| `lengthM` | `decimal` | [m] |
| `currentA` | `decimal` | [A] |
| `voltage` | `decimal` | [V] |
| `minCrossSection` | `decimal` | [mm²] |
| `recommendedCrossSection` | `decimal` | [mm²] — im Rohwert-Sinn = `minCrossSection`, bis Typ entschlackt wird |
| `isCritical` | `boolean` | strengere Spannungsfall-Route ja/nein |

---

## Offene fachliche Frage (nicht Typ)

- **DC-Gleichzeitigkeit:** Soll `simultaneousLoad` nur den 230-V-Peak steuern oder identisch die DC-Sicherungskasten-/Hauptleitungs-Logik?

---

*Datei-Pfad zum Kopieren: `docs/algorithm-input-output-brief.md`*
