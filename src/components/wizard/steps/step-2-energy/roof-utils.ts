import type { RoofArea } from "@/lib/algorithm/types";

import {
  DEFAULT_ROOF_LENGTH_CM,
  DEFAULT_ROOF_WIDTH_CM,
  ROOF_AREA_NAME_OPTIONS,
} from "./constants";

export function newRoofId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `roof-${Date.now()}`;
}

export function defaultRoofArea(): RoofArea {
  return {
    id: newRoofId(),
    name: ROOF_AREA_NAME_OPTIONS[0],
    length: DEFAULT_ROOF_LENGTH_CM,
    width: DEFAULT_ROOF_WIDTH_CM,
  };
}
