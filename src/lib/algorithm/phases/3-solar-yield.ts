import type { AlgorithmInput, SolarRecommendation } from "../types";
import {
  MAX_PORTABLE_WP,
  PORTABLE_ORIENTATION_FACTOR,
  RECOMMENDED_SOLAR_FACTOR,
  ROOF_ORIENTATION_FACTOR,
  ROOF_UTILIZATION_FACTOR,
  SOLAR_SYSTEM_EFFICIENCY,
} from "../constants";
import { getWpPerM2, roundUpTo100 } from "./1-energy-demand";
import { getSetting } from "./settings";

export function calculateSolar(input: AlgorithmInput, dailyWh: number, psh: number): SolarRecommendation {
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

  const wpPerM2 = getWpPerM2(input.roofModuleType, input);
  const roofUtilization = getSetting(input, "roofUtilizationFactor", ROOF_UTILIZATION_FACTOR);
  const roofOrient = getSetting(input, "roofOrientationFactor", ROOF_ORIENTATION_FACTOR);
  const portableOrient = getSetting(input, "portableOrientationFactor", PORTABLE_ORIENTATION_FACTOR);
  const sysEfficiency = getSetting(input, "solarSystemEfficiency", SOLAR_SYSTEM_EFFICIENCY);
  const solarDimFactor = getSetting(input, "solarDimensioningFactor", RECOMMENDED_SOLAR_FACTOR);
  const maxPortable = getSetting(input, "maxPortableWp", MAX_PORTABLE_WP);

  let maxRoofWp = 0;
  const roofAreas = Array.isArray(input.roofAreas) ? input.roofAreas : [];
  for (const area of roofAreas) {
    const areaM2 = (area.length / 100) * (area.width / 100);
    const areaWp = areaM2 * wpPerM2 * roofUtilization * roofOrient;
    maxRoofWp += areaWp;
  }
  maxRoofWp = Math.round(maxRoofWp);

  const rawRequiredWp = dailyWh / (psh * sysEfficiency * roofOrient);
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

  let dailySolarYieldWh: number;
  if (input.customOverrides.solar !== null) {
    dailySolarYieldWh = totalWp * psh * sysEfficiency * roofOrient;
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
