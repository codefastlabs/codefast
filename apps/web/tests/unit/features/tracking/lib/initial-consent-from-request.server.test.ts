import { describe, expect, it, vi } from "vitest";

import { initialConsentFromRequest } from "#features/tracking/lib/initial-consent-from-request.server";

const { resolveInitialConsentFromRequest } = vi.hoisted(() => ({
  resolveInitialConsentFromRequest: vi.fn(() => ({
    defaultConsent: { ads: false, analytics: true },
    mode: "opt-out",
    region: "us",
  })),
}));

vi.mock("@codefast/tracking/adapters/tanstack-start", () => ({ resolveInitialConsentFromRequest }));

describe("initialConsentFromRequest", () => {
  it("passes the app's requested categories to the tracking adapter", () => {
    expect(initialConsentFromRequest()).toEqual({
      defaultConsent: { ads: false, analytics: true },
      mode: "opt-out",
      region: "us",
    });
    expect(resolveInitialConsentFromRequest).toHaveBeenCalledWith({ requestedCategories: ["analytics"] });
  });
});
