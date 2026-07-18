import type { ConsentDecision } from "#/core/consent";

/** A GA4 event for the Measurement Protocol. `params` are flat scalars — GA4 rejects nested values and booleans. */
export interface MeasurementProtocolEvent {
  name: string;
  params?: Record<string, number | string> | undefined;
}

/** The GA4 MP `consent` object — the two ad-consent signals the payload accepts. */
export interface MeasurementProtocolConsent {
  ad_personalization: "DENIED" | "GRANTED";
  ad_user_data: "DENIED" | "GRANTED";
}

/** Maps the package `ConsentDecision` to GA4 MP consent signals — `ads` drives both ad fields. */
export function toMeasurementProtocolConsent(decision: ConsentDecision): MeasurementProtocolConsent {
  const state = decision.ads ? "GRANTED" : "DENIED";

  return { ad_personalization: state, ad_user_data: state };
}

/**
 * Extracts the GA4 `client_id` from a `_ga` cookie value, e.g.
 * `GA1.1.1809596761.1693829043` → `1809596761.1693829043` (everything past the
 * `GA1.<version>.` prefix). The `_ga` layout is community-established, not part of the
 * Measurement Protocol reference, so anything that doesn't parse returns `undefined` rather
 * than sending a malformed id.
 */
export function extractGaClientId(gaCookieValue: string | undefined): string | undefined {
  if (!gaCookieValue) {
    return undefined;
  }

  const segments = gaCookieValue.split(".");

  if (segments.length < 4 || segments[0] !== "GA1") {
    return undefined;
  }

  return segments.slice(2).join(".");
}

/** The one network primitive the sender needs — injected so the package ships no HTTP client. */
export type MeasurementProtocolTransport = (request: { body: string; url: string }) => Promise<void>;

/** Default GA4 collection origin; use `https://region1.google-analytics.com` for EU data residency. */
const DEFAULT_ENDPOINT_ORIGIN = "https://www.google-analytics.com";

async function defaultTransport(request: { body: string; url: string }): Promise<void> {
  const response = await fetch(request.url, {
    body: request.body,
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  // MP returns 2xx with no useful body; a non-2xx is a config error worth surfacing.
  if (!response.ok) {
    throw new Error(`Measurement Protocol responded ${String(response.status)}`);
  }
}

export interface SendMeasurementProtocolEventsOptions {
  /** GA4 **API Secret** — read server-side from config, never a client-exposed var. */
  apiSecret: string;
  /** The visitor's GA4 client id (see {@link extractGaClientId}). */
  clientId: string;
  consent?: MeasurementProtocolConsent | undefined;
  endpointOrigin?: string | undefined;
  events: ReadonlyArray<MeasurementProtocolEvent>;
  measurementId: string;
  transport?: MeasurementProtocolTransport | undefined;
}

/**
 * POSTs one or more events to the GA4 Measurement Protocol for a known `client_id` — the
 * server-side counterpart to gtag.js. The caller owns credentials (never bake them) and the
 * consent gate: send only for a server-owned event the visitor's consent permits.
 *
 * @see https://developers.google.com/analytics/devguides/collection/protocol/ga4/sending-events
 */
export async function sendMeasurementProtocolEvents(options: SendMeasurementProtocolEventsOptions): Promise<void> {
  const origin = options.endpointOrigin ?? DEFAULT_ENDPOINT_ORIGIN;
  const url = `${origin}/mp/collect?measurement_id=${encodeURIComponent(options.measurementId)}&api_secret=${encodeURIComponent(options.apiSecret)}`;
  const body = JSON.stringify({
    client_id: options.clientId,
    events: options.events,
    ...(options.consent ? { consent: options.consent } : {}),
  });

  await (options.transport ?? defaultTransport)({ body, url });
}
