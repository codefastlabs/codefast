import { resolveInitialConsent } from "#/lib/consent";

const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;

/** Must match `COOKIE_NAME` in `middleware.ts`. */
const INITIAL_CONSENT_COOKIE = "cf-initial-consent";

/**
 * Always mounts the `window.__INITIAL_CONSENT__` bootstrap (so `<ConsentGate />` has a
 * value to hydrate from, GA4 configured or not) and, when `measurementId` is set, gtag.js
 * itself for GA4 (both share this one `window.gtag`) — a no-op past the bootstrap when
 * the env var is unset, so preview/dev deploys with no real Google account never load
 * the script.
 *
 * `resolveInitialConsent()` gives the *build-time* fallback — for a statically
 * prerendered page (this app prerenders every route) that value is baked into the HTML
 * forever, with no real visitor to resolve a region from, so it's pinned to the
 * strictest "denied" default rather than a wrong "granted" served to every future
 * visitor including real EU/VN ones. `middleware.ts` runs per real request (even for a
 * cached static response — Vercel Routing Middleware executes before the CDN cache) and
 * sets `cf-initial-consent` from the visitor's actual geo + GPC signal; the bootstrap
 * script below prefers that cookie over the baked fallback whenever it's present, so the
 * gtag consent default matches the real visitor without a second network round trip.
 */
export function GoogleTag() {
  const initialConsent = resolveInitialConsent();

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              var fallback = ${JSON.stringify(initialConsent)};
              var match = document.cookie.match(/(?:^|; )${INITIAL_CONSENT_COOKIE}=([^;]*)/);
              var resolved = fallback;
              if (match) {
                try {
                  resolved = JSON.parse(decodeURIComponent(match[1]));
                } catch (e) {}
              }
              window.__INITIAL_CONSENT__ = resolved;
            })();
          `,
        }}
        suppressHydrationWarning
      />
      {measurementId ? (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                var state = window.__INITIAL_CONSENT__.defaultGranted ? "granted" : "denied";
                gtag("consent", "default", {
                  ad_personalization: state,
                  ad_storage: state,
                  ad_user_data: state,
                  analytics_storage: state,
                });
                gtag("js", new Date());
                gtag("config", "${measurementId}");
              `,
            }}
            suppressHydrationWarning
          />
        </>
      ) : null}
    </>
  );
}
