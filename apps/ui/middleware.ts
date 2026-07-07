import { geolocation, next } from "@vercel/functions";

// Relative, not `#/lib/...` — the `#/*` alias is a tsconfig path Vercel's independent
// middleware bundler isn't guaranteed to honor; a relative import always resolves.
import { INITIAL_CONSENT_COOKIE_NAME } from "./src/lib/initial-consent-cookie.js";

/**
 * Vercel Routing Middleware — personalizes the statically prerendered pages' consent
 * default per real visitor by setting a cookie `google-tag.tsx` prefers over its
 * build-time fallback (see `resolveInitialConsent` in `src/lib/consent.ts`).
 *
 * Self-contained on purpose: Vercel compiles this independently of the app's Vite/Nitro
 * build, so it duplicates `packages/tracking`'s EU-country/consent-mode mapping rather
 * than risk an unverified cross-package build assumption. Kept in sync by
 * `tests/unit/middleware.test.ts`.
 */

export const EU_COUNTRY_CODES = new Set([
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

export function resolveRegion(countryCode: string | undefined): "eu" | "other" | "us" | "vn" {
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

export const config = {
  matcher: ["/", "/about", "/components/:path*"],
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
    headers: { "set-cookie": `${INITIAL_CONSENT_COOKIE_NAME}=${value}; Path=/; Max-Age=86400; SameSite=Lax` },
  });
}
