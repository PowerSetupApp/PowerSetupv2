/**
 * Kopiert alle Daten von Prisma Postgres -> Neon (Schema per `prisma migrate deploy`, dann INSERT).
 * Prisma-Quelle: nur Lesen, keine Löschoperationen.
 *
 * env (nach dotenv .env + .env.local):
 *   PRISMA_SOURCE_URL / PRISMA_LEGACY_URL, oder DATABASE_URL solange kein neon host
 *   NEON_DIRECT_URL (darf Pooler-Hostname enthalten; wird in direct/pooler aufgeteilt) ODER
 *   NEON_DIRECT_URL + NEON_POOLER_URL explizit
 */
const { resolve } = require("node:path");
const { config: loadEnv } = require("dotenv");
const { Client } = require("pg");
const { execSync } = require("node:child_process");

const root = resolve(__dirname, "..");
loadEnv({ path: resolve(root, ".env") });
loadEnv({ path: resolve(root, ".env.local"), override: true });

function isNeonHost(s) {
  return typeof s === "string" && /neon\.tech/i.test(s);
}

function pickSourceUrl() {
  const a =
    process.env.PRISMA_SOURCE_URL ||
    process.env.PRISMA_LEGACY_URL ||
    (process.env.DATABASE_URL && !isNeonHost(process.env.DATABASE_URL) ? process.env.DATABASE_URL : null);
  if (!a) {
    throw new Error(
      "Setze PRISMA_LEGACY_URL oder PRISMA_SOURCE_URL (oder DATABASE_URL=Prisma), damit die Quelldatabase erreichbar ist.",
    );
  }
  return a.replace(/^["']|["']$/g, "");
}

/**
 * @param {string} u
 * @param {"direct" | "pooler"} kind
 */
function normalizeNeonUrl(u, kind) {
  const raw = u.replace(/^["']|["']$/g, "");
  const x = new URL(raw);
  x.searchParams.delete("channel_binding");
  if (!x.searchParams.has("sslmode")) {
    x.searchParams.set("sslmode", "require");
  }
  if (!x.searchParams.has("uselibpqcompat")) {
    x.searchParams.set("uselibpqcompat", "true");
  }
  const h = x.hostname;
  const hasPooler = h.includes("-pooler");
  if (kind === "direct" && hasPooler) {
    x.hostname = h.replace("-pooler", "");
  }
  if (kind === "pooler" && !hasPooler) {
    const i = h.indexOf(".c-");
    if (i > 0) {
      x.hostname = h.slice(0, i) + "-pooler" + h.slice(i);
    }
  }
  return x.toString();
}

function pickNeonUrls() {
  const d = process.env.NEON_DIRECT_URL;
  if (!d) {
    throw new Error("Setze NEON_DIRECT_URL (am einf: aus der Neon-Console; ggf. Host mit oder ohne -pooler).");
  }
  const direct = normalizeNeonUrl(d, "direct");
  const pooler = process.env.NEON_POOLER_URL
    ? normalizeNeonUrl(process.env.NEON_POOLER_URL, "pooler")
    : normalizeNeonUrl(d, "pooler");
  if (!isNeonHost(direct) || !isNeonHost(pooler)) {
    throw new Error("NEON_DIRECT_URL/POOLER muss ein Neon-Hostname (neon.tech) enthalten.");
  }
  return { direct: direct, pooler: pooler };
}

function clientOptions(url) {
  return {
    connectionString: url,
    ssl: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true" ? { rejectUnauthorized: true } : { rejectUnauthorized: false },
  };
}

function qIdent(name) {
  return `"${String(name).replaceAll('"', '""')}"`;
}

/**
 * Liefert Tabellen in FK-Reihenfolge (Vorgänger zuerst). Ohne `session_replication_role` (Neon: nicht erlaubt).
 * @param {import("pg").Client} c
 * @param {string[]} publicTables
 */
async function topologicallySortedTables(c, publicTables) {
  const { rows: fks } = await c.query(`
    SELECT
      c.relname    AS "from",
      pc.relname   AS "to"
    FROM pg_constraint co
    JOIN pg_class  c  ON c.oid  = co.conrelid
    JOIN pg_class  pc ON pc.oid = co.confrelid
    JOIN pg_namespace n  ON n.oid  = c.relnamespace
    WHERE co.contype = 'f' AND n.nspname = 'public'
  `);
  const set = new Set(publicTables);
  const inDegree = new Map();
  for (const t of publicTables) inDegree.set(t, 0);
  const children = new Map();
  for (const t of publicTables) children.set(t, new Set());
  for (const { from, to } of fks) {
    if (!set.has(from) || !set.has(to)) continue;
    children.get(to).add(from);
    inDegree.set(from, inDegree.get(from) + 1);
  }
  const outOrder = [];
  const q = publicTables.filter((t) => inDegree.get(t) === 0);
  while (q.length) {
    const t = q.shift();
    if (t === undefined) break;
    outOrder.push(t);
    for (const cht of children.get(t) || []) {
      inDegree.set(cht, inDegree.get(cht) - 1);
      if (inDegree.get(cht) === 0) q.push(cht);
    }
  }
  if (outOrder.length < publicTables.length) {
    throw new Error("FK-Zyklus oder unerwartetes Schema: Topologie-Insert unmöglich.");
  }
  return outOrder;
}

/**
 * @param {import("pg").FieldDef[]} fields
 * @param {import("pg").QueryResultRow} row
 */
function rowToValuesArray(fields, row) {
  return fields.map((f) => {
    const v = row[f.name];
    if (v === null || v === undefined) {
      return v;
    }
    // json (114) / jsonb (3802): String aus der Quelle bleibt; Objekte -> stabil serialisieren
    if (f.dataTypeID === 114 || f.dataTypeID === 3802) {
      if (typeof v === "string") {
        return v;
      }
      return JSON.stringify(v);
    }
    return v;
  });
}

async function main() {
  const sourceUrl = pickSourceUrl();
  const { direct: neonDirect, pooler: neonPooler } = pickNeonUrls();

  console.log("1) prisma migrate deploy auf die Neon-Instanz (direct) …");
  const envM = {
    ...process.env,
    DIRECT_URL: neonDirect,
    DATABASE_URL: neonPooler,
  };
  execSync("npx prisma migrate deploy", { cwd: root, stdio: "inherit", env: envM });

  const source = new Client(clientOptions(sourceUrl));
  const dest = new Client(clientOptions(neonDirect));
  await source.connect();
  await dest.connect();

  await dest.query("BEGIN");
  try {
    const { rows: tables } = await dest.query(`
      SELECT c.relname AS name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname NOT IN ('_prisma_migrations')
      ORDER BY c.relname
    `);
    if (tables.length === 0) {
      throw new Error("Auf Neon wurden keine public-User-Tabellen gefunden (Schema fehlt?).");
    }
    const names = tables.map((t) => t.name);
    const idList = names.map(qIdent).join(", ");
    await dest.query(`TRUNCATE TABLE ${idList} RESTART IDENTITY CASCADE`);

    const order = await topologicallySortedTables(source, names);
    for (const table of order) {
      const tq = qIdent(table);
      const res = await source.query(`SELECT * FROM ${tq}`);
      if (res.rowCount === 0) {
        console.log(`  ${table}: 0 rows`);
        continue;
      }
      if (!res.fields || res.fields.length === 0) {
        continue;
      }
      const colNames = res.fields.map((f) => f.name);
      const cols = colNames.map((c) => qIdent(c)).join(", ");
      let n = 0;
      const batch = 200;
      for (let i = 0; i < res.rows.length; i += batch) {
        const chunk = res.rows.slice(i, i + batch);
        for (const row of chunk) {
          const values = rowToValuesArray(res.fields, row);
          const placeholders = values.map((_, j) => `$${j + 1}`).join(", ");
          const text = `INSERT INTO ${tq} (${cols}) VALUES (${placeholders})`;
          await dest.query(text, values);
        }
        n += chunk.length;
      }
      console.log(`  ${table}: ${n} rows copied`);
    }
    await dest.query("COMMIT");
  } catch (e) {
    await dest.query("ROLLBACK");
    throw e;
  } finally {
    await source.end();
    await dest.end();
  }

  console.log("2) Fertig. Nächster Schritt: in .env.local `DATABASE_URL` = Neon-Pooler, `DIRECT_URL` = Neon-Direct, Prisma-URL in PRISMA_LEGACY belassen.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
