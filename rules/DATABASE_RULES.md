# Datenbank Regeln

## Stack
- **ORM**: Prisma
- **DB**: PostgreSQL (Vercel Postgres / Neon)
- **Validierung**: Zod-Schemas

## Kernentitäten

### Result
```prisma
model Result {
  id              String   @id @default(uuid())
  version         Int      @default(1)
  formData        Json     // Formular-Eingaben
  calculations    Json     // Berechnete Werte
  recommendations Json     // Produktempfehlungen (IDs + Snapshot)
  schematicData   Json?    // Schaltplan-Daten
  pdfUrl          String?
  creditsUsed     Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  expiresAt       DateTime // createdAt + 90 Tage
}
```

### Product
- `specs` als JSONB für technische Daten
- `specVersion` für Schema-Versionierung
- `categoryId` für Kategoriezuordnung

### CreditPurchase / CreditBalance / CreditUsage
- Credits an `resultId` gebunden (accountlos)
- `paypalOrderId` unique für Replay-Schutz

## JSONB-Nutzung
Verwende JSONB für:
- Produkt-Spezifikationen (variabel pro Kategorie)
- Formular-Daten (flexibel erweiterbar)
- Berechnungsergebnisse

## Zod-Spec-Schemas (je Kategorie)
- `BatterySpec`: type, voltage, capacity, maxChargeCurrent, cycleLife
- `InverterSpec`: inputVoltage, continuousPower, peakPower, waveform
- `ChargeControllerSpec`: type (MPPT/PWM), maxInputVoltage, maxChargeCurrent
- `BoosterSpec`: inputVoltage, maxChargeCurrent, dPlusActivation
- `SolarPanelSpec`: type, power (Wp), vmp, voc, flexible
- `FuseSpec`: type, rating (A), voltage
- `CableSpec`: crossSection (mm²), length, type

## Lifecycle
- **Erstellung**: UUID bei Formular-Abschluss
- **Versionierung**: `version++` bei Änderung
- **Ablauf**: 90 Tage → Cron-Job löscht (Hard Delete, DSGVO)

## URL-Schema
```
/result/{uuid}?v={version}
```
