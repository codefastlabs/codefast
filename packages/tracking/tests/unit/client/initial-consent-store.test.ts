import { afterEach, describe, expect, it, vi } from "vitest";

import { createInitialConsentStore } from "#/client/initial-consent-store";
import type { InitialConsent } from "#/core/consent";
import { STRICTEST_INITIAL_CONSENT } from "#/core/consent";

const SESSION_KEY = "test-initial-consent";

const resolved: InitialConsent = {
  defaultConsent: { ads: false, analytics: true },
  mode: "opt-out",
  region: "us",
};

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

afterEach(() => {
  window.sessionStorage.clear();
});

describe("createInitialConsentStore", () => {
  it("starts unresolved on the strictest default, matching the server snapshot", () => {
    const store = createInitialConsentStore({ resolve: vi.fn() });

    expect(store.getSnapshot()).toEqual({ initialConsent: STRICTEST_INITIAL_CONSENT, isResolved: false });
    expect(store.getServerSnapshot()).toEqual(store.getSnapshot());
  });

  it("publishes the resolved value once and caches it for the session", async () => {
    const resolve = vi.fn().mockResolvedValue(resolved);
    const store = createInitialConsentStore({ resolve, sessionStorageKey: SESSION_KEY });
    const listener = vi.fn();

    store.subscribe(listener);
    store.ensureResolved();
    store.ensureResolved();
    await flushMicrotasks();

    expect(resolve).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toEqual({ initialConsent: resolved, isResolved: true });
    expect(listener).toHaveBeenCalled();
    expect(JSON.parse(window.sessionStorage.getItem(SESSION_KEY) ?? "")).toEqual(resolved);
  });

  it("serves the session cache without paying the round trip again", async () => {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(resolved));

    const resolve = vi.fn();
    const store = createInitialConsentStore({ resolve, sessionStorageKey: SESSION_KEY });

    store.ensureResolved();
    await flushMicrotasks();

    expect(resolve).not.toHaveBeenCalled();
    expect(store.getSnapshot().initialConsent).toEqual(resolved);
  });

  it("ignores a tampered session cache and resolves over the network", async () => {
    // opt-out may never pair with the eu region — the guard must reject it.
    window.sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ defaultConsent: { ads: true, analytics: true }, mode: "opt-out", region: "eu" }),
    );

    const resolve = vi.fn().mockResolvedValue(resolved);
    const store = createInitialConsentStore({ resolve, sessionStorageKey: SESSION_KEY });

    store.ensureResolved();
    await flushMicrotasks();

    expect(resolve).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().initialConsent).toEqual(resolved);
  });

  it("folds a synchronously throwing resolver into the fail-closed path", async () => {
    const resolve = vi.fn().mockImplementation(() => {
      throw new Error("boom");
    });
    const store = createInitialConsentStore({ resolve });

    // Must not throw into the caller — a React mount effect kicks this.
    store.ensureResolved();
    await flushMicrotasks();

    expect(store.getSnapshot()).toEqual({ initialConsent: STRICTEST_INITIAL_CONSENT, isResolved: true });
  });

  it("publishes fail-closed on error but stays retryable", async () => {
    const resolve = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(resolved);
    const store = createInitialConsentStore({ resolve, sessionStorageKey: SESSION_KEY });

    store.ensureResolved();
    await flushMicrotasks();

    expect(store.getSnapshot()).toEqual({ initialConsent: STRICTEST_INITIAL_CONSENT, isResolved: true });

    store.ensureResolved();
    await flushMicrotasks();

    expect(resolve).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot()).toEqual({ initialConsent: resolved, isResolved: true });
  });

  it("retries when connectivity returns after a failure — a visible tab must not stay fail-closed", async () => {
    const resolve = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(resolved);
    const store = createInitialConsentStore({ resolve });

    store.ensureResolved();
    await flushMicrotasks();

    window.dispatchEvent(new Event("online"));
    await flushMicrotasks();

    expect(resolve).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot().initialConsent).toEqual(resolved);
  });

  it("retries when the tab becomes visible again after a failure", async () => {
    const resolve = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(resolved);
    const store = createInitialConsentStore({ resolve });

    store.ensureResolved();
    await flushMicrotasks();

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    document.dispatchEvent(new Event("visibilitychange"));
    await flushMicrotasks();

    expect(resolve).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot().initialConsent).toEqual(resolved);
  });

  it("reset clears resolved state and the session cache", async () => {
    const resolve = vi.fn().mockResolvedValue(resolved);
    const store = createInitialConsentStore({ resolve, sessionStorageKey: SESSION_KEY });

    store.ensureResolved();
    await flushMicrotasks();
    store.reset();

    expect(store.getSnapshot()).toEqual({ initialConsent: STRICTEST_INITIAL_CONSENT, isResolved: false });
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });
});
