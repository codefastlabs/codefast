import { resolveInitialConsent } from "#/lib/consent";

const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;

/**
 * Always mounts the `window.__INITIAL_CONSENT__` bootstrap (so `<ConsentGate />` has a
 * value to hydrate from, GA4 configured or not) and, when `measurementId` is set, gtag.js
 * itself for GA4 + the Google Ads conversion destination (both share this one
 * `window.gtag`) — a no-op past the bootstrap when the env var is unset, so preview/dev
 * deploys with no real Google account never load the script.
 *
 * The consent default comes from `resolveInitialConsent()` (region + GPC resolved from
 * request headers) so the SSR'd default and the client `useConsent` state
 * (`ConsentGate`) never disagree — no client-only guess, no flash of the wrong consent
 * state after hydration.
 */
export function GoogleTag() {
  const initialConsent = resolveInitialConsent();
  const state = initialConsent.defaultGranted ? "granted" : "denied";

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: `window.__INITIAL_CONSENT__ = ${JSON.stringify(initialConsent)};` }}
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
                gtag("consent", "default", {
                  ad_personalization: "${state}",
                  ad_storage: "${state}",
                  ad_user_data: "${state}",
                  analytics_storage: "${state}",
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
