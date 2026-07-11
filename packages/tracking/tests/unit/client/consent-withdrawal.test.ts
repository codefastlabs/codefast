import { describe, expect, it, vi } from "vitest";

import { createConsentWithdrawalHandler } from "#/client/consent-withdrawal";

describe("createConsentWithdrawalHandler", () => {
  it("clears first-party tracking state when analytics is denied", () => {
    const clearAnonymousId = vi.fn();
    const clearGoogleAnalyticsCookies = vi.fn();
    const onDecision = createConsentWithdrawalHandler({
      clearAnonymousId,
      clearGoogleAnalyticsCookies,
    });

    onDecision({ ads: false, analytics: false });

    expect(clearAnonymousId).toHaveBeenCalledOnce();
    expect(clearGoogleAnalyticsCookies).toHaveBeenCalledOnce();
  });

  it("is a no-op when analytics is granted", () => {
    const clearAnonymousId = vi.fn();
    const onDecision = createConsentWithdrawalHandler({ clearAnonymousId });

    onDecision({ ads: false, analytics: true });

    expect(clearAnonymousId).not.toHaveBeenCalled();
  });
});
