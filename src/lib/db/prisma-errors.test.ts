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

  it("returns true for P2022 when instanceof PrismaClientKnownRequestError fails (bundled duplicate runtime)", () => {
    const err = new Error(
      "Invalid `prisma.consumerDevice.findMany()` invocation:\n\nThe column `averageLoadPercent` does not exist.",
    ) as Error & { code: string };
    err.name = "PrismaClientKnownRequestError";
    err.code = "P2022";
    expect(err instanceof PrismaClientKnownRequestError).toBe(false);
    expect(isDatabaseUnreachableError(err)).toBe(true);
  });

  it("returns true for schema drift when code and name are stripped (Next/Webpack)", () => {
    const err = new Error(
      "Invalid `prisma.consumerDevice.findMany()` invocation:\n\nThe column `ConsumerCategory.createdAt` does not exist in the current database.",
    );
    expect(isDatabaseUnreachableError(err)).toBe(true);
  });

  it("returns true for P1001 when only error.code is set (minified name, truncated message)", () => {
    const err = new Error("Invalid `prisma.consumerDevice.findMany()` invocation:\n\n") as Error & {
      code: string;
    };
    err.name = "Error";
    err.code = "P1001";
    expect(isDatabaseUnreachableError(err)).toBe(true);
  });

  it("returns true for PrismaClientKnownRequestError with bare invocation and no code (Next dev)", () => {
    const err = new PrismaClientKnownRequestError(
      "Invalid `prisma.consumerDevice.findMany()` invocation:\n\n",
      { code: "P1001", clientVersion: "test" },
    );
    Object.defineProperty(err, "code", { value: undefined });
    expect(isDatabaseUnreachableError(err)).toBe(true);
  });

  it("returns true when only error.name is PrismaClientKnownRequestError (stripped code)", () => {
    const err = new Error("Invalid `prisma.consumerDevice.findMany()` invocation:\n\n");
    err.name = "PrismaClientKnownRequestError";
    expect(isDatabaseUnreachableError(err)).toBe(true);
  });

  it("returns true for leading newline in message (Next error overlay)", () => {
    const err = new PrismaClientKnownRequestError(
      "\nInvalid `prisma.consumerDevice.findMany()` invocation:\n\n\n",
      { code: "P1001", clientVersion: "test" },
    );
    Object.defineProperty(err, "code", { value: undefined });
    expect(isDatabaseUnreachableError(err)).toBe(true);
  });

  it("returns true for generic Error with bare invocation (minified webpack name)", () => {
    const err = new Error("\nInvalid `prisma.consumerDevice.findMany()` invocation:\n\n\n");
    expect(isDatabaseUnreachableError(err)).toBe(true);
  });

  it("returns true for P1001 nested on error.cause", () => {
    const inner = new PrismaClientKnownRequestError("Can't reach database server", {
      code: "P1001",
      clientVersion: "test",
    });
    const outer = new Error("Invalid `prisma.consumerDevice.findMany()` invocation:\n\n");
    outer.cause = inner;
    expect(isDatabaseUnreachableError(outer)).toBe(true);
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

  it("returns database_unavailable for consumerDevice drift without Prisma error metadata", async () => {
    const result = await readFromDatabase(async () => {
      throw new Error(
        "Invalid `prisma.consumerDevice.findMany()` invocation:\n\nThe column `averageLoadPercent` does not exist in the current database.",
      );
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("migrate");
    }
  });

  it("returns database_unavailable for truncated P1001 consumerDevice error", async () => {
    const err = new Error("Invalid `prisma.consumerDevice.findMany()` invocation:\n\n") as Error & {
      code: string;
    };
    err.code = "P1001";
    const result = await readFromDatabase(async () => {
      throw err;
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("Datenbank");
    }
  });

  it("returns database_unavailable for bare PrismaClientKnownRequestError without rethrowing", async () => {
    const err = new PrismaClientKnownRequestError(
      "Invalid `prisma.consumerDevice.findMany()` invocation:\n\n",
      { code: "P1001", clientVersion: "test" },
    );
    Object.defineProperty(err, "code", { value: undefined });
    const result = await readFromDatabase(async () => {
      throw err;
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("Datenbank");
    }
  });
});
