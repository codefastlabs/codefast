import { geolocation, next } from "@vercel/functions";

/**
 * Vercel Routing Middleware — personalizes the statically prerendered pages' consent
 * default per real visitor by setting a cookie `google-tag.tsx` prefers over its
 * build-time fallback (see `resolveInitialConsent` in `src/features/tracking/lib/consent.ts`).
 *
 * Self-contained on purpose: Vercel compiles this independently of the app's Vite/Nitro
 * build, so it duplicates `@codefast/tracking`'s EU-country / opt-in-equivalent / consent
 * mapping and the cookie-name literal rather than risk an unverified cross-boundary import.
 * Kept in sync by `tests/unit/middleware.test.ts` against `buildInitialConsent`.
 */

// Duplicates `src/features/tracking/lib/consent.ts` — middleware.test.ts guards the sync.
const INITIAL_CONSENT_COOKIE_NAME = "codefast-ui-initial-consent";

/** Mirrors `@codefast/tracking/server`'s `EU_COUNTRY_CODES` — covered by the sweep test via `resolveRegion`. */
const EU_COUNTRY_CODES = new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
]);

/** Mirrors `@codefast/tracking/server`'s `OPT_IN_EQUIVALENT_COUNTRY_CODES` (UK + EEA/EFTA). */
export const OPT_IN_EQUIVALENT_COUNTRY_CODES = new Set(["GB", "IS", "LI", "NO"]);

export function resolveRegion(countryCode: string | undefined): "eu" | "other" | "us" | "vn" {
  if (!countryCode) {
    return "other";
  }

  const normalized = countryCode.toUpperCase();

  if (EU_COUNTRY_CODES.has(normalized) || OPT_IN_EQUIVALENT_COUNTRY_CODES.has(normalized)) {
    return "eu";
  }

  if (normalized === "VN") {
    return "vn";
  }

  if (normalized === "US") {
    return "us";
  }

  return "other";
}

export const config = {
  matcher: ["/", "/about", "/privacy", "/components/:path*"],
};

export default function middleware(request: Request): Response {
  const { country } = geolocation(request);
  const region = resolveRegion(country);
  const isOptIn = region === "eu" || region === "vn";

  // Mirrors resolveDefaultConsent(mode, ["analytics"], gpc): this site never requests
  // the ads purpose, and a GPC signal is a do-not-sell-or-share (ads) opt-out — it does
  // not withdraw first-party analytics, so it has no effect on this payload.
  const defaultConsent = { ads: false, analytics: !isOptIn };

  const value = encodeURIComponent(JSON.stringify({ defaultConsent, mode: isOptIn ? "opt-in" : "opt-out", region }));

  return next({
    headers: { "set-cookie": `${INITIAL_CONSENT_COOKIE_NAME}=${value}; Path=/; Max-Age=86400; SameSite=Lax; Secure` },
  });
}
