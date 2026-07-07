import type { Destination } from "#/core/destination";

type GtagPropertyValue = boolean | number | string;

export interface GoogleAdsConversionParams {
  currency?: string | undefined;
  transactionId?: string | undefined;
  value?: number | undefined;
}

export interface GoogleAdsConversionMapping {
  /** `AW-CONVERSION_ID/CONVERSION_LABEL`, exactly as shown in the Google Ads conversion action setup. */
  sendTo: string;
  /** Derives value/currency/transactionId from the tracked event's props; omit for a valueless conversion. */
  toParams?: ((props: Record<string, unknown>) => GoogleAdsConversionParams) | undefined;
}

export interface GoogleAdsConversionDestinationOptions {
  /** Maps a catalog event name to the Google Ads conversion it should fire — events with no entry are ignored. */
  conversions: Record<string, GoogleAdsConversionMapping>;
  name?: string;
}

/**
 * Fires a Google Ads conversion via the same `window.gtag` used by
 * `createGoogleAnalyticsDestination` — mounting both destinations shares one gtag.js
 * snippet. Only events present in `conversions` produce a conversion hit; every other
 * event is a no-op, so this can be registered alongside destinations that should see
 * every event.
 */
export function createGoogleAdsConversionDestination(options: GoogleAdsConversionDestinationOptions): Destination {
  const name = options.name ?? "google-ads-conversion";

  return {
    name,
    send(event) {
      const mapping = options.conversions[event.name];

      if (!mapping) {
        return;
      }

      if (typeof window === "undefined" || typeof window.gtag !== "function") {
        return;
      }

      const conversionParams = mapping.toParams?.(event.props);
      const params: Record<string, GtagPropertyValue> = { send_to: mapping.sendTo };

      if (conversionParams?.value !== undefined) {
        params.value = conversionParams.value;
      }

      if (conversionParams?.currency !== undefined) {
        params.currency = conversionParams.currency;
      }

      if (conversionParams?.transactionId !== undefined) {
        params.transaction_id = conversionParams.transactionId;
      }

      window.gtag("event", "conversion", params);
    },
  };
}
