import { afterEach, describe, expect, it, vi } from "vitest";

import { createLocalStorageConsentStorage } from "#/client/consent-storage";

describe("createLocalStorageConsentStorage", () => {
  it("round-trips a consent record", () => {
    const storage = createLocalStorageConsentStorage("tracking-consent");
    const record = { decision: "granted" as const, policyVersion: "2026-01", timestamp: 1000 };

    storage.save(record);
    expect(storage.load()).toEqual(record);

    storage.clear();
    expect(storage.load()).toBeUndefined();
  });

  it("treats missing or corrupt state as no decision yet", () => {
    const storage = createLocalStorageConsentStorage("tracking-consent-corrupt");

    localStorage.setItem("tracking-consent-corrupt", "{not json");
    expect(storage.load()).toBeUndefined();
  });

  describe("without a window (SSR)", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("never throws, treating every call as a no-op with no decision", () => {
      vi.stubGlobal("window", undefined);

      const storage = createLocalStorageConsentStorage("tracking-consent-ssr");

      expect(() => {
        storage.save({ decision: "granted", policyVersion: "2026-01", timestamp: 1000 });
      }).not.toThrow();
      expect(storage.load()).toBeUndefined();
      expect(() => {
        storage.clear();
      }).not.toThrow();
    });
  });
});
