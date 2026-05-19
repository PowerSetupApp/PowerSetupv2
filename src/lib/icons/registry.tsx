import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AirVent,
  Battery,
  BatteryCharging,
  BatteryMedium,
  Bed,
  Bike,
  Bug,
  Bus,
  Cable,
  Camera,
  Car,
  CarFront,
  CircuitBoard,
  Coffee,
  Cog,
  CookingPot,
  Cpu,
  Drill,
  Droplets,
  Fan,
  Gamepad2,
  Gauge,
  Hammer,
  Heater,
  Laptop,
  Lightbulb,
  Microwave,
  PanelTop,
  Plane,
  Plug,
  PlugZap,
  Projector,
  Refrigerator,
  Sailboat,
  Ship,
  ShowerHead,
  Smartphone,
  Thermometer,
  Truck,
  Tv,
  Usb,
  Wind,
  Wrench,
  Zap,
} from "lucide-react";

import { BoilerIcon } from "@/lib/icons/custom/boiler";
import { FuseBoxIcon } from "@/lib/icons/custom/fuse-box";
import { KettleIcon } from "@/lib/icons/custom/kettle";
import { RadiatorIcon } from "@/lib/icons/custom/radiator";
import { SolderingIronIcon } from "@/lib/icons/custom/soldering-iron";
import { ToasterIcon } from "@/lib/icons/custom/toaster";
import { VacuumIcon } from "@/lib/icons/custom/vacuum";
import { WaterPumpIcon } from "@/lib/icons/custom/water-pump";
import { ICON_STROKE } from "@/lib/icons/icon-svg";
import type { IconKey } from "@/lib/icons/icon-keys";
import { normalizeIconKeyOrFallback } from "@/lib/icons/normalize-icon-key";
import type { IconComponent, IconRegistry } from "@/lib/icons/types";
import {
  AlternatorSourceIcon,
  ShorePowerSourceIcon,
  SolarSourceIcon,
} from "@/components/wizard/steps/step-2-energy/energy-source-icons";

function lucide(Icon: LucideIcon): IconComponent {
  return function LucideWrapped({ className }) {
    return <Icon className={className} strokeWidth={ICON_STROKE} aria-hidden />;
  };
}

const REGISTRY: IconRegistry = {
  lightbulb: lucide(Lightbulb),
  smartphone: lucide(Smartphone),
  plug: lucide(Plug),
  usb: lucide(Usb),
  refrigerator: lucide(Refrigerator),
  coffee: lucide(Coffee),
  microwave: lucide(Microwave),
  "cooking-pot": lucide(CookingPot),
  toaster: ToasterIcon,
  kettle: KettleIcon,
  wind: lucide(Wind),
  heater: lucide(Heater),
  radiator: RadiatorIcon,
  boiler: BoilerIcon,
  "water-pump": WaterPumpIcon,
  fan: lucide(Fan),
  "shower-head": lucide(ShowerHead),
  bed: lucide(Bed),
  "air-vent": lucide(AirVent),
  bug: lucide(Bug),
  laptop: lucide(Laptop),
  tv: lucide(Tv),
  "gamepad-2": lucide(Gamepad2),
  tablet: lucide(Smartphone),
  camera: lucide(Camera),
  plane: lucide(Plane),
  projector: lucide(Projector),
  drill: lucide(Drill),
  cog: lucide(Cog),
  hammer: lucide(Hammer),
  wrench: lucide(Wrench),
  bike: lucide(Bike),
  vacuum: VacuumIcon,
  "soldering-iron": SolderingIronIcon,
  droplets: lucide(Droplets),
  zap: lucide(Zap),
  thermometer: lucide(Thermometer),
  solar: SolarSourceIcon,
  alternator: AlternatorSourceIcon,
  "shore-power": ShorePowerSourceIcon,
  battery: lucide(Battery),
  "battery-charging": lucide(BatteryCharging),
  "battery-medium": lucide(BatteryMedium),
  "circuit-board": lucide(CircuitBoard),
  cpu: lucide(Cpu),
  cable: lucide(Cable),
  gauge: lucide(Gauge),
  "panel-top": lucide(PanelTop),
  activity: lucide(Activity),
  "plug-zap": lucide(PlugZap),
  "fuse-box": FuseBoxIcon,
  "car-front": lucide(CarFront),
  truck: lucide(Truck),
  bus: lucide(Bus),
  sailboat: lucide(Sailboat),
  ship: lucide(Ship),
  car: lucide(Car),
};

export function resolveIcon(key: string | null | undefined): IconComponent {
  const normalized = normalizeIconKeyOrFallback(key);
  return REGISTRY[normalized];
}

export function resolveIconKey(key: string | null | undefined): IconKey {
  return normalizeIconKeyOrFallback(key);
}

export { REGISTRY as iconRegistry };
export { ICON_KEYS } from "@/lib/icons/icon-keys";
export { isIconKey } from "@/lib/icons/icon-keys";
export type { IconKey } from "@/lib/icons/icon-keys";

/** Groups for admin icon picker UI. */
export const ICON_PICKER_GROUPS: { label: string; keys: IconKey[] }[] = [
  {
    label: "Küche & Haushalt",
    keys: [
      "refrigerator",
      "coffee",
      "microwave",
      "cooking-pot",
      "toaster",
      "kettle",
      "wind",
    ],
  },
  {
    label: "Komfort & Klima",
    keys: ["radiator", "heater", "fan", "boiler", "water-pump", "shower-head", "bed", "air-vent", "bug", "droplets"],
  },
  {
    label: "Multimedia & Arbeit",
    keys: ["laptop", "tv", "gamepad-2", "tablet", "smartphone", "camera", "plane", "projector"],
  },
  {
    label: "Grundausstattung",
    keys: ["lightbulb", "usb", "plug", "zap", "plug-zap"],
  },
  {
    label: "Werkzeug",
    keys: ["drill", "cog", "hammer", "wrench", "bike", "vacuum", "soldering-iron"],
  },
  {
    label: "Kategorien",
    keys: ["zap", "cooking-pot", "thermometer", "laptop", "wrench", "radiator"],
  },
  {
    label: "Energie & Elektro",
    keys: [
      "solar",
      "alternator",
      "shore-power",
      "battery",
      "battery-charging",
      "battery-medium",
      "circuit-board",
      "cpu",
      "cable",
      "gauge",
      "panel-top",
      "activity",
      "fuse-box",
    ],
  },
];
