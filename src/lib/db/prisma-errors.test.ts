import { describe, expect, it } from "vitest";
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/client";

import { isDatabaseUnreachableError, readFromDatabase } from "./prisma-errors";

describe("isDatabaseUnreachableError", () => {
  it("returns true for P1001", () => {
    const err = new PrismaClientKnownRequestError("Can't reach database server", {
      code: "P1001",
      clientVersion: "test",
    });
    expect(isDatabaseUnreachableError(err)).toBe(true);
  });

  it("returns true for P1001 even when message starts with Invalid prisma invocation", () => {
    const err = new PrismaClientKnownRequestError(
      "Invalid `prisma.product.findMany()` invocation:\n\nCan't reach database server at 127.0.0.1:5432",
      { code: "P1001", clientVersion: "test" },
    );
    expect(isDatabaseUnreachableError(err)).toBe(true);
  });

  it("returns true for P2022 (missing column) even when message matches Invalid prisma invocation", () => {
    const err = new PrismaClientKnownRequestError(
      "Invalid `prisma.consumerDevice.findMany()` invocation:\n\nThe column `ConsumerCategory.createdAt` does not exist in the current database.",
      { code: "P2022", clientVersion: "test" },
    );
    expect(isDatabaseUnreachableError(err)).toBe(true);
  });

  it("returns true for P2021 (missing table)", () => {
    const err = new PrismaClientKnownRequestError("The table `public.Missing` does not exist", {
      code: "P2021",
      clientVersion: "test",
    });
    expect(isDatabaseUnreachableError(err)).toBe(true);
  });

  it("returns true for PrismaClientInitializationError with connectivity text", () => {
    const err = new PrismaClientInitializationError("Can't reach database server", "test");
    expect(isDatabaseUnreachableError(err)).toBe(true);
  });

  it("returns false for PrismaClientInitializationError without connectivity text", () => {
    const err = new PrismaClientInitializationError("Invalid engine response", "test");
    expect(isDatabaseUnreachableError(err)).toBe(false);
  });

  it("returns false for PrismaClientValidationError", () => {
    const err = new PrismaClientValidationError("Invalid `prisma.product.findMany()` invocation", {
      clientVersion: "test",
    });
    expect(isDatabaseUnreachableError(err)).toBe(false);
  });

  it("returns true for ECONNREFUSED message", () => {
    expect(isDatabaseUnreachableError(new Error("connect ECONNREFUSED 127.0.0.1:5432"))).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isDatabaseUnreachableError(new Error("syntax error"))).toBe(false);
    expect(isDatabaseUnreachableError(null)).toBe(false);
  });

  it("returns true for SSL-related messages", () => {
    expect(isDatabaseUnreachableError(new Error("self signed certificate in certificate chain"))).toBe(true);
  });
});

describe("readFromDatabase", () => {
  it("returns database_unavailable for P2022 instead of throwing", async () => {
    const result = await readFromDatabase(async () => {
      throw new PrismaClientKnownRequestError(
        "Invalid `prisma.x.findMany()` invocation:\n\ncolumn missing",
        { code: "P2022", clientVersion: "test" },
      );
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("migrate");
    }
  });
});
