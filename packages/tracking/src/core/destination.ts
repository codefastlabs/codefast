import type { TrackedEvent } from "#/core/tracked-event";

/**
 * Fan-out target for tracked events (PostHog, GA4, a self-hosted store, ...).
 * Trackers depend only on this interface, never on a specific provider SDK.
 *
 * @since 0.5.0-canary.4
 */
export interface Destination {
  /**
   * "exempt" keeps this destination receiving `track`/`page` events while the client
   * tracker's consent gate is closed — only for cookieless, identifier-free sinks: gated
   * envelopes carry no `anonymousId`/`userId`, identity kinds never flow, and nothing is
   * queued or persisted, so the exempt lane only applies to `delivery: "immediate"`
   * destinations.
   *
   * @defaultValue "required"
   */
  consent?: "exempt" | "required";
  /**
   * "immediate" for SDK-backed destinations that own their transport (gtag.js, Vercel's
   * in-page queue) — the client tracker calls `send` at track time and never queues,
   * persists, or retries for them.
   *
   * @defaultValue "queued"
   */
  delivery?: "immediate" | "queued";
  name: string;
  /** Must always return a `Promise` — mark `send` `async` even if the body has no `await`. */
  send: (event: TrackedEvent) => Promise<void>;
}
