# PowerSetup – Datenbank & Datenmodell

## Übersicht

- **ORM**: Prisma
- **Datenbank**: PostgreSQL
- **Spezialfelder**: JSONB für technische Produktdaten
- **Validierung**: Zod-Schemas

---

## Kernentitäten

### Result (Ergebnis)
```prisma
model Result {
  id              String   @id @default(uuid())
  version         Int      @default(1)
  
  // Formular-Eingaben (JSONB)
  formData        Json
  
  // Berechnete Werte
  calculations    Json
  
  // Produktempfehlungen (IDs + Snapshot)
  recommendations Json
  
  // Schaltplan-Daten
  schematicData   Json?
  pdfUrl          String?
  
  // Credits
  creditsUsed     Int      @default(0)
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  expiresAt       DateTime // 90 Tage nach Erstellung
}
```

### Product (Produkt)
```prisma
model Product {
  id              String   @id @default(uuid())
  name            String
  description     String?
  imageUrl        String?
  affiliateUrl    String
  price           Float?
  
  // Kategorie
  categoryId      String
  category        Category @relation(fields: [categoryId], references: [id])
  
  // Technische Daten (JSONB)
  specVersion     Int      @default(1)
  specs           Json
  
  // Status
  isActive        Boolean  @default(true)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Category (Kategorie)
```prisma
model Category {
  id          String    @id @default(uuid())
  name        String
  slug        String    @unique
  icon        String?
  sortOrder   Int       @default(0)
  
  products    Product[]
}
```

### CreditPurchase (Kauf)
```prisma
model CreditPurchase {
  id              String   @id @default(uuid())
  resultId        String
  
  // PayPal
  paypalOrderId   String   @unique
  paypalStatus    String
  
  // Paket
  packageType     String   // "single", "starter", "pro"
  credits         Int
  amount          Float
  currency        String   @default("EUR")
  
  createdAt       DateTime @default(now())
}
```

---

## Produkt-Spezifikationen (Zod-Schemas)

### Gemeinsame Felder
```typescript
const BaseProductSpec = z.object({
  certifications: z.array(z.string()).optional(), // ["CE", "TÜV"]
  notes: z.string().optional(),
});
```

### Batterien
```typescript
const BatterySpec = BaseProductSpec.extend({
  type: z.enum(["AGM", "Gel", "LiFePO4"]),
  voltage: z.number(), // 12, 24
  capacity: z.number(), // Ah
  maxChargeCurrent: z.number(), // A
  maxDischargeCurrent: z.number(), // A
  cycleLife: z.number(), // Zyklen bei 80% DoD
  weight: z.number(), // kg
  dimensions: z.object({
    l: z.number(), // mm
    b: z.number(),
    h: z.number(),
  }),
  bmsIncluded: z.boolean(), // nur Lithium
});
```

### Wechselrichter
```typescript
const InverterSpec = BaseProductSpec.extend({
  inputVoltage: z.array(z.number()), // [12] oder [12, 24]
  outputVoltage: z.number(), // 230
  continuousPower: z.number(), // W
  peakPower: z.number(), // W
  waveform: z.enum(["pure_sine", "modified_sine"]),
  efficiency: z.number(), // %
  noLoadConsumption: z.number(), // W
});
```

### Solarladeregler
```typescript
const ChargeControllerSpec = BaseProductSpec.extend({
  type: z.enum(["MPPT", "PWM"]),
  maxInputVoltage: z.number(), // V
  maxChargeCurrent: z.number(), // A
  maxPvPower: z.number(), // W
  batteryVoltages: z.array(z.number()), // [12, 24]
  batteryTypes: z.array(z.enum(["AGM", "Gel", "LiFePO4"])),
});
```

### Ladebooster (B2B)
```typescript
const BoosterSpec = BaseProductSpec.extend({
  inputVoltage: z.number(), // 12 oder 24
  outputVoltage: z.number(),
  maxChargeCurrent: z.number(), // A
  batteryTypes: z.array(z.enum(["AGM", "Gel", "LiFePO4"])),
  dPlusActivation: z.boolean(),
});
```

### Solarmodule
```typescript
const SolarPanelSpec = BaseProductSpec.extend({
  type: z.enum(["mono", "poly", "thin_film"]),
  power: z.number(), // Wp
  vmp: z.number(), // V bei max. Leistung
  imp: z.number(), // A bei max. Leistung
  voc: z.number(), // Leerlaufspannung
  isc: z.number(), // Kurzschlussstrom
  dimensions: z.object({
    l: z.number(),
    b: z.number(),
    h: z.number(),
  }),
  flexible: z.boolean(),
});
```

### Sicherungen
```typescript
const FuseSpec = BaseProductSpec.extend({
  type: z.enum(["flat", "midi", "mega", "nh"]),
  rating: z.number(), // A
  voltage: z.number(), // V
});
```

### Kabel
```typescript
const CableSpec = BaseProductSpec.extend({
  crossSection: z.number(), // mm²
  length: z.number(), // m
  type: z.enum(["single", "twin", "battery"]),
  color: z.string().optional(),
});
```

---

## Ergebnis-URL & Versionierung

### URL-Schema
```
https://powersetup.de/result/{uuid}?v={version}
```

### Versionierung
- Jede Änderung der Formular-Eingaben → version++
- Alte Versionen bleiben erreichbar
- PDF-Generierung separat pro Version möglich

---

## Daten-Lifecycle

### Erstellung
1. Formular abgeschlossen → Result mit UUID erstellen
2. Berechnungen durchführen → calculations speichern
3. Produkte zuordnen → recommendations speichern

### Ablauf
- `expiresAt` = createdAt + 90 Tage
- Cron-Job: Tägliche Löschung abgelaufener Results
- **Hard Delete** (DSGVO-konform)

---

## DSGVO

- Keine User-Accounts
- Keine personenbezogenen Daten in Result
- E-Mail nur bei explizitem Opt-in (nicht im MVP)
- Automatische Löschung nach 90 Tagen
