import { describe, expect, it } from "vitest";

import { calculateDailyConsumption, getDoD } from "./phases";
import type { Consumer } from "./types";

describe("algorithm (ported reference)", () => {
  it("getDoD matches chemistry defaults", () => {
    expect(getDoD("lifepo4")).toBeCloseTo(0.95, 5);
    expect(getDoD("agm")).toBeCloseTo(0.5, 5);
    expect(getDoD("gel")).toBeCloseTo(0.5, 5);
  });

  describe("calculateDailyConsumption with averageLoadPercent", () => {
    function consumer(overrides: Partial<Consumer> = {}): Consumer {
      return {
        id: "x",
        name: "test",
        power: 3000,
        daily: 1,
        voltage: 230,
        ...overrides,
      };
    }

    it("ignoriert averageLoadPercent wenn nicht gesetzt (voller Nennwert)", () => {
      expect(calculateDailyConsumption([consumer()])).toBe(3000);
    });

    it("skaliert den Tagesverbrauch um averageLoadPercent", () => {
      // 3000 W max × 33 % = 990 W Durchschnitt × 1 h = 990 Wh
      expect(calculateDailyConsumption([consumer({ averageLoadPercent: 33 })])).toBe(990);
    });

    it("100 % und Out-of-Range-Werte fallen auf volle Nennleistung zurück", () => {
      expect(calculateDailyConsumption([consumer({ averageLoadPercent: 100 })])).toBe(3000);
      expect(calculateDailyConsumption([consumer({ averageLoadPercent: 0 })])).toBe(3000);
      expect(calculateDailyConsumption([consumer({ averageLoadPercent: -5 })])).toBe(3000);
    });

    it("kombiniert mit compressor-Duty-Cycle korrekt", () => {
      // Kompressor-Kühlbox: 60 W × 24 h × 0.35 duty × 0.5 averageLoad = 252 Wh
      const wh = calculateDailyConsumption([
        consumer({
          power: 60,
          daily: 24,
          coolingMethod: "compressor",
          averageLoadPercent: 50,
          voltage: 12,
        }),
      ]);
      expect(wh).toBeCloseTo(252, 2);
    });
  });
});
