import type { Destination, DestinationSendOptions } from "#/core/destination";
import type { TrackedEvent } from "#/core/tracked-event";

/**
 * @since 0.5.0-canary.4
 */
export interface HttpDestinationOptions {
  endpoint: string;
  headers?: Record<string, string> | undefined;
  name: string;
  /**
   * Per-request abort deadline — a stalled collector must never hold a flush (or an
   * awaiting server function) open indefinitely.
   *
   * @defaultValue 10_000
   */
  requestTimeoutMs?: number | undefined;
}

/**
 * Generic fetch-based `Destination` — the building block for a real provider adapter
 * (PostHog, GA4, ...); those ship their own payload shape and aren't implemented here.
 * Implements `sendBatch` (one POST with a JSON array), so a queue flush of N events costs
 * one request instead of N.
 *
 * @since 0.5.0-canary.4
 */
export function createHttpDestination(options: HttpDestinationOptions): Destination {
  const requestTimeoutMs = options.requestTimeoutMs ?? 10_000;

  async function post(body: TrackedEvent | Array<TrackedEvent>, sendOptions?: DestinationSendOptions): Promise<void> {
    const response = await fetch(options.endpoint, {
      body: JSON.stringify(body),
      headers: { "content-type": "application/json", ...options.headers },
      keepalive: sendOptions?.keepalive ?? false,
      method: "POST",
      // Created per attempt — a shared signal would start (and stay) aborted after the first timeout.
      signal: AbortSignal.timeout(requestTimeoutMs),
    });

    if (!response.ok) {
      throw new Error(`"${options.name}" destination responded with ${String(response.status)}`);
    }
  }

  return {
    name: options.name,
    send: (event, sendOptions) => post(event, sendOptions),
    sendBatch: (events, sendOptions) => post(events, sendOptions),
  };
}
