import type { IconKey } from "@/lib/icons/icon-keys";

/** Legacy emoji (Admin/Seed) → icon key. */
export const EMOJI_TO_ICON_KEY: Record<string, IconKey> = {
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

/** Default icon per catalog `i18nKey`. */
export const I18N_KEY_ICON_DEFAULTS: Record<string, IconKey> = {
  led: "lightbulb",
  usb: "usb",
  socket12v: "plug",
  fridge: "refrigerator",
  coffee: "coffee",
  heater: "radiator",
  boiler: "boiler",
  pump: "water-pump",
  fan: "fan",
  laptop: "laptop",
  tv: "tv",
  console: "gamepad-2",
  drill: "drill",
  grinder: "cog",
};

/** Preset device ids without i18nKey (reference seed). */
export const DEVICE_ID_ICON_DEFAULTS: Record<string, IconKey> = {
  microwave: "microwave",
  toaster: "toaster",
  kettle: "kettle",
  induction: "cooking-pot",
  hairdryer: "wind",
  electric_blanket: "bed",
  air_purifier: "air-vent",
  mosquito_repeller: "bug",
  tablet: "tablet",
  camera_charger: "camera",
  drone: "plane",
  projector: "projector",
  ebike_charger: "bike",
  vacuum_cleaner: "vacuum",
  compressor: "cog",
  soldering_iron: "soldering-iron",
};

/** Consumer category slug → icon key. */
export const CATEGORY_SLUG_ICON_DEFAULTS: Record<string, IconKey> = {
  basic: "zap",
  kitchen: "cooking-pot",
  comfort: "thermometer",
  entertainment: "laptop",
  tools: "wrench",
};

/** Resolve default icon key from catalog metadata. */
export function defaultIconKeyForDevice(meta: {
  i18nKey?: string | null;
  id?: string;
  name?: string;
}): IconKey | null {
  if (meta.i18nKey && I18N_KEY_ICON_DEFAULTS[meta.i18nKey]) {
    return I18N_KEY_ICON_DEFAULTS[meta.i18nKey];
  }
  if (meta.id && DEVICE_ID_ICON_DEFAULTS[meta.id]) {
    return DEVICE_ID_ICON_DEFAULTS[meta.id];
  }
  return null;
}

export function defaultIconKeyForCategorySlug(slug: string): IconKey | null {
  return CATEGORY_SLUG_ICON_DEFAULTS[slug] ?? null;
}
