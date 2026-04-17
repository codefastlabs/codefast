import { describe, expect, it, vi } from "vitest";
import { isProductionEnvironment, isDevelopmentOrTestEnvironment } from "#/environment";

describe("environment", () => {
  it("isProductionEnvironment returns false if process is missing", () => {
    const originalProcess = globalThis.process;
    vi.stubGlobal("process", undefined);
    try {
      expect(isProductionEnvironment()).toBe(false);
    } finally {
      vi.stubGlobal("process", originalProcess);
    }
  });

  it("isProductionEnvironment returns false if process is null", () => {
    const originalProcess = globalThis.process;
    vi.stubGlobal("process", null);
    try {
      expect(isProductionEnvironment()).toBe(false);
    } finally {
      vi.stubGlobal("process", originalProcess);
    }
  });

  it("isProductionEnvironment returns true if NODE_ENV is production", () => {
    const originalProcess = globalThis.process;
    vi.stubGlobal("process", { env: { NODE_ENV: "production" } });
    try {
      expect(isProductionEnvironment()).toBe(true);
    } finally {
      vi.stubGlobal("process", originalProcess);
    }
  });

  it("isProductionEnvironment returns false if NODE_ENV is not production", () => {
    const originalProcess = globalThis.process;
    vi.stubGlobal("process", { env: { NODE_ENV: "development" } });
    try {
      expect(isProductionEnvironment()).toBe(false);
    } finally {
      vi.stubGlobal("process", originalProcess);
    }
  });

  it("isDevelopmentOrTestEnvironment is the inverse of isProductionEnvironment", () => {
    const originalProcess = globalThis.process;
    vi.stubGlobal("process", { env: { NODE_ENV: "production" } });
    try {
      expect(isDevelopmentOrTestEnvironment()).toBe(false);
    } finally {
      vi.stubGlobal("process", { env: { NODE_ENV: "development" } });
      expect(isDevelopmentOrTestEnvironment()).toBe(true);
      vi.stubGlobal("process", originalProcess);
    }
  });
});
