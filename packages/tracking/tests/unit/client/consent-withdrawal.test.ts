import { describe, expect, it, vi } from "vitest";

import { createConsentWithdrawalHandler } from "#/client/consent-withdrawal";

describe("createConsentWithdrawalHandler", () => {
  it("clears tracker state when analytics is denied", () => {
    const clearTracker = vi.fn();
    const clearAnonymousId = vi.fn();
    const clearGoogleAnalyticsCookies = vi.fn();
    const onDecision = createConsentWithdrawalHandler({
      clearAnonymousId,
      clearGoogleAnalyticsCookies,
      clearTracker,
    });

    onDecision({ ads: false, analytics: false });

    expect(clearTracker).toHaveBeenCalledOnce();
    expect(clearAnonymousId).toHaveBeenCalledOnce();
    expect(clearGoogleAnalyticsCookies).toHaveBeenCalledOnce();
  });

  it("is a no-op when analytics is granted", () => {
    const clearTracker = vi.fn();
    const onDecision = createConsentWithdrawalHandler({ clearTracker });

    onDecision({ ads: false, analytics: true });

    expect(clearTracker).not.toHaveBeenCalled();
  });
});
