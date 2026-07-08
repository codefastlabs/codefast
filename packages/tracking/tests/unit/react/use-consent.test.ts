import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ConsentRecord, ConsentStorage } from "#/core/consent";
import { useConsent } from "#/react/use-consent";
import { createMemoryConsentStorage } from "#/tests/unit/react/support/memory-consent-storage";

describe("useConsent", () => {
  it("blocks tracking and needs a prompt under opt-in with no stored decision", () => {
    const { result } = renderHook(() =>
      useConsent({ mode: "opt-in", policyVersion: "v1", storage: createMemoryConsentStorage() }),
    );

    expect(result.current.decision).toBeUndefined();
    expect(result.current.effectiveConsent).toEqual({ ads: false, analytics: false });
    expect(result.current.isTrackingAllowed).toBe(false);
    expect(result.current.isPromptNeeded).toBe(true);
  });

  it("grants the requested categories by default under opt-out — never the unrequested ones", () => {
    const { result } = renderHook(() =>
      useConsent({ mode: "opt-out", policyVersion: "v1", storage: createMemoryConsentStorage() }),
    );

    // categories defaults to ["analytics"], so ads stays denied.
    expect(result.current.effectiveConsent).toEqual({ ads: false, analytics: true });
    expect(result.current.isTrackingAllowed).toBe(true);
    expect(result.current.isPromptNeeded).toBe(false);
  });

  it("honors GPC as an ads opt-out without withdrawing analytics", () => {
    const { result } = renderHook(() =>
      useConsent({
        categories: ["ads", "analytics"],
        hasGlobalPrivacyControlSignal: true,
        mode: "opt-out",
        policyVersion: "v1",
        storage: createMemoryConsentStorage(),
      }),
    );

    expect(result.current.effectiveConsent).toEqual({ ads: false, analytics: true });
    expect(result.current.isTrackingAllowed).toBe(true);
  });

  it("grantAll grants only the requested categories, denyAll denies everything, both call onDecision", () => {
    const storage = createMemoryConsentStorage();
    const onDecision = vi.fn();
    const { result } = renderHook(() =>
      useConsent({ categories: ["analytics"], mode: "opt-in", onDecision, policyVersion: "v1", storage }),
    );

    act(() => {
      result.current.grantAll();
    });

    expect(result.current.isTrackingAllowed).toBe(true);
    expect(result.current.isPromptNeeded).toBe(false);
    expect(onDecision).toHaveBeenCalledWith({ ads: false, analytics: true });
    expect(storage.load()?.decision).toEqual({ ads: false, analytics: true });

    act(() => {
      result.current.denyAll();
    });

    expect(result.current.isTrackingAllowed).toBe(false);
    expect(onDecision).toHaveBeenCalledWith({ ads: false, analytics: false });
  });

  it("persists a granular per-category choice via save()", () => {
    const storage = createMemoryConsentStorage();
    const { result } = renderHook(() =>
      useConsent({ categories: ["ads", "analytics"], mode: "opt-in", policyVersion: "v1", storage }),
    );

    act(() => {
      result.current.save({ ads: false, analytics: true });
    });

    expect(storage.load()?.decision).toEqual({ ads: false, analytics: true });
    expect(result.current.effectiveConsent).toEqual({ ads: false, analytics: true });
    expect(result.current.isPromptNeeded).toBe(false);
  });

  it("reflects a previously stored decision", () => {
    const storage = createMemoryConsentStorage({
      decision: { ads: false, analytics: true },
      policyVersion: "v1",
      timestamp: 0,
    });
    const { result } = renderHook(() => useConsent({ mode: "opt-in", policyVersion: "v1", storage }));

    expect(result.current.decision).toEqual({ ads: false, analytics: true });
    expect(result.current.isTrackingAllowed).toBe(true);
    expect(result.current.isPromptNeeded).toBe(false);
  });

  it("ignores a decision recorded under an older policy version and re-prompts", () => {
    const storage = createMemoryConsentStorage({
      decision: { ads: false, analytics: true },
      policyVersion: "v1",
      timestamp: 0,
    });
    const { result } = renderHook(() => useConsent({ mode: "opt-in", policyVersion: "v2", storage }));

    expect(result.current.decision).toBeUndefined();
    expect(result.current.isTrackingAllowed).toBe(false);
    expect(result.current.isPromptNeeded).toBe(true);
  });

  it("treats a tampered or legacy string decision as no decision and re-prompts", () => {
    const storage = createMemoryConsentStorage({
      decision: "granted" as never,
      policyVersion: "v1",
      timestamp: 0,
    });
    const { result } = renderHook(() => useConsent({ mode: "opt-in", policyVersion: "v1", storage }));

    expect(result.current.decision).toBeUndefined();
    expect(result.current.isPromptNeeded).toBe(true);
  });

  it("picks up a decision written outside the hook, e.g. from another tab", () => {
    const storage = createMemoryConsentStorage();
    const { result } = renderHook(() => useConsent({ mode: "opt-in", policyVersion: "v1", storage }));

    expect(result.current.isPromptNeeded).toBe(true);

    act(() => {
      storage.save({ decision: { ads: false, analytics: true }, policyVersion: "v1", timestamp: 0 });
    });

    expect(result.current.isPromptNeeded).toBe(false);
    expect(result.current.isTrackingAllowed).toBe(true);
  });

  it("keeps the decision referentially stable when the storage parses a fresh object per load", () => {
    // Mimics the localStorage-backed storage: JSON round-trip means a new object identity
    // on every load — without the hook's cache, useSyncExternalStore would loop.
    let record: ConsentRecord | undefined = {
      decision: { ads: false, analytics: true },
      policyVersion: "v1",
      timestamp: 0,
    };
    const storage: ConsentStorage = {
      clear: () => undefined,
      load: () => (record ? (JSON.parse(JSON.stringify(record)) as ConsentRecord) : undefined),
      save: (next) => {
        record = next;
      },
      subscribe: () => () => undefined,
    };

    const { rerender, result } = renderHook(() => useConsent({ mode: "opt-in", policyVersion: "v1", storage }));
    const first = result.current.decision;

    rerender();

    expect(result.current.decision).toBe(first);
  });
});
