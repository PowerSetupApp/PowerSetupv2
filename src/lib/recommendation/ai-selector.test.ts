import { describe, expect, it } from "vitest";

import { parseProductSelectionJson } from "./ai-selector";

describe("parseProductSelectionJson", () => {
  it("parses valid AI JSON", () => {
    const text = JSON.stringify({
      selections: [
        { productId: "p1", bucket: "battery", reasonDe: "Kapazität passt zur Empfehlung." },
        { productId: "p2", bucket: "solar", reasonDe: "Wp nahe am Ziel." },
      ],
    });
    const out = parseProductSelectionJson(text);
    expect(out).toHaveLength(2);
    expect(out[0]?.productId).toBe("p1");
  });

  it("rejects invalid bucket", () => {
    const text = JSON.stringify({
      selections: [{ productId: "p1", bucket: "invalid", reasonDe: "x" }],
    });
    expect(() => parseProductSelectionJson(text)).toThrow();
  });
});
