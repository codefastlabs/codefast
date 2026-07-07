import { resolveConsentMode } from "@codefast/tracking/core";
import { resolveRegionFromCountryCode } from "@codefast/tracking/server";
import { describe, expect, it } from "vitest";

import middleware, { resolveRegion } from "../../middleware";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ALL_TWO_LETTER_CODES = ALPHABET.split("").flatMap((a) => ALPHABET.split("").map((b) => `${a}${b}`));

interface CookiePayload {
  defaultConsent: { ads: boolean; analytics: boolean };
  mode: string;
  region: string;
}

function readCookieValue(response: Response): CookiePayload {
  const setCookie = response.headers.get("set-cookie") ?? "";
  const value = setCookie.split(";")[0]?.split("=")[1] ?? "";

  return JSON.parse(decodeURIComponent(value)) as CookiePayload;
}

// `resolveRegion` duplicates `@codefast/tracking`'s region mapping (see middleware.ts's
// module comment for why) — these two suites are the guard that keeps them in sync.
describe("middleware's resolveRegion vs @codefast/tracking's resolveRegionFromCountryCode", () => {
  it.each(ALL_TWO_LETTER_CODES)("agrees for %s", (code) => {
    expect(resolveRegion(code)).toBe(resolveRegionFromCountryCode(code));
  });

  it("agrees when the country code is missing", () => {
    expect(resolveRegion(undefined)).toBe(resolveRegionFromCountryCode(undefined));
  });
});

describe("middleware's opt-in/opt-out split vs @codefast/tracking's resolveConsentMode", () => {
  it.each(ALL_TWO_LETTER_CODES)("agrees for %s", (code) => {
    const region = resolveRegion(code);
    const isOptIn = region === "eu" || region === "vn";

    expect(isOptIn ? "opt-in" : "opt-out").toBe(resolveConsentMode(region));
  });
});

describe("middleware", () => {
  function requestFrom(country: string | undefined, gpc?: string): Request {
    const headers = new Headers();

    if (country) {
      headers.set("x-vercel-ip-country", country);
    }

    if (gpc) {
      headers.set("sec-gpc", gpc);
    }

    return new Request("https://codefastlabs.com/", { headers });
  }

  it("sets an all-denied/opt-in cookie for an EU visitor", () => {
    const response = middleware(requestFrom("DE"));

    expect(readCookieValue(response)).toEqual({
      defaultConsent: { ads: false, analytics: false },
      mode: "opt-in",
      region: "eu",
    });
  });

  it("sets an analytics-granted/opt-out cookie for a US visitor — ads is never requested", () => {
    const response = middleware(requestFrom("US"));

    expect(readCookieValue(response)).toEqual({
      defaultConsent: { ads: false, analytics: true },
      mode: "opt-out",
      region: "us",
    });
  });

  it("keeps analytics granted under a GPC signal — do-not-sell-or-share only covers ads", () => {
    const response = middleware(requestFrom("US", "1"));

    expect(readCookieValue(response)).toEqual({
      defaultConsent: { ads: false, analytics: true },
      mode: "opt-out",
      region: "us",
    });
  });

  it("passes the request through instead of short-circuiting it", () => {
    const response = middleware(requestFrom("US"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
