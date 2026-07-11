import type { ConsentRegion } from "#/core/consent";

/**
 * EU member states — GDPR opt-in via `resolveConsentMode("eu")`.
 *
 * @since 1.0.0-canary.6
 */
export const EU_COUNTRY_CODES: ReadonlySet<string> = new Set([
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

/**
 * UK GDPR (post-Brexit) and EEA/EFTA states that apply GDPR-equivalent rules — mapped to
 * the same `"eu"` consent region so they get opt-in, not the `"other"` opt-out default.
 *
 * Restricted edge runtimes that cannot import this package should duplicate these codes
 * and keep a sync test against this export.
 *
 * @since 1.0.0-canary.6
 */
export const OPT_IN_EQUIVALENT_COUNTRY_CODES: ReadonlySet<string> = new Set(["GB", "IS", "LI", "NO"]);

/**
 * Unrecognized codes fall back to "other", which `resolveConsentMode` treats as
 * opt-out — safe only because opt-in regions (EU/VN plus UK/EEA/EFTA above) are matched
 * explicitly. A *missing* code also maps to "other" here, but `resolveInitialConsent`
 * intercepts that case first and fails closed — unknown is not known-elsewhere.
 *
 * @since 0.5.0-canary.4
 */
export function resolveRegionFromCountryCode(countryCode: string | undefined): ConsentRegion {
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

/**
 * Reads the hosting platform's geo header (e.g. Vercel's `x-vercel-ip-country`) — pass
 * the incoming request's `Headers` from server-function/middleware context.
 *
 * @since 0.5.0-canary.4
 */
export function resolveRegion(headers: Headers, headerName = "x-vercel-ip-country"): ConsentRegion {
  return resolveRegionFromCountryCode(headers.get(headerName) ?? undefined);
}
