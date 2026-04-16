---
name: deploy
description: Deployed PowerSetup auf Vercel. Nur manuell ausführen.
disable-model-invocation: true
---

# Deploy to Vercel

## Pre-Deploy Checks (Pflicht)

```bash
npm run build    # muss fehlerfrei durchlaufen
npm run lint     # keine Fehler
```

Außerdem prüfen:
- [ ] Alle ENV Vars in Vercel gesetzt? (`.env.example` als Checkliste)
- [ ] Prisma Migrations aktuell? (`npx prisma migrate status`)
- [ ] Kein `console.log` mit sensiblen Daten
- [ ] Feature in `features/INDEX.md` auf "In Review" gesetzt?

## Deploy

```bash
git push origin main
```

Vercel deployed automatisch bei Push auf `main`.

## Post-Deploy Verifikation

- [ ] Production URL lädt?
- [ ] `/admin` fragt nach Passwort?
- [ ] `/api/admin/products` ohne Header → 401?
- [ ] Wizard Schritt 1 lädt korrekt?
- [ ] Keine Konsolen-Fehler im Browser?

## Rollback

Vercel Dashboard → Deployments → vorheriges Deployment → "Promote to Production"

## Nach erfolgreichem Deploy

- Feature-Status in `features/INDEX.md` auf "Done" setzen
- Git Tag erstellen: `git tag v1.x.x && git push --tags`
