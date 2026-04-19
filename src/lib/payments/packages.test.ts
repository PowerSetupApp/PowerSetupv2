import { describe, expect, it } from "vitest";

import { CREDIT_PACKAGES, parseCreditPackageId } from "./packages";

describe("parseCreditPackageId", () => {
  it("parses known ids", () => {
    expect(parseCreditPackageId("single")).toBe("single");
    expect(parseCreditPackageId("starter")).toBe("starter");
    expect(parseCreditPackageId("pro")).toBe("pro");
  });

  it("rejects unknown", () => {
    expect(parseCreditPackageId("mega")).toBeNull();
  });
});

describe("CREDIT_PACKAGES", () => {
  it("has positive credits", () => {
    expect(CREDIT_PACKAGES.single.credits).toBeGreaterThanOrEqual(1);
  });
});
