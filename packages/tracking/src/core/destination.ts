import type { TrackedEvent } from "#/core/tracked-event";

/**
 * Transport hints for a single delivery — set by the caller that knows the page state,
 * honored by destinations that own a raw `fetch`.
 *
 * @since 0.5.0-canary.4
 */
export interface DestinationSendOptions {
  /**
   * Set on unload-time flushes — pass through to `fetch` so the request survives page
   * dismissal (browsers cap in-flight keepalive bodies at 64KB).
   */
  keepalive?: boolean | undefined;
}

/**
 * Fan-out target for tracked events (PostHog, GA4, a self-hosted store, ...).
 * Trackers depend only on this interface, never on a specific provider SDK.
 *
 * @since 0.5.0-canary.4
 */
export interface Destination {
  /**
   * "exempt" keeps this destination receiving `track`/`page` events while the client
   * tracker's analytics gate is closed — only for cookieless, identifier-free sinks: gated
   * envelopes carry no `anonymousId`/`userId`, identity kinds never flow, and nothing is
   * queued or persisted, so the exempt lane only applies to `delivery: "immediate"`
   * destinations.
   *
   * @defaultValue "required"
   */
  consentRequirement?: "exempt" | "required" | undefined;
  /**
   * "immediate" for SDK-backed destinations that own their transport (gtag.js, Vercel's
   * in-page queue) — the client tracker calls `send` at track time and never queues,
   * persists, or retries for them.
   *
   * @defaultValue "queued"
   */
  delivery?: "immediate" | "queued" | undefined;
  name: string;
  /** Must always return a `Promise` — mark `send` `async` even if the body has no `await`. */
  send: (event: TrackedEvent, options?: DestinationSendOptions) => Promise<void>;
  /**
   * Batched counterpart to `send` — one transport call for a whole drained batch, same
   * always-return-a-`Promise` contract. Queues prefer it when present; a throw fails the
   * entire batch, so only implement it for transports with all-or-nothing semantics.
   */
  sendBatch?: ((events: Array<TrackedEvent>, options?: DestinationSendOptions) => Promise<void>) | undefined;
}
