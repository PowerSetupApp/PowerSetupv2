# Credit-System Regeln

## Modell
- **Accountlos**: Credits an Ergebnis-ID gebunden
- **Zahlungsanbieter**: PayPal (MVP)
- **Ablauf**: 90 Tage (mit Ergebnis-ID)

## Preisstruktur
| Paket | Credits | Preis | Pro Credit |
|-------|---------|-------|------------|
| Einzel | 1 | 4,99 € | 4,99 € |
| Starter | 3 | 9,99 € | 3,33 € |
| Pro | 10 | 24,99 € | 2,50 € |

## Kostenlos vs. Kostenpflichtig

### Kostenlos
- Formular ausfüllen & ändern
- Produktempfehlungen anzeigen
- Verbrauchsübersicht
- URL teilen

### Kostenpflichtig (1 Credit)
- PDF-Schaltplan generieren
- Jede **neue** PDF-Generierung (auch nach Änderungen)

## Credit-Flow
```
1. Formular ausgefüllt → UUID generiert
2. Kostenlose Vorschau (Produkte, Verbrauch)
3. CTA: "Schaltplan generieren"
4. PayPal-Checkout
5. Credits gutschreiben
6. PDF generieren & Download
```

## API-Endpunkte
```
POST /api/payments/create-order   → PayPal-Order erstellen
POST /api/payments/capture-order  → Zahlung bestätigen, Credits gutschreiben
POST /api/webhooks/paypal         → Webhook für Status-Updates
```

## Sicherheit
- Credits nur nach PayPal-Bestätigung
- Webhook-Signatur verifizieren
- Rate Limiting auf Payment-Endpoints
- `paypalOrderId` unique → keine doppelte Gutschrift
