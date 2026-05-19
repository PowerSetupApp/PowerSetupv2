/**
 * One-off: ConsumerCategory.icon / ConsumerDevice.icon emoji → icon keys.
 * Run from repo root: node scripts/migrate-consumer-icons-to-keys.cjs
 */
const { resolve } = require("node:path");
const { config: loadEnv } = require("dotenv");

const root = resolve(__dirname, "..");
loadEnv({ path: resolve(root, ".env") });
loadEnv({ path: resolve(root, ".env.local"), override: true });

const EMOJI_TO_ICON_KEY = {
  "⚡": "zap",
  "🍳": "cooking-pot",
  "🌡️": "thermometer",
  "💻": "laptop",
  "🔧": "wrench",
  "💡": "lightbulb",
  "📱": "smartphone",
  "🔌": "plug",
  "❄️": "refrigerator",
  "☕": "coffee",
  "📻": "microwave",
  "🍞": "toaster",
  "🫖": "kettle",
  "💇": "wind",
  "🔥": "radiator",
  "🚿": "boiler",
  "💧": "water-pump",
  "🌀": "fan",
  "🛏️": "bed",
  "🌬️": "air-vent",
  "🦟": "bug",
  "📺": "tv",
  "🎮": "gamepad-2",
  "📷": "camera",
  "🚁": "plane",
  "🎬": "projector",
  "⚙️": "cog",
  "🚲": "bike",
  "🧹": "vacuum",
  "💨": "cog",
};

const ICON_KEYS = [
  "lightbulb", "smartphone", "plug", "usb", "refrigerator", "coffee", "microwave", "cooking-pot",
  "toaster", "kettle", "wind", "heater", "radiator", "boiler", "water-pump", "fan", "shower-head",
  "bed", "air-vent", "bug", "laptop", "tv", "gamepad-2", "tablet", "camera", "plane", "projector",
  "drill", "cog", "hammer", "wrench", "bike", "vacuum", "soldering-iron", "droplets", "zap",
  "thermometer", "solar", "alternator", "shore-power", "battery", "battery-charging", "battery-medium",
  "circuit-board", "cpu", "cable", "gauge", "panel-top", "activity", "plug-zap", "fuse-box",
  "car-front", "truck", "bus", "sailboat", "ship", "car",
];
const VALID_KEYS = new Set([...ICON_KEYS, ...Object.values(EMOJI_TO_ICON_KEY)]);

function normalizeIconKey(raw) {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  if (VALID_KEYS.has(trimmed)) return trimmed;
  return EMOJI_TO_ICON_KEY[trimmed] ?? null;
}

async function main() {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  let catUpdated = 0;
  let devUpdated = 0;

  const categories = await prisma.consumerCategory.findMany({ select: { id: true, icon: true } });
  for (const row of categories) {
    const next = normalizeIconKey(row.icon);
    if (next && next !== row.icon) {
      await prisma.consumerCategory.update({ where: { id: row.id }, data: { icon: next } });
      catUpdated += 1;
    }
  }

  const devices = await prisma.consumerDevice.findMany({ select: { id: true, icon: true } });
  for (const row of devices) {
    const next = normalizeIconKey(row.icon);
    if (next && next !== row.icon) {
      await prisma.consumerDevice.update({ where: { id: row.id }, data: { icon: next } });
      devUpdated += 1;
    }
  }

  await prisma.$disconnect();
  console.log(`Done. Categories updated: ${catUpdated}, devices updated: ${devUpdated}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
