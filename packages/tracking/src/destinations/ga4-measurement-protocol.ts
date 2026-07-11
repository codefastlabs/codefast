import { readCookieValue } from "#/core/cookie";
import type { Destination } from "#/core/destination";
import type { TrackedEvent } from "#/core/tracked-event";
import { assertNever } from "#/core/tracked-event";
import { warnUnlessGa4EventName } from "#/destinations/google-consent";
import type { FlatPropertyValue } from "#/destinations/shared";
import { flattenEventProps, toJoinGroupPayload } from "#/destinations/shared";

type MeasurementProtocolParamValue = FlatPropertyValue;

/**
 * Reads gtag.js's own client ID from a request Cookie header — `_ga=GA1.1.123.456` →
 * `123.456`. This (not an app-generated anonymous ID) is the value GA4 joins hits on, so
 * pass it as `clientId` to make server events land on the same user as the visitor's
 * client-side hits.
 *
 * @since 0.5.0-canary.4
 */
export function extractGa4ClientId(cookieHeader: string | undefined): string | undefined {
  const value = readCookieValue(cookieHeader, "_ga");

  if (!value) {
    return undefined;
  }

  // Format: GA1.<domain-depth>.<random>.<timestamp> — the client ID is the last two segments.
  const segments = value.split(".");

  return segments.length >= 4 ? segments.slice(-2).join(".") : undefined;
}

/**
 * Reads the current GA4 session ID from the per-stream `_ga_<suffix>` cookie
 * (`G-ABC123` → `_ga_ABC123`) — handles both the dot-delimited `GS1` and the
 * `$`-delimited `GS2` value formats.
 *
 * @since 0.5.0-canary.4
 */
export function extractGa4SessionId(cookieHeader: string | undefined, measurementId: string): string | undefined {
  const value = readCookieValue(cookieHeader, `_ga_${measurementId.replace(/^G-/, "")}`);

  if (!value) {
    return undefined;
  }

  // GS1.1.<session_id>.<count>... vs GS2.1.s<session_id>$o<count>... — the session ID is
  // the first number after the version prefix either way.
  const match = /^GS\d+\.\d+\.s?(\d+)/.exec(value);

  return match?.[1];
}

/**
 * @since 0.5.0-canary.4
 */
export interface Ga4MeasurementProtocolDestinationOptions {
  apiSecret: string;
  /**
   * gtag.js's client ID for this visitor (see `extractGa4ClientId`). Without it the
   * event falls back to the tracker's anonymous ID, which GA4 treats as a *different
   * user* than the visitor's client-side hits — pass it whenever the request carries a
   * `_ga` cookie.
   */
  clientId?: string | undefined;
  /** Routes to GA4's `/debug/mp/collect` validation endpoint — hits are validated but never recorded. */
  debugMode?: boolean | undefined;
  measurementId: string;
  name?: string | undefined;
  /**
   * Per-request abort deadline — a stalled Google endpoint must never hold an awaiting
   * server function open indefinitely.
   *
   * @defaultValue 10_000
   */
  requestTimeoutMs?: number | undefined;
  /**
   * Current GA4 session for this visitor (see `extractGa4SessionId`). Without a
   * `session_id`, GA4 accepts the event but leaves it out of session-scoped and realtime
   * reporting.
   */
  sessionId?: string | undefined;
}

/**
 * Server-side GA4 via the Measurement Protocol — for server-owned events (checkout,
 * signup) that must land in GA4 without depending on client-side gtag.js. MP is designed
 * to *augment* gtag.js data, so correlation hinges on echoing gtag's own identifiers:
 * `clientId` from the `_ga` cookie and `sessionId` from the `_ga_<stream>` cookie.
 *
 * @since 0.5.0-canary.4
 */
export function createGa4MeasurementProtocolDestination(
  options: Ga4MeasurementProtocolDestinationOptions,
): Destination {
  const name = options.name ?? "ga4-measurement-protocol";
  const host = options.debugMode
    ? "https://www.google-analytics.com/debug/mp/collect"
    : "https://www.google-analytics.com/mp/collect";
  const endpoint = `${host}?measurement_id=${encodeURIComponent(options.measurementId)}&api_secret=${encodeURIComponent(options.apiSecret)}`;
  const requestTimeoutMs = options.requestTimeoutMs ?? 10_000;

  return {
    name,
    async send(event, sendOptions) {
      const translated = toMeasurementProtocolEvent(event);

      // No GA4 equivalent (alias merges via user_id; identify only carries identity).
      if (translated === undefined) {
        return;
      }

      const { name: eventName, params } = translated;

      // Catalog track names still have to satisfy GA4's rules — MP accepts the HTTP
      // request either way, but invalid names are dropped at processing with no signal.
      if (event.type === "track" && !warnUnlessGa4EventName(name, eventName)) {
        return;
      }

      if (options.sessionId !== undefined && params.session_id === undefined) {
        params.session_id = options.sessionId;
      }

      // Without an engagement time GA4 won't count the user as active in realtime;
      // 100ms is the fallback Google's own MP examples use when elapsed time is unknown.
      params.engagement_time_msec ??= 100;

      const response = await fetch(endpoint, {
        body: JSON.stringify({
          client_id: options.clientId ?? event.anonymousId,
          events: [{ name: eventName, params }],
          // MP stamps receipt time otherwise — retried events would drift.
          timestamp_micros: event.timestamp * 1000,
          ...(event.userId === undefined ? {} : { user_id: event.userId }),
        }),
        headers: { "content-type": "application/json" },
        keepalive: sendOptions?.keepalive ?? false,
        method: "POST",
        // Created per attempt — a shared signal would start (and stay) aborted after the first timeout.
        signal: AbortSignal.timeout(requestTimeoutMs),
      });

      if (!response.ok) {
        throw new Error(`"${name}" destination responded with ${String(response.status)}`);
      }
    },
  };
}

/** Maps each envelope kind onto GA4's event vocabulary; `undefined` means "no equivalent, skip". */
function toMeasurementProtocolEvent(
  event: TrackedEvent,
): { name: string; params: Record<string, MeasurementProtocolParamValue> } | undefined {
  switch (event.type) {
    case "alias":
    case "identify": {
      return undefined;
    }

    case "group": {
      return { name: "join_group", params: flattenEventProps(toJoinGroupPayload(event)) };
    }

    case "page": {
      return { name: "page_view", params: flattenEventProps(event.properties) };
    }

    case "track": {
      return { name: event.name, params: flattenEventProps(event.properties) };
    }

    default: {
      assertNever(event);
    }
  }
}
