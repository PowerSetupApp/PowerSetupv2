const { resolve } = require("node:path");
const { config: load } = require("dotenv");
const { Client } = require("pg");

const root = resolve(__dirname, "..");
load({ path: resolve(root, ".env") });
load({ path: resolve(root, ".env.local"), override: true });

function o(url) {
  return { connectionString: url, ssl: { rejectUnauthorized: false } };
}
async function count(client, name) {
  const r = await client.query(`SELECT count(*)::int AS c FROM ${name}`);
  return r.rows[0].c;
}

async function main() {
  const prismaUrl =
    process.env.PRISMA_LEGACY_URL ||
    (process.env.DATABASE_URL && !/neon\.tech/i.test(process.env.DATABASE_URL) ? process.env.DATABASE_URL : null);
  const neonUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!prismaUrl || /neon\.tech/i.test(prismaUrl)) {
    throw new Error("Für Prisma-Count: PRISMA_LEGACY_URL muss Prisma-Postgres sein.");
  }
  if (!neonUrl || !/neon\.tech/i.test(neonUrl)) {
    throw new Error("Für Neon-Count: DIRECT_URL oder DATABASE_URL muss neon.tech sein.");
  }
  const p = new Client(o(prismaUrl));
  const n = new Client(o(neonUrl));
  await p.connect();
  await n.connect();
  try {
    for (const table of ['"Product"', '"Category"', '"Result"']) {
      const [a, b] = await Promise.all([count(p, table), count(n, table)]);
      console.log(`${table}\t Prisma: ${a}\t Neon: ${b}`);
    }
  } finally {
    await p.end();
    await n.end();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
