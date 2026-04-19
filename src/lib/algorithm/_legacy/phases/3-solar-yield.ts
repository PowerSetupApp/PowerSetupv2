import type { AlgorithmInput, SolarRecommendation } from "../types";
import {
  MAX_PORTABLE_WP,
  PORTABLE_ORIENTATION_FACTOR,
  RECOMMENDED_SOLAR_FACTOR,
  ROOF_ORIENTATION_FACTOR,
  ROOF_UTILIZATION_FACTOR,
  SOLAR_SYSTEM_EFFICIENCY,
} from "../constants";
import type { AlgorithmTrace } from "../trace";
import { pushStep } from "../trace";
import { getWpPerM2, roundUpTo100 } from "./1-energy-demand";
import { getSetting } from "./settings";

export function calculateSolar(
  input: AlgorithmInput,
  dailyWh: number,
  psh: number,
  trace?: AlgorithmTrace,
): SolarRecommendation {
  const hasSolar = input.energySources.includes("solar");

  if (!hasSolar) {
    return {
      needed: false,
      requiredWp: 0,
      maxRoofWp: 0,
      portableWp: 0,
      totalAvailableWp: 0,
      dailySolarYieldWh: 0,
      solarShortfallWh: 0,
      recommendation: "Kein Solar gewählt",
    };
  }

  const wpPerM2 = getWpPerM2(input.roofModuleType, input, trace);
  const roofUtilization = getSetting(
    input,
    "roofUtilizationFactor",
    ROOF_UTILIZATION_FACTOR,
    "solar",
    trace,
  );
  const roofOrient = getSetting(
    input,
    "roofOrientationFactor",
    ROOF_ORIENTATION_FACTOR,
    "solar",
    trace,
  );
  const portableOrient = getSetting(
    input,
    "portableOrientationFactor",
    PORTABLE_ORIENTATION_FACTOR,
    "solar",
    trace,
  );
  const sysEfficiency = getSetting(
    input,
    "solarSystemEfficiency",
    SOLAR_SYSTEM_EFFICIENCY,
    "solar",
    trace,
  );
  const solarDimFactor = getSetting(
    input,
    "recommendedSolarYieldFactor",
    RECOMMENDED_SOLAR_FACTOR,
    "solar",
    trace,
  );
  const maxPortable = getSetting(input, "maxPortableWp", MAX_PORTABLE_WP, "solar", trace);

  let maxRoofWp = 0;
  const roofAreas = Array.isArray(input.roofAreas) ? input.roofAreas : [];
  for (const area of roofAreas) {
    const areaM2 = (area.length / 100) * (area.width / 100);
    const areaWp = areaM2 * wpPerM2 * roofUtilization * roofOrient;
    maxRoofWp += areaWp;
  }
  maxRoofWp = Math.round(maxRoofWp);

  // Theoretisch nötige installierte Wp für den Tagesbedarf — ohne doppelte
  // Orientierungs-Korrektur: `maxRoofWp` enthält `roofOrient` bereits aus der
  // Flächen-Allokation oben, deshalb darf hier nicht nochmal durch `roofOrient`
  // dividiert werden.
  const rawRequiredWp = dailyWh / (psh * sysEfficiency);
  const recommendedWp = rawRequiredWp * solarDimFactor;

  const existingPortableWp = input.solarBags.reduce((sum, bag) => sum + bag.power, 0);
  const isShortTrip = ["weekend", "week"].includes(input.travelBehavior.tripDuration);
  const suppressPortableRec = isShortTrip && existingPortableWp === 0;

  let portableWp = 0;
  if (suppressPortableRec) {
    portableWp = existingPortableWp;
  } else {
    portableWp = Math.min(existingPortableWp, maxPortable);
    if (maxRoofWp < recommendedWp && existingPortableWp === 0) {
      const neededPortable = Math.min(recommendedWp - maxRoofWp, maxPortable);
      portableWp = roundUpTo100(neededPortable);
    }
  }

  let totalWp = maxRoofWp + portableWp;
  if (input.customOverrides.solar !== null) {
    totalWp = input.customOverrides.solar;
  }

  // Symmetrische Ertrags-Rechnung:
  // `maxRoofWp` enthält bereits `roofOrient` aus der Flächen-Rechnung, und auch
  // im Override-Pfad behandeln wir `totalWp` als bereits orientierungs-bereinigt
  // (wie der Nutzer ihn in Wizard-Step 5/8 versteht: „so viel effektive Wp sollen
  // verbaut sein“). So produzieren gleicher `totalWp` in beiden Pfaden den
  // gleichen Ertrag.
  let dailySolarYieldWh: number;
  if (input.customOverrides.solar !== null) {
    dailySolarYieldWh = totalWp * psh * sysEfficiency;
  } else {
    const roofYieldWh = maxRoofWp * psh * sysEfficiency;
    const portableYieldWh = portableWp * psh * sysEfficiency * portableOrient;
    dailySolarYieldWh = roofYieldWh + portableYieldWh;
  }

  const solarShortfallWh = Math.max(0, dailyWh - dailySolarYieldWh);

  let recommendation: string;
  if (maxRoofWp >= recommendedWp) {
    recommendation = "Dachfläche reicht aus";
  } else if (maxRoofWp > 0 && portableWp > 0) {
    recommendation = "Dachfläche + portable Solartaschen empfohlen";
  } else if (maxRoofWp === 0 && portableWp > 0) {
    recommendation = "Nur portable Solartaschen möglich";
  } else if (solarShortfallWh > 0) {
    if (["weekend", "week"].includes(input.travelBehavior.tripDuration)) {
      recommendation = "Solar limitiert - Kompensation durch größere Batterie";
    } else {
      recommendation = "Solar reicht nicht aus - erhöhte Batterie empfohlen";
    }
  } else {
    recommendation = "Keine Solarfläche definiert";
  }

  pushStep(trace, {
    phase: "solar",
    id: "solar.maxRoofWp",
    label: "Dach-Wp (inkl. Orientierung)",
    value: maxRoofWp,
    unit: "Wp",
    kind: "intermediate",
    formula: `Σ(length × width) × wpPerM2 ${wpPerM2} × util ${roofUtilization} × orient ${roofOrient}`,
  });
  pushStep(trace, {
    phase: "solar",
    id: "solar.requiredWp",
    label: "Ideale Soll-Wp",
    value: Math.round(recommendedWp),
    unit: "Wp",
    kind: "intermediate",
    formula: `${Math.round(dailyWh)} Wh / (${psh.toFixed(2)} h × ${sysEfficiency}) × Puffer ${solarDimFactor}`,
  });
  pushStep(trace, {
    phase: "solar",
    id: "solar.portableWp",
    label: "Portable Wp",
    value: portableWp,
    unit: "Wp",
    kind: "intermediate",
  });
  pushStep(trace, {
    phase: "solar",
    id: "solar.totalAvailableWp",
    label: "Verfügbare Wp gesamt",
    value: totalWp,
    unit: "Wp",
    kind: "intermediate",
  });
  pushStep(trace, {
    phase: "solar",
    id: "solar.dailyYield",
    label: "Solar-Ertrag pro Tag",
    value: Math.round(dailySolarYieldWh),
    unit: "Wh/Tag",
    kind: "output",
  });
  pushStep(trace, {
    phase: "solar",
    id: "solar.shortfall",
    label: "Solar-Defizit",
    value: Math.round(solarShortfallWh),
    unit: "Wh/Tag",
    kind: "output",
  });

  return {
    needed: true,
    requiredWp: Math.round(recommendedWp),
    maxRoofWp,
    portableWp,
    totalAvailableWp: totalWp,
    dailySolarYieldWh: Math.round(dailySolarYieldWh),
    solarShortfallWh: Math.round(solarShortfallWh),
    recommendation,
  };
}
