import type { z } from "zod";

import { EventQueue, type EventQueueStorage } from "#/client/queue";
import type { Destination } from "#/core/destination";
import type { EventCatalog, EventsOf } from "#/core/event-catalog";
import { generateEventId } from "#/core/event-id";
import type { TrackedEvent } from "#/core/tracked-event";

/**
 * @since 0.5.0-canary.4
 */
export interface ClientTrackerOptions<Catalog extends EventCatalog> {
  /** A stable visitor id, or a resolver invoked per event — use a resolver to defer creating the id (e.g. a cookie) until an event is actually allowed to send. */
  anonymousId: string | (() => string);
  catalog: Catalog;
  destinations: Array<Destination>;
  /** Consulted before every event — return `false` to drop it entirely (nothing sent, nothing queued). Omit to always track. */
  isTrackingAllowed?: (() => boolean) | undefined;
  maxQueueSize?: number;
  maxRetries?: number;
  /** Cross-reload persistence for the offline queue — omit to keep the queue in memory only. */
  storage?: EventQueueStorage | undefined;
}

/**
 * @since 0.5.0-canary.4
 */
export interface ClientTracker<Catalog extends EventCatalog> {
  /** Drops every pending event without sending it — call this when consent is revoked. */
  clear: () => void;
  flush: () => Promise<void>;
  /** Synchronous, best-effort flush via `navigator.sendBeacon` — for page unload only. */
  flushWithBeacon: (endpoint: string) => void;
  group: (groupId: string, traits?: Record<string, unknown>) => void;
  identify: (userId: string, traits?: Record<string, unknown>) => void;
  page: (name?: string, props?: Record<string, unknown>) => void;
  track: <Name extends keyof EventsOf<Catalog, "client">>(
    name: Name,
    props: z.infer<EventsOf<Catalog, "client">[Name]["schema"]>,
  ) => void;
}

/**
 * @since 0.5.0-canary.4
 */
export function createClientTracker<Catalog extends EventCatalog>(
  options: ClientTrackerOptions<Catalog>,
): ClientTracker<Catalog> {
  // SDK-backed destinations own their batching/unload delivery — routing them through
  // the queue would only delay events and replay stale ones next session.
  const immediateDestinations = options.destinations.filter((destination) => destination.delivery === "immediate");
  const queuedDestinations = options.destinations.filter((destination) => destination.delivery !== "immediate");
  const queue = new EventQueue({
    destinations: queuedDestinations,
    maxQueueSize: options.maxQueueSize,
    maxRetries: options.maxRetries,
    storage: options.storage ?? {
      load: () => [],
      save: () => {
        /* in-memory queue — nothing to persist */
      },
    },
  });
  let userId: string | undefined;

  function enqueue(name: string, props: Record<string, unknown>): void {
    // The gate runs per event (not at creation) so a consent change mid-session applies immediately.
    if (options.isTrackingAllowed?.() === false) {
      return;
    }

    const envelope: TrackedEvent = {
      anonymousId: typeof options.anonymousId === "function" ? options.anonymousId() : options.anonymousId,
      eventId: generateEventId(),
      name,
      owner: "client",
      props,
      timestamp: Date.now(),
      ...(userId === undefined ? {} : { userId }),
    };

    for (const destination of immediateDestinations) {
      try {
        void Promise.resolve(destination.send(envelope)).catch(() => {
          /* an immediate destination owns its transport — no retry path here */
        });
      } catch {
        /* a sync throw must never break the tracked interaction */
      }
    }

    // Still enqueued unconditionally — the queue also feeds `flushWithBeacon`, which
    // ships raw envelopes to a custom endpoint independently of any destination.
    queue.enqueue(envelope);
  }

  return {
    clear: () => {
      queue.clear();
    },
    flush: () => queue.flush(),
    flushWithBeacon(endpoint) {
      const events = queue.drain();

      if (events.length === 0) {
        return;
      }

      const delivered = navigator.sendBeacon(endpoint, JSON.stringify(events));

      if (!delivered) {
        for (const event of events) {
          queue.enqueue(event);
        }
      }
    },
    group(groupId, traits = {}) {
      enqueue("$group", { groupId, ...traits });
    },
    identify(id, traits = {}) {
      userId = id;
      enqueue("$identify", traits);
    },
    page(name, props = {}) {
      enqueue("$page_viewed", name === undefined ? props : { name, ...props });
    },
    track(name, props) {
      // noUncheckedIndexedAccess types this as possibly undefined; the owner check also
      // guards callers who bypass the EventsOf filter with an `as` cast.
      const definition = options.catalog[name];

      if (!definition || definition.owner !== "client") {
        throw new Error(`Unknown client-owned event: ${String(name)}`);
      }

      definition.schema.parse(props);
      enqueue(name as string, props as Record<string, unknown>);
    },
  };
}
