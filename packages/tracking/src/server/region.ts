import type { ConsentRegion } from "#/core/consent";

/** EU member states — GDPR opt-in via `resolveConsentMode("eu")`. */
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

/**
 * UK GDPR (post-Brexit) and EEA/EFTA states that apply GDPR-equivalent rules — mapped to
 * the same `"eu"` consent region so they get opt-in, not the `"other"` opt-out default.
 */
const OPT_IN_EQUIVALENT_COUNTRY_CODES = new Set(["GB", "IS", "LI", "NO"]);

/**
 * Missing/unrecognized codes fall back to "other", which `resolveConsentMode` treats
 * as opt-out — the least restrictive default, safe only because opt-in regions (EU/VN
 * plus UK/EEA/EFTA above) are matched explicitly.
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
