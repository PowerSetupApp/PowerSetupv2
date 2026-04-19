import { GitBranch, Layers2, Zap } from "lucide-react";

import type { CardOption } from "@/components/ui/card-selection";
import type { SimultaneousLoad } from "@/lib/algorithm/types";

export const SECTION_SIMULTANEOUS_230 = "Gleichzeitige 230-V-Last";

export const SIMULTANEOUS_230_HELPER =
  "Beeinflusst, wie stark mehrere 230-V-Verbraucher zur gleichen Zeit einkalkuliert werden.";

export const SIMULTANEOUS_LOAD_CARDS: CardOption<SimultaneousLoad>[] = [
  {
    value: "low",
    title: "Gering",
    description: "Eher nacheinander — selten mehrere größere Geräte parallel",
    icon: <Layers2 className="h-5 w-5" aria-hidden />,
  },
  {
    value: "moderate",
    title: "Mittel",
    description: "Typischer Mix — gelegentlich zwei größere Lasten zugleich",
    icon: <GitBranch className="h-5 w-5" aria-hidden />,
  },
  {
    value: "high",
    title: "Hoch",
    description: "Oft parallel — mehrere stärkere Verbraucher gleichzeitig möglich",
    icon: <Zap className="h-5 w-5" aria-hidden />,
  },
];
