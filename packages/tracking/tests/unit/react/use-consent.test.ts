import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useConsent } from "#/react/use-consent";
import { createMemoryConsentStorage } from "#/tests/unit/react/support/memory-consent-storage";

describe("useConsent", () => {
  it("blocks tracking and needs a prompt under opt-in with no stored decision", () => {
    const { result } = renderHook(() =>
      useConsent({ mode: "opt-in", policyVersion: "v1", storage: createMemoryConsentStorage() }),
    );

    expect(result.current.isTrackingAllowed).toBe(false);
    expect(result.current.needsPrompt).toBe(true);
  });

  it("allows tracking by default under opt-out, unless GPC is signaled", () => {
    const { result: withoutGpc } = renderHook(() =>
      useConsent({ mode: "opt-out", policyVersion: "v1", storage: createMemoryConsentStorage() }),
    );

    expect(withoutGpc.current.isTrackingAllowed).toBe(true);
    expect(withoutGpc.current.needsPrompt).toBe(false);

    const { result: withGpc } = renderHook(() =>
      useConsent({
        hasGlobalPrivacyControlSignal: true,
        mode: "opt-out",
        policyVersion: "v1",
        storage: createMemoryConsentStorage(),
      }),
    );

    expect(withGpc.current.isTrackingAllowed).toBe(false);
  });

  it("persists grant/deny and calls onDecision", () => {
    const storage = createMemoryConsentStorage();
    const onDecision = vi.fn();
    const { result } = renderHook(() => useConsent({ mode: "opt-in", onDecision, policyVersion: "v1", storage }));

    act(() => {
      result.current.grant();
    });

    expect(result.current.isTrackingAllowed).toBe(true);
    expect(result.current.needsPrompt).toBe(false);
    expect(onDecision).toHaveBeenCalledWith("granted");
    expect(storage.load()?.decision).toBe("granted");

    act(() => {
      result.current.deny();
    });

    expect(result.current.isTrackingAllowed).toBe(false);
    expect(onDecision).toHaveBeenCalledWith("denied");
  });

  it("reflects a previously stored decision", () => {
    const storage = createMemoryConsentStorage({ decision: "granted", policyVersion: "v1", timestamp: 0 });
    const { result } = renderHook(() => useConsent({ mode: "opt-in", policyVersion: "v1", storage }));

    expect(result.current.isTrackingAllowed).toBe(true);
    expect(result.current.needsPrompt).toBe(false);
  });

  it("ignores a decision recorded under an older policy version and re-prompts", () => {
    const storage = createMemoryConsentStorage({ decision: "granted", policyVersion: "v1", timestamp: 0 });
    const { result } = renderHook(() => useConsent({ mode: "opt-in", policyVersion: "v2", storage }));

    expect(result.current.isTrackingAllowed).toBe(false);
    expect(result.current.needsPrompt).toBe(true);
  });

  it("picks up a decision written outside the hook, e.g. from another tab", () => {
    const storage = createMemoryConsentStorage();
    const { result } = renderHook(() => useConsent({ mode: "opt-in", policyVersion: "v1", storage }));

    expect(result.current.needsPrompt).toBe(true);

    act(() => {
      storage.save({ decision: "granted", policyVersion: "v1", timestamp: 0 });
    });

    expect(result.current.needsPrompt).toBe(false);
    expect(result.current.isTrackingAllowed).toBe(true);
  });
});
