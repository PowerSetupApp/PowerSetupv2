# PowerSetup – Datenbank Setup

## 1. PostgreSQL Datenbank erstellen

Wähle eine Option:

### Option A: Neon (empfohlen für Entwicklung)
1. https://neon.tech → Account erstellen
2. Neues Projekt "powersetup" erstellen
3. Connection String kopieren

### Option B: Vercel Postgres (für Production)
1. Vercel Dashboard → Storage → Create Database
2. Connection String aus Dashboard kopieren

### Option C: Lokal
```bash
# PostgreSQL installieren und starten
createdb powersetup
# Connection String: postgresql://user:password@localhost:5432/powersetup
```

---

## 2. Environment konfigurieren

Erstelle `.env` Datei im Projekt-Root:

```env
DATABASE_URL="postgresql://user:password@host:5432/powersetup?sslmode=require"
```

---

## 3. Migration ausführen

```bash
npx prisma migrate dev --name init
```

---

## 4. Prisma Studio öffnen

```bash
npx prisma studio
```

Öffnet http://localhost:5555 mit allen Tabellen.
