// Window.dataLayer/window.gtag are declared globally by @codefast/tracking's google-analytics module.
export const GA_MEASUREMENT_ID: string | undefined = import.meta.env.VITE_GA4_MEASUREMENT_ID;

const GTAG_SCRIPT_URL = "https://www.googletagmanager.com/gtag/js";

/**
 * Loads gtag.js on demand — basic Consent Mode: the tag is fetched only once analytics
 * consent is effectively granted, so a denied visitor's browser never even pings Google.
 * Page-load grants are handled by `<GoogleTag />`'s inline bootstrap; this covers a grant
 * made at runtime (banner Accept, privacy-page switch). Idempotent.
 */
export function loadGoogleTagScript(): void {
  if (!GA_MEASUREMENT_ID || typeof document === "undefined") {
    return;
  }

  if (document.querySelector(`script[src^="${GTAG_SCRIPT_URL}"]`) !== null) {
    return;
  }

  window.dataLayer ??= [];

  // gtag.js requires the live Arguments object on the dataLayer — an array is a GTM message.
  window.gtag ??= function gtag() {
    window.dataLayer?.push(arguments);
  } as NonNullable<Window["gtag"]>;

  // Queued behind the consent update the caller already pushed, so the initial page_view
  // fires under the granted state when gtag.js replays the queue.
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID);

  const script = document.createElement("script");

  script.async = true;
  script.src = `${GTAG_SCRIPT_URL}?id=${GA_MEASUREMENT_ID}`;
  document.head.append(script);
}
