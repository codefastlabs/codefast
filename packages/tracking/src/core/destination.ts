import type { TrackedEvent } from "#/core/tracked-event";

/**
 * Fan-out target for tracked events (PostHog, GA4, a self-hosted store, ...).
 * Trackers depend only on this interface, never on a specific provider SDK.
 */
export interface Destination {
  /**
   * "immediate" for SDK-backed destinations that own their transport (gtag.js, Vercel's
   * in-page queue) — the client tracker calls `send` at track time and never queues,
   * persists, or retries for them.
   *
   * @defaultValue "queued"
   */
  deliver?: "immediate" | "queued";
  name: string;
  send: (event: TrackedEvent) => Promise<void> | void;
}
