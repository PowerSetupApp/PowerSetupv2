# Algorithmus-Brief: Eingaben, Konstanten, Ausgaben (mit Typen)

Dieses Dokument ist die **kanonische Spezifikation** für eine KI, die einen neuen Berechnungs-Algorithmus entwirft. Es beschreibt nur **Datenformen und Grenzen** — keine Rechenlogik.

**Trennung:**

1. **Nutzer-Eingaben** — alles, was aus dem Wizard (und ggf. ergänzende Listen wie `solarBags`) in den Algorithmus fließt.
2. **Konstanten & Grenzen** — feste Wertemengen, Einheiten, Validierungs-Obergrenzen und UI-abgeleitete Schranken (keine physikalischen Algorithmus-Konstanten wie DoD oder PSH — die legt der neue Algorithmus selbst fest).
3. **Ausgaben** — alles, was der Algorithmus zurückliefert (Rohzahlen; Rundung und Klartexte außerhalb).

Referenz im Code (Formen, nicht Logik): `AlgorithmInput` / `AlgorithmOutput` in `src/lib/algorithm/types.ts`; Validierung des Wizard-Body: `src/lib/schemas/wizard-input.ts`.

---

## Legende: Typbezeichnungen


| Typbezeichnung       | Bedeutung                                                       |
| -------------------- | --------------------------------------------------------------- |
| `string`             | Text (UTF-8), beliebige Länge sofern nicht anders begrenzt      |
| `string (non-empty)` | Text, mindestens 1 Zeichen                                      |
| `int`                | Ganzzahl (kein Bruchteil)                                       |
| `decimal`            | Fließkommazahl (IEEE double), endliche Werte                    |
| `boolean`            | `true` oder `false`                                             |
| `literal`            | genau einer der aufgeführten Werte                              |
| `enum`               | feste Menge von `literal`-Werten (wie `literal`, nur gruppiert) |
| `array<T>`           | Liste von `T`, 0…n Elemente sofern nicht anders begrenzt        |
| `object { … }`       | zusammengesetzter Datensatz mit benannten Feldern               |
| `optional`           | Feld darf fehlen (`undefined`)                                  |
| `nullable`           | Feld darf `null` sein                                           |


**Einheiten** in Klammern hinter dem Feldnamen: `[V]`, `[W]`, `[Wh]`, `[Ah]`, `[A]`, `[h]`, `[m]`, `[cm]`, `[mm²]`, `[Wp]` — Zahlen sind **numerische Werte** (`int` oder `decimal`) in genau dieser Einheit, sofern nicht als dimensionslos bezeichnet.

---

# Teil A — Nutzer-Eingaben

Alle Felder gehören zum Objekt `**AlgorithmInput`** (bzw. dessen Teilobjekten). Marken und manuelle Overrides sind **kein** Algorithmus-Input und fehlen hier. `**alternatorTier`** ist kein Wizard-Feld und fehlt ebenfalls.

## A.1 Schritt 1 — System-Basis


| Feld                | Typ       | Beschreibung |
| ------------------- | --------- | ------------ |
| `systemVoltage`     | `literal` | `12`         |
| `vehicleVoltage`    | `literal` | `12`         |
| `batteryPreference` | `enum`    | `lifepo4`    |


## A.2 Schritt 2 — Energiequellen


| Feld             | Typ             | Beschreibung                         |
| ---------------- | --------------- | ------------------------------------ |
| `energySources`  | `array<enum>`   | Jeder Eintrag eines aus: `solar`     |
| `roofModuleType` | `enum`          | `rigid`                              |
| `roofAreas`      | `array<object>` | Rechteckige Dachflächen, siehe A.2.1 |
| `solarBags`      | `array<object>` | Portable Solartaschen, siehe A.2.2   |
| `chargerSpeed`   | `enum`          | `slow`                               |


### A.2.1 Objekt `RoofArea` (ein Element von `roofAreas`)


| Feld     | Typ                  | Beschreibung                                        |
| -------- | -------------------- | --------------------------------------------------- |
| `id`     | `string (non-empty)` | stabile ID                                          |
| `name`   | `string (non-empty)` | Anzeigename                                         |
| `length` | `decimal`            | Länge [cm], ≥ 0, ≤ `MAX_ROOF_DIM_CM` (siehe Teil B) |
| `width`  | `decimal`            | Breite [cm], ≥ 0, ≤ `MAX_ROOF_DIM_CM`               |


### A.2.2 Objekt `SolarBag` (ein Element von `solarBags`)


| Feld    | Typ                  | Beschreibung                                                           |
| ------- | -------------------- | ---------------------------------------------------------------------- |
| `id`    | `string (non-empty)` | stabile ID                                                             |
| `power` | `decimal`            | Peak-Leistung der Tasche [Wp], ≥ 0, ≤ `MAX_SOLAR_BAG_W` (siehe Teil B) |


## A.3 Schritt 3 — Verbraucher


| Feld               | Typ             | Beschreibung                     |
| ------------------ | --------------- | -------------------------------- |
| `consumers`        | `array<object>` | Liste; jedes Element siehe A.3.1 |
| `simultaneousLoad` | `enum`          | `low`                            |


### A.3.1 Objekt `Consumer`


| Feld                 | Typ                             | Beschreibung                                                                            |
| -------------------- | ------------------------------- | --------------------------------------------------------------------------------------- |
| `id`                 | `string (non-empty)`            | UUID oder andere stabile ID                                                             |
| `name`               | `string (non-empty)`            | Gerätename                                                                              |
| `power`              | `decimal`                       | Nennleistung [W], ≥ 0, ≤ `MAX_POWER_W`                                                  |
| `daily`              | `decimal`                       | Nutzungsdauer [h/Tag], ≥ 0, ≤ `MAX_HOURS_PER_DAY`                                       |
| `voltage`            | `literal`                       | `12`                                                                                    |
| `coolingMethod`      | `optional` `enum` `compressor`  | `absorber`                                                                              |
| `electricShare`      | `optional` `decimal`            | Anteil elektrisch bei Absorber, 0…1                                                     |
| `averageLoadPercent` | `optional` `int`                | 1…100, Durchschnittslast relativ zu `power` für Tages-Wh (fehlend = volle Nennleistung) |
| `sourceDeviceId`     | `optional` `string (non-empty)` | Katalog-Referenz, nur Metadaten                                                         |
| `deviceIcon`         | `optional` `string`             | `null`                                                                                  |
| `categoryIcon`       | `optional` `string`             | `null`                                                                                  |
| `showHoursField`     | `optional` `boolean`            | UI: Stundenfeld anzeigen                                                                |
| `dailyStep`          | `optional` `decimal`            | UI: Schrittweite h/Tag, > 0                                                             |


*Nur für den Algorithmus zwingend: `id`, `name`, `power`, `daily`, `voltage` und ggf. Kühlfelder / `averageLoadPercent`.*

**AC-Erkennung:** `voltage === 230` ist der eindeutige Marker, dass die Last über den Wechselrichter läuft. Der Algorithmus trennt darüber den AC-Anteil (für `inverter.peakLoadW` und `η_inv`-Aufschlag auf `dailyWh`) vom reinen DC-Anteil. Einen zusätzlichen Flag (z. B. `loadType`) gibt es bewusst nicht.

## A.4 Schritt 4 — Reiseverhalten (`travelBehavior`)


| Feld               | Typ    | Beschreibung  |
| ------------------ | ------ | ------------- |
| `season`           | `enum` | `summer`      |
| `tripDuration`     | `enum` | `weekend`     |
| `winterLocation`   | `enum` | `scandinavia` |
| `standingDuration` | `enum` | `short`       |


**UI-Konstante (kein Schema):** `tripDuration = permanent` ist nur wählbar, wenn `season = all_year`.

## A.5 Schritt 5 — Autarkie


| Feld           | Typ   | Beschreibung                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autarchyDays` | `int` | 1…999 laut Schema; **Wizard-Obergrenze** dynamisch aus `(tripDuration, energySources)` (siehe B.2). **Semantik: „weiche Autarkie"** — Solar (`solar`) und Lichtmaschine (`alternator`) speisen während der Tage weiter ein; die Batterie deckt nur die Rest-Lücke. Ohne `solar`/`alternator` fällt der Cap deutlich. Sonderwert `999` = „Maximum / unbegrenzt“ — der Wizard klappt `999` auf `maxDays` ein. |


## A.6 Schritt 6 — Kabellängen (`cableLengths`)

Alle Werte: `decimal`, Länge [m], ≥ 0, jeweils ≤ `MAX_CABLE_LENGTH_M`.


| Feld                 | Typ           | Bedeutung der Strecke                |
| -------------------- | ------------- | ------------------------------------ |
| `starterToService`   | `decimal` [m] | Starter → Ladebooster                |
| `boosterToService`   | `decimal` [m] | Ladebooster → Versorgerbatterie      |
| `solarToRegulator`   | `decimal` [m] | PV → Laderegler                      |
| `regulatorToService` | `decimal` [m] | Laderegler → Versorgerbatterie       |
| `chargerToService`   | `decimal` [m] | Landlader → Versorgerbatterie        |
| `serviceToInverter`  | `decimal` [m] | Versorgerbatterie → Wechselrichter   |
| `batteryToFuseBox`   | `decimal` [m] | Versorgerbatterie → Sicherungskasten |


---

## A.7 Abgeleitete Signale (vom Algorithmus besessen)

Diese Werte sind **keine** neuen Wizard-Felder. Sie werden vom Algorithmus aus bestehenden Eingaben abgeleitet und sind hier nur dokumentiert, damit die Ableitung deterministisch und überprüfbar ist.

### A.7.1 Fahrenergie-Proxy (`driveHoursPerDay`)

Nur relevant, wenn `'alternator' ∈ energySources`. Ansonsten `0`.


| `tripDuration` | `standingDuration` | `driveHoursPerDay` [h]        |
| -------------- | ------------------ | ----------------------------- |
| `weekend`      | —                  | `0.5`                         |
| `week`         | `short`            | `1.0`                         |
| `week`         | `medium`           | `0.75`                        |
| `week`         | `long`             | `0.5`                         |
| `extended`     | `short`            | `1.5`                         |
| `extended`     | `medium`           | `1.0`                         |
| `extended`     | `long`             | `0.5`                         |
| `permanent`    | —                  | `0.5` (überwiegend stationär) |


Benutzung: `dailyAlternatorChargeWh = driveHoursPerDay · outputCurrentA · U_system · η_B2B`.

### A.7.2 Shore-Verfügbarkeit (`shoreAvailability`)

Nur relevant, wenn `'shore_power' ∈ energySources`. Ansonsten `never`.


| Bedingung                                            | `shoreAvailability` | Effekt auf `charger`                         |
| ---------------------------------------------------- | ------------------- | -------------------------------------------- |
| `chargerSpeed = slow`                                | `occasional`        | kleiner Lader (0.1–0.15 C)                   |
| `chargerSpeed = normal`                              | `nightly`           | mittlerer Lader (0.2–0.3 C)                  |
| `chargerSpeed = fast`                                | `nightly_fast`      | großer Lader (0.4–0.5 C, LFP-Obergrenze)     |
| `tripDuration = permanent` und `chargerSpeed ≠ slow` | `full_time`         | Dauerbetrieb, Lader ≥ Verbrauchsdurchschnitt |


`charger.needed = (shoreAvailability ≠ never)`.

### A.7.3 Peak-Faktor aus `simultaneousLoad`

Multiplikator auf `peakLoadW` (Summe der AC-Lasten), um Motor-/Kompressor-Inrush abzudecken:


| `simultaneousLoad` | Peak-Faktor |
| ------------------ | ----------- |
| `low`              | `1.25`      |
| `moderate`         | `1.5`       |
| `high`             | `2.0`       |


`inverter.recommendedW = peakLoadW · peakFactor`, dann Rundung (nachgelagerte KI).

---

# Teil B — Konstanten & Grenzen

Hier: **keine** physikalischen Modellkonstanten (DoD, PSH, Wirkungsgrade) — die definiert der neue Algorithmus. Hier nur **Schnittstellen- und Produktkonstanten**.

## B.1 Validierungs-Obergrenzen (Wizard-Schema)

Quelle: `src/lib/schemas/wizard-input.ts`


| Konstante            | Typ   | Wert    | Bedeutung                                      |
| -------------------- | ----- | ------- | ---------------------------------------------- |
| `MAX_POWER_W`        | `int` | `20000` | max. `Consumer.power` [W]                      |
| `MAX_HOURS_PER_DAY`  | `int` | `24`    | max. `Consumer.daily` [h/Tag]                  |
| `MAX_SOLAR_BAG_W`    | `int` | `4000`  | max. `SolarBag.power` [Wp]                     |
| `MAX_ROOF_DIM_CM`    | `int` | `5000`  | max. `RoofArea.length` / `width` [cm] (= 50 m) |
| `MAX_CABLE_LENGTH_M` | `int` | `100`   | max. jede Kabellänge [m]                       |


## B.2 Obergrenze Autarkie-Tage im Wizard (`getAutarchyWizardMaxDays`)

Quelle: `src/lib/wizard/autarchy-ui.ts` + `src/lib/algorithm/constants.ts` (`MAX_AUTARCHY_DAYS`).

**Top-Up-Profil** aus `energySources` (Shore Power zählt nicht — hilft off-grid nicht):

| Profile         | Bedingung (aus `energySources`)             |
| --------------- | ------------------------------------------- |
| `battery_only`  | weder `solar` noch `alternator` ausgewählt  |
| `solar_or_alt`  | genau eine der beiden Quellen ausgewählt    |
| `solar_and_alt` | `solar` **und** `alternator` ausgewählt     |

**Cap (inklusive) je `(tripDuration, profile)`:**

| `tripDuration` | `battery_only` | `solar_or_alt` | `solar_and_alt` |
| -------------- | -------------- | -------------- | --------------- |
| `weekend`      | `3`            | `5`            | `7`             |
| `week`         | `7`            | `10`           | `14`            |
| `extended`     | `14`           | `30`           | `45`            |
| `permanent`    | `21`           | `60`           | `90`            |


Der Slider setzt `autarchyDays` als `int` im Bereich **1 … `maxDays`**. Preset-Karten skalieren **adaptiv** auf das aktuelle `maxDays`:


| Preset-ID | Typ       | Ziel-Tage                                      | Effekt                                          |
| --------- | --------- | ---------------------------------------------- | ----------------------------------------------- |
| `weekend` | `literal` | `min(2, maxDays)`                              | kurzer Puffer                                   |
| `holiday` | `literal` | `~ round(maxDays · 0.4)`, Mindestziel `3` Tage | gekappt auf `maxDays`                           |
| `full`    | `literal` | `~ round(maxDays · 0.85)`, Mindestziel `5`     | gekappt auf `maxDays`                           |


Preset-Typ `AutarchyPreset`: `enum` `weekend`  `holiday`  `full` (nur UI, nicht im `AlgorithmInput` gespeichert).

## B.3 Sonderwert Autarkie


| Wert  | Typ   | Bedeutung                                                                                                         |
| ----- | ----- | ----------------------------------------------------------------------------------------------------------------- |
| `999` | `int` | Domain: „Maximum / unbegrenzt“. Schema erlaubt 1…999; Wizard kann bei `maxDays < 999` auf `maxDays` zurücksetzen. |


## B.4 Aufzählungstypen (Komplettlisten)

Diese Mengen sind **geschlossen** — keine anderen Strings erlaubt, sofern nicht erweitert:

- `SystemVoltage`: `12`, `24`, `48` (`int` literale) — gilt für `systemVoltage`, `vehicleVoltage`, `battery.voltage`, `booster.inputVoltage`, `booster.outputVoltage`.
- `ConsumerVoltage`: `12`, `24`, `48`, `230` (`int` literale) — `230` ist **nur** für `Consumer.voltage` erlaubt und markiert AC-Lasten über den Wechselrichter. Niemals als System- oder Batteriespannung verwenden.
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

## B.6 Algorithmus-Konstanten (intern, keine Wizard-Felder)

Diese Werte sind im Algorithmus fix benannt und dokumentiert. Sie dürfen pro Aufruf überschrieben werden, sind aber **nicht** Teil des Nutzer-Inputs.


| Konstante                 | Typ       | Wert                                                                              | Bedeutung / Quelle                                                                             |
| ------------------------- | --------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `INVERTER_EFFICIENCY`     | `decimal` | `0.9`                                                                             | η_inv für Umrechnung AC-Wh → DC-Wh (typisch pure-sine, mittlere Last)                          |
| `INVERTER_STANDBY_W`      | `int`     | `10`                                                                              | Leerlaufverbrauch eines mittleren Wechselrichters; wird nur addiert, wenn AC-Lasten existieren |
| `INVERTER_STANDBY_HOURS`  | `int`     | `24`                                                                              | Betriebsstunden/Tag für Standby (default = dauerhaft an); per AC-Verhalten korrigierbar        |
| `BOOSTER_EFFICIENCY`      | `decimal` | `0.9`                                                                             | η_B2B für Starter-Strom und Ladeenergie                                                        |
| `CHARGER_EFFICIENCY`      | `decimal` | `0.92`                                                                            | η_shoreCharger für Zeitberechnung und AC-Seite                                                 |
| `SOLAR_SYSTEM_EFFICIENCY` | `decimal` | `0.75`                                                                            | η_system für PV-Flachdach + MPPT + LFP                                                         |
| `DOD_DEFAULTS`            | `object`  | `{ lifepo4: 0.85, agm: 0.5, gel: 0.5 }`                                           | Nutzbare Entladetiefe je Chemie                                                                |
| `ROUNDTRIP_DEFAULTS`      | `object`  | `{ lifepo4: 0.95, agm: 0.83, gel: 0.8 }`                                          | Lade-/Entlade-Wirkungsgrad                                                                     |
| `RESERVE_FACTOR`          | `decimal` | `1.25`                                                                            | Aufschlag auf Batterie-Ah (Kälte, Alterung, Sicherheitsmarge)                                  |
| `PSH_TABLE`               | `object`  | siehe [solar.md](.agents/skills/mobile-home-electrics-basics/references/solar.md) | Peak Sun Hours je Region / Saison                                                              |
| `AUTARCHY_PSH_DERATE`     | `decimal` | `0.5`                                                                             | Derate auf Saison-PSH während der Autarkie-Brücke (bewölkte Woche innerhalb der gewählten Saison — ≈ 50 % der Saison-PSH). Die PSH-Tabelle deckt Nord-Süd bereits ab; der Multiplikator wird darauf angewendet. Kalibriert gegen 7-Jahre-Praxis: 1 kWp in Südspanien ergibt für einen Permanent-Nutzer mit 1,7 kWh/Tag ≈ 250 Ah Empfehlung. Nur im Batterie-Phase-Input — `sizeSolar` nutzt die rohe PSH. |
| `AUTARCHY_MAX_BRIDGE_DAYS` | `int`    | `7`                                                                               | Physikalische Obergrenze der Schlechtwetter-Brücke: `effectiveBridgeDays = min(autarchyDays, 7)`. Längere ununterbrochene Schlechtwetter-Strecken treten in europäischen Klimazonen praktisch nicht am Stück auf; oberhalb dominieren die Saison-Mittel. |
| `TOP_UP_COVERAGE_CAP`    | `decimal` | `0.75`                                                                            | Basis-Obergrenze für die Deckungsquote `coverageRatio = min(rawCoverage, effectiveCap)`. Ohne diesen Cap kollabiert die Brücke auf 0 und der Slider wirkt nicht mehr. |
| `TOP_UP_COVERAGE_PORTABLE_WEIGHT` | `decimal` | `0.55`                                                                   | Gewicht: je Anteil `portableBridgeSolarWh / dailyWh` hebt sich `effectiveCap` über `TOP_UP_COVERAGE_CAP` (Solartaschen sind ausrichtbar → marginal mehr Deckung in der Brücke). |
| `TOP_UP_COVERAGE_PORTABLE_CAP_BUMP` | `decimal` | `0.18`                                                                 | Maximaler Zuschlag auf `TOP_UP_COVERAGE_CAP` durch Taschen (Cap ≤ `TOP_UP_COVERAGE_ABS_MAX`). |
| `TOP_UP_COVERAGE_ABS_MAX` | `decimal` | `0.97`                                                                            | Globales Deckungs-Maximum (nie 100 % ohne Batterie). |
| `HARD_BRIDGE_DAYS`       | `decimal` | `1.0`                                                                             | Harte Mindest-Tage, die die Batterie ohne jeden Nachschub allein decken muss (Parktag bei Sturm). Die weiche Brücke skaliert oberhalb dieses Floor mit `autarchyDays × bridgeDailyDeficit`. |


Alle Konstanten sind in `[references/batteries.md](.agents/skills/mobile-home-electrics-basics/references/batteries.md)`, `[references/solar.md](.agents/skills/mobile-home-electrics-basics/references/solar.md)`, `[references/alternator.md](.agents/skills/mobile-home-electrics-basics/references/alternator.md)`, `[references/inverter.md](.agents/skills/mobile-home-electrics-basics/references/inverter.md)` belegt.

---

# Teil C — Ausgaben

Top-Level: `**AlgorithmOutput`** — Objekt mit den Keys `battery`, `solar`, `booster`, `charger`, `inverter`, `controller`, `cables`.

**Vereinbarung:** reine **Rohzahlen** (`decimal` / `int` / `boolean`); **keine** marketing-Klartexte aus dem Algorithmus. **Keine** Rundung auf Handelsgrößen — nachgelagerte KI übernimmt das.

*Hinweis zum bestehenden TypeScript-Typ:* Felder wie `solar.recommendation` oder `recommendedCrossSection` existieren noch im Code. Bis der Typ angepasst ist: `recommendation` als leerer `string` `""` setzen; `recommendedCrossSection` = gleicher Rohwert wie `minCrossSection` (nachgelagerte KI überschreibt).

## C.1 `battery` — `BatteryRecommendation`


| Feld                    | Typ                   | Einheit / Bezug                                                                  |
| ----------------------- | --------------------- | -------------------------------------------------------------------------------- |
| `dailyWh`               | `decimal`             | [Wh/Tag]                                                                         |
| `minCapacityAh`         | `decimal`             | [Ah]                                                                             |
| `recommendedCapacityAh` | `decimal`             | [Ah]                                                                             |
| `type`                  | `enum`                | gleiche Menge wie `batteryPreference`                                            |
| `voltage`               | `literal`             | `12`                                                                             |
| `autarchyDays`          | `decimal` oder `int`  | echosierter, auf `maxDays(tripDuration, energySources)` geklammter Slider-Wert   |
| `hasSolar`              | `boolean`             | abgeleitet aus `'solar' ∈ energySources` (Convenience für nachgelagerte KI)      |
| `hasAlternator`         | `boolean`             | abgeleitet aus `'alternator' ∈ energySources` (Convenience für nachgelagerte KI) |
| `solarTopUpWh`          | `decimal`             | [Wh/Tag] — Solar-Nachschub während der Autarkie (PSH × `AUTARCHY_PSH_DERATE`); `0` ohne Solar |
| `alternatorTopUpWh`     | `decimal`             | [Wh/Tag] — Alternator-Nachschub während der Autarkie (ohne Batterie-Acceptance-Clamp, volle Fahrzeit — sobald gefahren wird, wird geladen); `0` ohne `alternator` |
| `dailyTopUpWh`          | `decimal`             | [Wh/Tag] — Summe der beiden Top-Ups                                              |
| `netDailyDeficitWh`     | `decimal`             | [Wh/Tag] — roher Defizit `max(dailyWh - dailyTopUpWh, 0)` (nur Anzeige)          |
| `coverageRatio`         | `decimal`             | Fraktion des Tagesbedarfs, die Top-ups in der Brücke decken (0..`effectiveCoverageCap`) |
| `effectiveCoverageCap`  | `decimal`             | Obergrenze in `min(rawCoverage, cap)` — Basis `TOP_UP_COVERAGE_CAP`, steigt mit `portableBridgeSolarWh` (Solartaschen) |
| `bridgeDailyDeficitWh`  | `decimal`             | [Wh/Tag] — `dailyWh × (1 − coverageRatio)`; treibt `softBridgeWh`                |
| `bindingBranch`         | `enum` `soft` \| `hard` | `hard` wenn der 1-Tages-Floor die `softBridgeWh`-Brücke schlägt                 |


## C.2 `solar` — `SolarRecommendation`


| Feld                | Typ       | Einheit                                                                                   |
| ------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `needed`            | `boolean` |                                                                                           |
| `requiredWp`        | `decimal` | [Wp]                                                                                      |
| `maxRoofWp`         | `decimal` | [Wp]                                                                                      |
| `portableWp`        | `decimal` | [Wp] aus Summe / Plan `solarBags`                                                         |
| `portableEffectiveWp` | `decimal` | [Wp] nominal × `SOLAR_BAG_ALIGNMENT_UPLIFT` × `SOLAR_BAG_UTILIZATION` (nur Batterie-Top-up; der Regler selbst wird auf nominal dimensioniert) |
| `totalAvailableWp`  | `decimal` | [Wp]                                                                                      |
| `dailySolarYieldWh` | `decimal` | [Wh/Tag]                                                                                  |
| `solarShortfallWh`  | `decimal` | [Wh/Tag], ≥ 0                                                                             |
| `recommendation`    | `string`  | **Pflicht im aktuellen TS-Typ:** leerer String `""`, wenn keine Texte aus dem Algorithmus |


## C.3 `booster` — `BoosterRecommendation`


| Feld                      | Typ                  | Einheit                                              |
| ------------------------- | -------------------- | ---------------------------------------------------- |
| `needed`                  | `boolean`            |                                                      |
| `inputCurrentA`           | `decimal`            | [A]                                                  |
| `outputCurrentA`          | `decimal`            | [A]                                                  |
| `currentA`                | `decimal`            | [A] — gleich `outputCurrentA` (Legacy, TS-pflichtig) |
| `inputVoltage`            | `literal`            | `12`                                                 |
| `outputVoltage`           | `literal`            | `12`                                                 |
| `needsConversion`         | `boolean`            |                                                      |
| `dailyAlternatorChargeWh` | `decimal`            | [Wh/Tag]                                             |
| `originalCurrentA`        | `optional` `decimal` | [A] — nur wenn ihr Zwischenwerte ausgeben wollt      |


## C.4 `charger` — `ChargerRecommendation`


| Feld                          | Typ                  | Einheit     |
| ----------------------------- | -------------------- | ----------- |
| `needed`                      | `boolean`            |             |
| `targetCurrentA`              | `decimal`            | [A]         |
| `recommendedCurrentA`         | `decimal`            | [A] Rohwert |
| `chargingTimeHours`           | `decimal`            | [h]         |
| `originalRecommendedCurrentA` | `optional` `decimal` | [A]         |


## C.5 `inverter` — `InverterRecommendation`


| Feld                   | Typ                  | Einheit     |
| ---------------------- | -------------------- | ----------- |
| `needed`               | `boolean`            |             |
| `peakLoadW`            | `decimal`            | [W]         |
| `recommendedW`         | `decimal`            | [W] Rohwert |
| `originalRecommendedW` | `optional` `decimal` | [W]         |


## C.6 `controller` / `portableController` — `ControllerRecommendation`

Zwei physische Regler: `controller` dimensioniert den **Dach-MPPT** (auf `maxRoofWp`), `portableController` dimensioniert den **Tasche-MPPT** (auf `portableWp` nominal, nicht `portableEffectiveWp` — der Regler muss die Peak-Leistung aushalten). Beide werden immer mitgeliefert (`needed = false`, wenn das jeweilige Array leer ist).


| Feld               | Typ                  | Einheit                                                                |
| ------------------ | -------------------- | ---------------------------------------------------------------------- |
| `needed`           | `boolean`            |                                                                        |
| `type`             | `literal` `mppt`     | Output liefert faktisch nur `mppt` (PWM bleibt im Enum nur reserviert) |
| `currentA`         | `decimal`            | [A]                                                                    |
| `maxInputWp`       | `decimal`            | [Wp]                                                                   |
| `scope`            | `enum` `roof` \| `portable` | Markiert Dach- vs. Tasche-Regler                                |
| `originalCurrentA` | `optional` `decimal` | [A]                                                                    |


## C.7 `cables` — `array<CableRecommendation>`

Pro Eintrag:


| Feld                      | Typ       | Einheit / Werte                                                       |
| ------------------------- | --------- | --------------------------------------------------------------------- |
| `route`                   | `string`  | eine ID aus Teil B.5                                                  |
| `displayName`             | `string`  | z. B. deutsch, für UI                                                 |
| `lengthM`                 | `decimal` | [m]                                                                   |
| `currentA`                | `decimal` | [A]                                                                   |
| `voltage`                 | `decimal` | [V] — typisch `12`                                                    |
| `minCrossSection`         | `decimal` | [mm²]                                                                 |
| `recommendedCrossSection` | `decimal` | [mm²] — im Rohwert-Sinn = `minCrossSection`, bis Typ entschlackt wird |
| `isCritical`              | `boolean` | strengere Spannungsfall-Route ja/nein                                 |


---

## Offene fachliche Fragen (nicht Typ)

- **DC-Gleichzeitigkeit:** Soll `simultaneousLoad` nur den 230-V-Peak steuern oder identisch die DC-Sicherungskasten-/Hauptleitungs-Logik?
- **Kaltladung LiFePO4 (< 0 °C):** In der ersten Version ignoriert. LFP darf laut [batteries.md](.agents/skills/mobile-home-electrics-basics/references/batteries.md) nicht unter 0 °C geladen werden. Ob eine selbstheizende LFP / ein Winter-Flag als Input nötig ist, wird für V2 entschieden, sobald Winter-Einsätze real vorkommen.

---

*Datei-Pfad zum Kopieren: `docs/algorithm-input-output-brief.md`*