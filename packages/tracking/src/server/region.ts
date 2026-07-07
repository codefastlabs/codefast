import type { ConsentRegion } from "#/core/consent";

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
 * Missing/unrecognized codes fall back to "other", which `resolveConsentMode` treats
 * as opt-out — the least restrictive default, safe only because opt-in regions (EU/VN)
 * are matched explicitly above it.
 *
 * @since 0.5.0-canary.4
 */
export function resolveRegionFromCountryCode(countryCode: string | undefined): ConsentRegion {
  if (!countryCode) {
    return "other";
  }

  const normalized = countryCode.toUpperCase();

  if (EU_COUNTRY_CODES.has(normalized)) {
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
