import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { updateGoogleConsent } from "#/destinations/google-analytics";
import { useConsent } from "#/react/use-consent";
import { useGoogleConsentSync } from "#/react/use-google-consent-sync";
import { createMemoryConsentStorage } from "#/tests/unit/core/support/memory-consent-storage";

vi.mock(import("#/destinations/google-analytics"), async (importOriginal) => ({
  ...(await importOriginal()),
  updateGoogleConsent: vi.fn(),
}));

describe("useGoogleConsentSync", () => {
  afterEach(() => {
    vi.mocked(updateGoogleConsent).mockClear();
  });

  it("does not emit an update while undecided", () => {
    const storage = createMemoryConsentStorage();
    const loadGtagScript = vi.fn();

    renderHook(() => {
      const consent = useConsent({ mode: "opt-in", policyVersion: "v1", storage });

      useGoogleConsentSync(consent, { loadGtagScript });

      return consent;
    });

    expect(updateGoogleConsent).not.toHaveBeenCalled();
    expect(loadGtagScript).not.toHaveBeenCalled();
  });

  it("updates Consent Mode and loads gtag after a grant", () => {
    const storage = createMemoryConsentStorage();
    const loadGtagScript = vi.fn();

    const { result } = renderHook(() => {
      const consent = useConsent({ mode: "opt-in", policyVersion: "v1", storage });

      useGoogleConsentSync(consent, { loadGtagScript });

      return consent;
    });

    act(() => {
      result.current.grantAll();
    });

    expect(updateGoogleConsent).toHaveBeenCalledWith({ ads: false, analytics: true });
    expect(loadGtagScript).toHaveBeenCalled();
  });

  it("updates Consent Mode on opt-out defaults without loading gtag when analytics is denied", () => {
    const storage = createMemoryConsentStorage();
    storage.save({
      decision: { ads: false, analytics: false },
      policyVersion: "v1",
      timestamp: Date.now(),
    });
    const loadGtagScript = vi.fn();

    renderHook(() => {
      const consent = useConsent({ mode: "opt-out", policyVersion: "v1", storage });

      useGoogleConsentSync(consent, { loadGtagScript });

      return consent;
    });

    expect(updateGoogleConsent).toHaveBeenCalledWith({ ads: false, analytics: false });
    expect(loadGtagScript).not.toHaveBeenCalled();
  });
});
