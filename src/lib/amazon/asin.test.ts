import { describe, expect, it } from "vitest";

import { extractAsinFromAmazonInput } from "@/lib/amazon/asin";

describe("extractAsinFromAmazonInput", () => {
  it("accepts raw ASIN", () => {
    expect(extractAsinFromAmazonInput("b075nqqrpd")).toBe("B075NQQRPD");
  });

  it("extracts from /dp/ URL", () => {
    expect(extractAsinFromAmazonInput("https://www.amazon.de/dp/B075NQQRPD/ref=nosim")).toBe("B075NQQRPD");
  });

  it("extracts from gp/product URL", () => {
    expect(extractAsinFromAmazonInput("https://www.amazon.de/gp/product/B09LIONBAT")).toBe("B09LIONBAT");
  });

  it("returns null for garbage", () => {
    expect(extractAsinFromAmazonInput("not-a-link")).toBe(null);
  });
});
