import {
  CalendarRange,
  ChevronRight,
  Compass,
  Map,
  Mountain,
  Palmtree,
  Snowflake,
  Sun,
  Thermometer,
  Timer,
} from "lucide-react";

import type { CardOption } from "@/components/ui/card-selection";
import type { Season, StandingDuration, TripDuration, WinterLocation } from "@/lib/algorithm/types";

export const STEP4_TITLE = "Wie nutzt du dein Fahrzeug?";

export const STEP4_DESCRIPTION =
  "Diese Angaben helfen uns, Solarertrag, Reserve und Lichtmaschinen-Nutzung an dein echtes Reiseverhalten anzupassen.";

export const SECTION_SEASON = "Wann reist du hauptsächlich?";
export const SECTION_DURATION = "Typische Reisedauer";
export const SECTION_WINTER = "Wo verbringst du den Winter?";
export const SECTION_STANDING = "Wie lange stehst du typischerweise am selben Ort?";

export const STANDING_ALTERNATOR_HINT =
  "Je kürzer du stehst, desto häufiger lädst du während der Fahrt über die Lichtmaschine.";

export const SEASON_CARDS: CardOption<Season>[] = [
  {
    value: "summer",
    title: "Nur Sommer",
    description: "April bis September — Fokus auf warme Jahreszeit",
    icon: <Sun className="h-6 w-6" aria-hidden />,
  },
  {
    value: "all_year",
    title: "Ganzjährig",
    description: "Das ganze Jahr unterwegs",
    icon: <CalendarRange className="h-6 w-6" aria-hidden />,
  },
  {
    value: "winter",
    title: "Winterfokus",
    description: "Oft im Winter unterwegs oder viel Kälte",
    icon: <Snowflake className="h-6 w-6" aria-hidden />,
  },
];

export function tripDurationCards(permanentDisabled: boolean): CardOption<TripDuration>[] {
  return [
    {
      value: "weekend",
      title: "Wochenendtrips",
      description: "2–3 Tage",
      icon: <Timer className="h-5 w-5" aria-hidden />,
    },
    {
      value: "week",
      title: "Wochenreisen",
      description: "5–7 Tage",
      icon: <ChevronRight className="h-5 w-5" aria-hidden />,
    },
    {
      value: "extended",
      title: "Langzeitreisen",
      description: "2–4 Wochen",
      icon: <Map className="h-5 w-5" aria-hidden />,
    },
    {
      value: "permanent",
      title: "Dauerhaft",
      description: permanentDisabled
        ? "Nur bei Ganzjahresnutzung wählbar"
        : "Vollzeit im Fahrzeug",
      icon: <Compass className="h-5 w-5" aria-hidden />,
      disabled: permanentDisabled,
    },
  ];
}

export const WINTER_CARDS: CardOption<WinterLocation>[] = [
  {
    value: "germany",
    title: "Deutschland / Alpen",
    description: "Kalte Winter, eher wenig Sonne",
    icon: <Mountain className="h-5 w-5" aria-hidden />,
  },
  {
    value: "southern",
    title: "Südeuropa",
    description: "Spanien, Portugal, Italien — mildere Winter, mehr Sonne",
    icon: <Palmtree className="h-5 w-5" aria-hidden />,
  },
  {
    value: "scandinavia",
    title: "Skandinavien",
    description: "Extreme Kälte, sehr kurze Wintertage",
    icon: <Thermometer className="h-5 w-5" aria-hidden />,
  },
  {
    value: "eastern",
    title: "Osteuropa / Balkan",
    description: "Kontinentales Klima — Winter oft härter als im Westen, etwas mehr Wintersonne als in DE",
    icon: <Map className="h-5 w-5" aria-hidden />,
  },
  {
    value: "varies",
    title: "Wechselnd",
    description: "Je nach Jahr oder Route unterschiedlich",
    icon: <Compass className="h-5 w-5" aria-hidden />,
  },
];

export const STANDING_CARDS: CardOption<StandingDuration>[] = [
  {
    value: "short",
    title: "Kurz",
    description: "1–2 Tage",
    icon: <Timer className="h-5 w-5" aria-hidden />,
  },
  {
    value: "medium",
    title: "Mittel",
    description: "3–7 Tage",
    icon: <Timer className="h-5 w-5" aria-hidden />,
  },
  {
    value: "long",
    title: "Lang",
    description: "1+ Woche",
    icon: <Timer className="h-5 w-5" aria-hidden />,
  },
];
