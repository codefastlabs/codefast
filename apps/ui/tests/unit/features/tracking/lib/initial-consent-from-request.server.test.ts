import { afterEach, describe, expect, it, vi } from "vitest";

import { STRICTEST_INITIAL_CONSENT } from "#/features/tracking/lib/consent";
import { initialConsentFromRequest } from "#/features/tracking/lib/initial-consent-from-request.server";

const { getRequestHeader, setResponseHeader } = vi.hoisted(() => ({
  getRequestHeader: vi.fn(),
  setResponseHeader: vi.fn(),
}));

vi.mock("@tanstack/react-start/server", () => ({ getRequestHeader, setResponseHeader }));

/** Drives the resolver via the headers it reads. */
function mockHeaders(countryCode: string | undefined, gpcHeader?: string): void {
  getRequestHeader.mockImplementation((name: string) => {
    if (name === "x-vercel-ip-country") {
      return countryCode;
    }

    return name === "sec-gpc" ? gpcHeader : undefined;
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("initialConsentFromRequest", () => {
  it("marks its response uncacheable — the answer is per-visitor by definition", () => {
    mockHeaders("US");
    initialConsentFromRequest();

    expect(setResponseHeader).toHaveBeenCalledWith("cache-control", "private, no-store");
  });

  it("resolves EU to opt-in with everything denied", () => {
    mockHeaders("DE");

    expect(initialConsentFromRequest()).toEqual({
      defaultConsent: { ads: false, analytics: false },
      mode: "opt-in",
      region: "eu",
    });
  });

  it("resolves US to opt-out with analytics granted — ads is never requested here", () => {
    mockHeaders("US");

    expect(initialConsentFromRequest()).toEqual({
      defaultConsent: { ads: false, analytics: true },
      mode: "opt-out",
      region: "us",
    });
  });

  it("leaves analytics granted under a GPC signal — do-not-sell-or-share only covers ads", () => {
    mockHeaders("US", "1");

    expect(initialConsentFromRequest()).toEqual({
      defaultConsent: { ads: false, analytics: true },
      mode: "opt-out",
      region: "us",
    });
  });

  it("fails closed to the strictest default when the geo header is absent (host without geo)", () => {
    mockHeaders(undefined);

    expect(initialConsentFromRequest()).toEqual(STRICTEST_INITIAL_CONSENT);
  });
});
