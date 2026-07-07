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

  it("notifies subscribers on save and clear, and stops after unsubscribe", () => {
    const storage = createLocalStorageConsentStorage("tracking-consent-subscribe");
    const listener = vi.fn();
    const unsubscribe = storage.subscribe(listener);

    storage.save({ decision: "granted", policyVersion: "2026-01", timestamp: 1000 });
    expect(listener).toHaveBeenCalledTimes(1);

    storage.clear();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    storage.save({ decision: "denied", policyVersion: "2026-01", timestamp: 2000 });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("notifies subscribers when another tab writes the same key (storage event)", () => {
    const storage = createLocalStorageConsentStorage("tracking-consent-crosstab");
    const listener = vi.fn();
    const unsubscribe = storage.subscribe(listener);

    window.dispatchEvent(new StorageEvent("storage", { key: "tracking-consent-crosstab" }));
    expect(listener).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new StorageEvent("storage", { key: "unrelated-key" }));
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it("falls back to an in-memory record for the session when localStorage is blocked", () => {
    const storage = createLocalStorageConsentStorage("tracking-consent-blocked");
    const record = { decision: "granted" as const, policyVersion: "2026-01", timestamp: 1000 };
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("quota");
    });

    storage.save(record);
    expect(storage.load()).toEqual(record);

    setItem.mockRestore();
    getItem.mockRestore();
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
