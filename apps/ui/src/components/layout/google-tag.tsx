const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;

/**
 * Mounts gtag.js in `<head>`, once, for GA4 + the Google Ads conversion destination
 * (both share this one `window.gtag`) — a no-op when the env var is unset, so
 * preview/dev deploys with no real Google account never load the script.
 *
 * Consent Mode v2 defaults to fully denied: apps/ui has no region detection or consent
 * banner wired yet (see `@codefast/tracking` SPEC.md §7), so denying by default is the
 * only choice that doesn't risk tracking an EU/VN visitor before consent exists. Once a
 * real consent flow is wired, replace this with `setGoogleConsentDefault`/
 * `updateGoogleConsent` driven by `useConsent`.
 */
export function GoogleTag() {
  if (!measurementId) {
    return null;
  }

  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag("consent", "default", {
              ad_personalization: "denied",
              ad_storage: "denied",
              ad_user_data: "denied",
              analytics_storage: "denied",
            });
            gtag("js", new Date());
            gtag("config", "${measurementId}");
          `,
        }}
        suppressHydrationWarning
      />
    </>
  );
}
