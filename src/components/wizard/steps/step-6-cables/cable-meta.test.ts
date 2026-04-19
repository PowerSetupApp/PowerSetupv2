import { describe, expect, it } from "vitest";

import { formatCableLengthMeters, snapCableLength } from "./cable-meta";

describe("snapCableLength", () => {
  it("snaps to 0.1 m grid from min 0.1", () => {
    expect(snapCableLength(1.07, 0.1, 15, 0.1)).toBe(1.1);
    expect(snapCableLength(1.03, 0.1, 15, 0.1)).toBe(1);
  });

  it("snaps to 0.25 m grid from min 0.25", () => {
    expect(snapCableLength(1.1, 0.25, 30, 0.25)).toBe(1);
    expect(snapCableLength(1.2, 0.25, 30, 0.25)).toBe(1.25);
  });
});

describe("formatCableLengthMeters", () => {
  it("uses one decimal for 0.1 m steps", () => {
    expect(formatCableLengthMeters(1.2, 0.1)).toBe("1.2");
  });

  it("uses up to two decimals for 0.25 m steps", () => {
    expect(formatCableLengthMeters(1.25, 0.25)).toBe("1.25");
  });
});
