import type { TrackedEvent } from "#/core/tracked-event";

/**
 * Fan-out target for tracked events (PostHog, GA4, a self-hosted store, ...).
 * Trackers depend only on this interface, never on a specific provider SDK.
 */
export interface Destination {
  name: string;
  send: (event: TrackedEvent) => Promise<void> | void;
}
