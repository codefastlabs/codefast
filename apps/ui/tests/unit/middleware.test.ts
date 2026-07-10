import { resolveConsentMode } from "@codefast/tracking/core";
import { buildInitialConsent, resolveRegionFromCountryCode } from "@codefast/tracking/server";
import { describe, expect, it } from "vitest";

import { INITIAL_CONSENT_COOKIE_NAME, REQUESTED_CONSENT_CATEGORIES } from "#/features/tracking/lib/consent";

import middleware, { OPT_IN_EQUIVALENT_COUNTRY_CODES, resolveRegion } from "../../middleware";

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
// module comment for why) — these suites are the guard that keeps them in sync. Each
// sweeps all 676 codes in one test and asserts an empty disagreement list, so a failure
// prints every diverging code with both sides' values at once.
describe("middleware's resolveRegion vs @codefast/tracking's resolveRegionFromCountryCode", () => {
  it("agrees for every two-letter country code", () => {
    const disagreements = ALL_TWO_LETTER_CODES.map((code) => ({
      code,
      middleware: resolveRegion(code),
      tracking: resolveRegionFromCountryCode(code),
    })).filter(({ middleware: fromMiddleware, tracking }) => fromMiddleware !== tracking);

    expect(disagreements).toEqual([]);
  });

  it("agrees when the country code is missing", () => {
    expect(resolveRegion(undefined)).toBe(resolveRegionFromCountryCode(undefined));
  });

  it("includes the UK/EEA opt-in equivalents the package exports", () => {
    expect([...OPT_IN_EQUIVALENT_COUNTRY_CODES].toSorted()).toEqual(["GB", "IS", "LI", "NO"]);
  });
});

describe("middleware's opt-in/opt-out split vs @codefast/tracking's resolveConsentMode", () => {
  it("agrees for every two-letter country code", () => {
    const disagreements = ALL_TWO_LETTER_CODES.map((code) => {
      const region = resolveRegion(code);
      const isOptIn = region === "eu" || region === "vn";

      return { code, middleware: isOptIn ? "opt-in" : "opt-out", tracking: resolveConsentMode(region) };
    }).filter(({ middleware: fromMiddleware, tracking }) => fromMiddleware !== tracking);

    expect(disagreements).toEqual([]);
  });
});

describe("middleware cookie payload vs buildInitialConsent", () => {
  it("matches the package helper for every two-letter country code", () => {
    const disagreements = ALL_TWO_LETTER_CODES.map((code) => {
      const response = middleware(
        new Request("https://codefastlabs.com/", { headers: { "x-vercel-ip-country": code } }),
      );

      return {
        code,
        middleware: readCookieValue(response),
        tracking: buildInitialConsent({ categories: REQUESTED_CONSENT_CATEGORIES, countryCode: code }),
      };
    }).filter(
      ({ middleware: fromMiddleware, tracking }) => JSON.stringify(fromMiddleware) !== JSON.stringify(tracking),
    );

    expect(disagreements).toEqual([]);
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

  it("sets an all-denied/opt-in cookie for a UK visitor", () => {
    const response = middleware(requestFrom("GB"));

    expect(readCookieValue(response)).toEqual(buildInitialConsent({ categories: ["analytics"], countryCode: "GB" }));
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

  // middleware.ts duplicates the cookie-name literal instead of importing from src/
  // (Vercel compiles it independently of the app build) — this is the sync guard.
  it("writes the exact cookie google-tag.tsx's bootstrap reads", () => {
    const response = middleware(requestFrom("US"));

    expect(response.headers.get("set-cookie")).toMatch(new RegExp(`^${INITIAL_CONSENT_COOKIE_NAME}=`));
  });

  it("marks the cookie Secure so it never rides a plain-HTTP request", () => {
    const response = middleware(requestFrom("US"));

    expect(response.headers.get("set-cookie")).toMatch(/; Secure$/);
  });
});
