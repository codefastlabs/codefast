import { geolocation, next } from "@vercel/functions";

/**
 * Vercel Routing Middleware — runs on every matched request *before* the CDN cache, so
 * it can personalize a statically prerendered page per real visitor even though the
 * page's own HTML is generated once at build time with no visitor to resolve against
 * (see `resolveInitialConsent` in `src/lib/consent.ts`, which the static build falls
 * back to the strictest "denied" default for exactly that reason).
 *
 * Sets a `cf-initial-consent` cookie from the *real* request's geo + GPC signal; the
 * inline bootstrap script in `google-tag.tsx` prefers this cookie over the baked-in
 * static fallback when present, so GA4's Consent Mode default matches the visitor's
 * actual region without needing a second network round trip.
 *
 * Deliberately self-contained (no `@codefast/tracking` import): this file is compiled
 * by Vercel's own platform tooling, independent of the app's Vite/Nitro build, and
 * relying on cross-package resolution here is an untested assumption this repo's local
 * tooling can't verify before a real deploy. The EU country list and consent-mode
 * mapping are duplicated from `packages/tracking/src/server/region.ts` and
 * `packages/tracking/src/core/consent.ts` on purpose — keep them in sync if either
 * changes.
 */

const COOKIE_NAME = "cf-initial-consent";

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

function resolveRegion(countryCode: string | undefined): "eu" | "other" | "us" | "vn" {
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
  const hasGpcSignal = request.headers.get("sec-gpc") === "1";
  const defaultGranted = isOptIn ? false : !hasGpcSignal;

  const value = encodeURIComponent(JSON.stringify({ defaultGranted, mode: isOptIn ? "opt-in" : "opt-out", region }));

  return next({
    headers: { "set-cookie": `${COOKIE_NAME}=${value}; Path=/; Max-Age=86400; SameSite=Lax` },
  });
}
