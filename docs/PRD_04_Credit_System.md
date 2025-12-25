# PowerSetup – Credit-System & Zahlung

## Übersicht

- **Zahlungsanbieter**: PayPal (MVP), später erweiterbar
- **Modell**: Credits, accountlos
- **Bindung**: Credits an Ergebnis-ID gebunden

---

## Credit-Flow

```
1. User füllt Formular aus
   ↓
2. Ergebnis-ID wird generiert (UUID)
   ↓
3. Kostenlos sichtbar:
   - Produktempfehlungen
   - Verbrauchsübersicht
   ↓
4. CTA: "Schaltplan generieren"
   ↓
5. Optional: Paket wählen (falls mehrere Pläne gewünscht)
   ↓
6. PayPal-Checkout
   ↓
7. Credits der Ergebnis-ID gutschreiben
   ↓
8. PDF-Generierung starten
   ↓
9. Download verfügbar
```

---

## Preisstruktur

| Paket | Credits | Preis | Pro Credit |
|-------|---------|-------|------------|
| Einzel | 1 | 4,99 € | 4,99 € |
| Starter | 3 | 9,99 € | 3,33 € |
| Pro | 10 | 24,99 € | 2,50 € |

> Credits verfallen nach 90 Tagen (mit Ergebnis-ID)

---

## Was kostet / Was ist kostenlos?

### Kostenlos
- Formular ausfüllen
- Produktempfehlungen anzeigen
- Verbrauchsübersicht
- Formular-Eingaben ändern
- URL teilen

### Kostenpflichtig (1 Credit)
- PDF-Schaltplan generieren
- Jede **neue** PDF-Generierung (auch nach Änderungen)

---

## PayPal-Integration

### Flow
1. User klickt "Kaufen"
2. PayPal-Button öffnet Checkout
3. User bestätigt Zahlung
4. Webhook: Zahlung erfolgreich
5. Credits werden gutgeschrieben
6. User wird zurückgeleitet

### API-Endpunkte
```
POST /api/payments/create-order
  → Erstellt PayPal-Order
  
POST /api/payments/capture-order
  → Bestätigt Zahlung, schreibt Credits gut
  
POST /api/webhooks/paypal
  → Webhook für Status-Updates
```

---

## Datenmodell

```prisma
model CreditPurchase {
  id              String   @id @default(uuid())
  resultId        String   // Verknüpfung zum Ergebnis
  
  // PayPal
  paypalOrderId   String   @unique
  paypalStatus    String   // CREATED, APPROVED, COMPLETED
  
  // Paket
  packageType     String   // "single", "starter", "pro"
  credits         Int
  amount          Float
  currency        String   @default("EUR")
  
  // Timestamps
  createdAt       DateTime @default(now())
  completedAt     DateTime?
}

model CreditBalance {
  resultId        String   @id // 1:1 mit Result
  credits         Int      @default(0)
  updatedAt       DateTime @updatedAt
}

model CreditUsage {
  id              String   @id @default(uuid())
  resultId        String
  credits         Int      // Immer 1 für eine PDF
  usedFor         String   // "pdf_generation"
  version         Int      // Result-Version
  createdAt       DateTime @default(now())
}
```

---

## Sicherheit

### Betrugsschutz
- Credits nur nach PayPal-Bestätigung
- Webhook-Signatur verifizieren
- Rate Limiting auf Payment-Endpoints

### Replay-Schutz
- `paypalOrderId` ist unique
- Keine doppelte Gutschrift möglich

---

## UI-Komponenten

### Kauf-Button
```
┌─────────────────────────────────┐
│  🔓 Schaltplan generieren       │
│  4,99 € (PayPal)                │
└─────────────────────────────────┘
```

### Paket-Auswahl
```
┌─────────────┬─────────────┬─────────────┐
│   Einzel    │   Starter   │     Pro     │
│   1 Plan    │   3 Pläne   │   10 Pläne  │
│   4,99 €    │   9,99 €    │   24,99 €   │
│             │   -33%      │   -50%      │
└─────────────┴─────────────┴─────────────┘
```

### Credits-Anzeige (nach Kauf)
```
┌─────────────────────────────────┐
│  ✅ 3 Credits verfügbar         │
│  Gültig bis: 25.03.2026         │
└─────────────────────────────────┘
```

---

## Zukunft (nicht MVP)

- Stripe-Integration
- Apple Pay / Google Pay
- Gutschein-Codes
- Firmen-Rechnungen
