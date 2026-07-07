import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveInitialConsent } from "#/lib/consent";

const { getRequestHeader } = vi.hoisted(() => ({ getRequestHeader: vi.fn() }));

vi.mock("@tanstack/react-start/server", () => ({ getRequestHeader }));

describe("resolveInitialConsent", () => {
  afterEach(() => {
    getRequestHeader.mockReset();
  });

  it("falls back to the strictest default when there's no country header (build-time prerender)", () => {
    getRequestHeader.mockReturnValue(undefined);

    expect(resolveInitialConsent()).toEqual({
      defaultConsent: { ads: false, analytics: false },
      mode: "opt-in",
      region: "other",
    });
  });

  it("resolves EU to opt-in with everything denied", () => {
    getRequestHeader.mockImplementation((name: string) => (name === "x-vercel-ip-country" ? "DE" : undefined));

    expect(resolveInitialConsent()).toEqual({
      defaultConsent: { ads: false, analytics: false },
      mode: "opt-in",
      region: "eu",
    });
  });

  it("resolves US to opt-out with analytics granted — ads is never requested here", () => {
    getRequestHeader.mockImplementation((name: string) => (name === "x-vercel-ip-country" ? "US" : undefined));

    expect(resolveInitialConsent()).toEqual({
      defaultConsent: { ads: false, analytics: true },
      mode: "opt-out",
      region: "us",
    });
  });

  it("leaves analytics granted under a GPC signal — do-not-sell-or-share only covers ads", () => {
    getRequestHeader.mockImplementation((name: string) => {
      if (name === "x-vercel-ip-country") {
        return "US";
      }

      if (name === "sec-gpc") {
        return "1";
      }

      return undefined;
    });

    expect(resolveInitialConsent()).toEqual({
      defaultConsent: { ads: false, analytics: true },
      mode: "opt-out",
      region: "us",
    });
  });
});
