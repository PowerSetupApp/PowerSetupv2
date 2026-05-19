/** All registered icon keys (kebab-case). DB stores these instead of emojis. */
export const ICON_KEYS = [
  // — Verbraucher (Katalog) —
  "lightbulb",
  "smartphone",
  "plug",
  "usb",
  "refrigerator",
  "coffee",
  "microwave",
  "cooking-pot",
  "toaster",
  "kettle",
  "wind",
  "heater",
  "radiator",
  "boiler",
  "water-pump",
  "fan",
  "shower-head",
  "bed",
  "air-vent",
  "bug",
  "laptop",
  "tv",
  "gamepad-2",
  "tablet",
  "camera",
  "plane",
  "projector",
  "drill",
  "cog",
  "hammer",
  "wrench",
  "bike",
  "vacuum",
  "soldering-iron",
  "droplets",
  // — Kategorien —
  "zap",
  "thermometer",
  // — Energiequellen —
  "solar",
  "alternator",
  "shore-power",
  // — Elektrotechnik (Wizard / Produkt) —
  "battery",
  "battery-charging",
  "battery-medium",
  "circuit-board",
  "cpu",
  "cable",
  "gauge",
  "panel-top",
  "activity",
  "plug-zap",
  "fuse-box",
  "car-front",
  "truck",
  "bus",
  "sailboat",
  "ship",
  "car",
] as const;

export type IconKey = (typeof ICON_KEYS)[number];

const ICON_KEY_SET = new Set<string>(ICON_KEYS);

export function isIconKey(value: string): value is IconKey {
  return ICON_KEY_SET.has(value);
}
