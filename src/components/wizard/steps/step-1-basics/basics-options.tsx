import {
  Battery,
  BatteryCharging,
  BatteryMedium,
  CarFront,
  CircuitBoard,
  Droplets,
  Truck,
  Zap,
} from "lucide-react";

import type { CardOption } from "@/components/ui/card-selection";
import { wizardCallout } from "@/components/wizard/wizard-surfaces";
import type { BatteryPreference, SystemVoltage, VehicleVoltage } from "@/lib/algorithm/types";

export const STEP1_TITLE = "System-Basis";

export const STEP1_DESCRIPTION =
  "Bordnetz, Starterbatterie und bevorzugte Haus-Batterie-Chemie — die Grundlage für alle weiteren Schritte.";

export const SECTION_SYSTEM = "Welche Systemspannung nutzt du?";

export const SUB_SYSTEM =
  "12 V ist Standard für Camper. 24 V wird oft in LKW oder größeren Expeditionsmobilen genutzt.";

export const SECTION_VEHICLE = "Fahrzeugspannung";

export const SUB_VEHICLE = "Wie viel Volt hat die Starterbatterie / Lichtmaschine?";

export const SECTION_BATTERY = "Welchen Batterietyp planst du?";

export const SUB_BATTERY = "Batterie-Technologie";

export const SYSTEM_CARDS: CardOption<SystemVoltage>[] = [
  {
    value: 12,
    title: "12 V (üblich)",
    description: "Standard im Camper — breites Zubehör",
    icon: <Zap className="h-6 w-6" aria-hidden />,
  },
  {
    value: 24,
    title: "24 V (sinnvoll)",
    description: "Weniger Strom bei gleicher Leistung",
    icon: <BatteryMedium className="h-6 w-6" aria-hidden />,
  },
  {
    value: 48,
    title: "48 V (Sonderfall)",
    description: "Hochvolt-Aufbau — weniger Camping-Zubehör",
    icon: <CircuitBoard className="h-6 w-6" aria-hidden />,
  },
];

export const VEHICLE_CARDS: CardOption<VehicleVoltage>[] = [
  {
    value: 12,
    title: "12 V (Standard)",
    description: "PKW, Van, klassisches Wohnmobil",
    icon: <CarFront className="h-6 w-6" aria-hidden />,
  },
  {
    value: 24,
    title: "24 V",
    description: "Größere Nutzfahrzeuge, viele LKW",
    icon: <Truck className="h-6 w-6" aria-hidden />,
  },
  {
    value: 48,
    title: "48 V Starter",
    description: "Selten — z. B. moderne Nutzfahrzeug-Plattformen",
    icon: <Battery className="h-6 w-6" aria-hidden />,
  },
];

export const BATTERY_CARDS: CardOption<BatteryPreference>[] = [
  {
    value: "lifepo4",
    title: "LiFePO₄ (Lithium)",
    description: "Langlebig, leicht, hohe nutzbare Kapazität",
    icon: <BatteryCharging className="h-6 w-6" aria-hidden />,
  },
  {
    value: "agm",
    title: "AGM",
    description: "Blei — wartungsarm, robuster Einstieg",
    icon: <BatteryMedium className="h-6 w-6" aria-hidden />,
  },
  {
    value: "gel",
    title: "Gel",
    description: "Blei — zyklenfest, etwas empfindlicher",
    icon: <Droplets className="h-6 w-6" aria-hidden />,
  },
];

export function SystemVoltageHint() {
  return (
    <p className={wizardCallout()}>
      <strong>12 V</strong> ist Standard. <strong>24 V</strong> lohnt sich bei hohem Gleichstrombedarf (weniger
      Verluste); oft reichen dünnere Leitungen — weniger Kosten, einfachere Verarbeitung. <strong>48 V</strong> ist oft
      unpraktisch, weil viel Camping-Zubehör nicht kompatibel ist.
    </p>
  );
}

export function VehicleVoltageHint() {
  return (
    <p className={wizardCallout()}>
      PKW, Campervans und Wohnmobile haben meistens <strong>12 V</strong>. Große LKWs und Expeditionsmobile oft{" "}
      <strong>24 V</strong>. <strong>48 V</strong>-Starterbordnetze sind eher die Ausnahme.
    </p>
  );
}

export function BatteryPreferenceHint() {
  return (
    <p className={wizardCallout()}>
      <strong>Empfehlung:</strong> LiFePO₄-Batterien sind zwar teurer in der Anschaffung, aber deutlich leichter,
      halten deutlich länger und nutzen fast die volle Kapazität (gegenüber oft ~50 % nutzbar bei AGM/Gel im
      Alltag).
    </p>
  );
}
