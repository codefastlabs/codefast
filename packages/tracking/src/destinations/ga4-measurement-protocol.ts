import type { Destination } from "#/core/destination";

type MeasurementProtocolParamValue = boolean | number | string;

/**
 * Measurement Protocol event params must be flat string/number/boolean — stringify
 * anything else instead of letting GA4 silently drop it.
 */
function toMeasurementProtocolParams(props: Record<string, unknown>): Record<string, MeasurementProtocolParamValue> {
  const result: Record<string, MeasurementProtocolParamValue> = {};

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      result[key] = value;
    } else if (value !== undefined && value !== null) {
      result[key] = JSON.stringify(value);
    }
  }

  return result;
}

export interface Ga4MeasurementProtocolDestinationOptions {
  apiSecret: string;
  /** Routes to GA4's `/debug/mp/collect` validation endpoint — hits are validated but never recorded. */
  debug?: boolean;
  measurementId: string;
  name?: string;
}

/**
 * Server-side GA4 via the Measurement Protocol — for server-owned events (checkout,
 * signup) that must land in GA4 without depending on client-side gtag.js. `client_id` is
 * GA4's join key across Measurement Protocol and gtag.js hits, so callers must pass the
 * same anonymous ID the client tracker persists (SPEC.md §3), not a fresh ID per request.
 */
export function createGa4MeasurementProtocolDestination(
  options: Ga4MeasurementProtocolDestinationOptions,
): Destination {
  const name = options.name ?? "ga4-measurement-protocol";
  const host = options.debug
    ? "https://www.google-analytics.com/debug/mp/collect"
    : "https://www.google-analytics.com/mp/collect";
  const endpoint = `${host}?measurement_id=${encodeURIComponent(options.measurementId)}&api_secret=${encodeURIComponent(options.apiSecret)}`;

  return {
    name,
    async send(event) {
      const response = await fetch(endpoint, {
        body: JSON.stringify({
          client_id: event.anonymousId,
          events: [{ name: event.name, params: toMeasurementProtocolParams(event.props) }],
          ...(event.userId === undefined ? {} : { user_id: event.userId }),
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`"${name}" destination responded with ${String(response.status)}`);
      }
    },
  };
}
