import type { z } from "zod";

import { EventQueue, type EventQueueStorage } from "#/client/queue";
import type { Destination } from "#/core/destination";
import type { EventCatalog, EventsOf } from "#/core/event-catalog";
import { generateEventId } from "#/core/event-id";
import type { TrackedEvent, TrackedEventBase } from "#/core/tracked-event";

/** The per-kind payload of an envelope — the tracker fills in the shared base fields. */
type EnvelopeSeed<Event = TrackedEvent> = Event extends TrackedEvent ? Omit<Event, keyof TrackedEventBase> : never;

/**
 * @since 0.5.0-canary.4
 */
export interface ClientTrackerOptions<Catalog extends EventCatalog> {
  /** A stable visitor id, or a resolver invoked per event — use a resolver to defer creating the id (e.g. a cookie) until an event is actually allowed to send. */
  anonymousId: string | (() => string);
  catalog: Catalog;
  destinations: Array<Destination>;
  /**
   * Consulted before every event — while it returns `false`, nothing is queued and only
   * `consent: "exempt"` destinations still receive `track`/`page` events, stripped of
   * identifiers. Omit to always track.
   */
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
  // The exempt lane is immediate-only: queueing would persist gated events for later replay.
  const exemptDestinations = immediateDestinations.filter((destination) => destination.consent === "exempt");
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

  function enqueue(seed: EnvelopeSeed): void {
    // The gate runs per event (not at creation) so a consent change mid-session applies immediately.
    const isAllowed = options.isTrackingAllowed?.() !== false;
    // Identity-centric kinds are meaningless without identifiers — the exempt lane only
    // carries behavioral counts.
    const isExemptEligible = seed.type === "track" || seed.type === "page";

    if (!isAllowed && (exemptDestinations.length === 0 || !isExemptEligible)) {
      return;
    }

    // Gated events ship identifier-free: no anonymousId is resolved (so none is ever
    // minted as a side effect) and no userId rides along — the exempt lane only carries
    // what a cookieless sink may see.
    const identity: Pick<TrackedEventBase, "anonymousId" | "userId"> = isAllowed
      ? {
          anonymousId: typeof options.anonymousId === "function" ? options.anonymousId() : options.anonymousId,
          ...(userId === undefined ? {} : { userId }),
        }
      : { anonymousId: "" };

    // The seed/base split is total by construction — the assertion only rejoins the union.
    const envelope = {
      ...seed,
      ...identity,
      eventId: generateEventId(),
      owner: "client",
      timestamp: Date.now(),
    } as TrackedEvent;

    for (const destination of isAllowed ? immediateDestinations : exemptDestinations) {
      try {
        void Promise.resolve(destination.send(envelope)).catch(() => {
          /* an immediate destination owns its transport — no retry path here */
        });
      } catch {
        /* a sync throw must never break the tracked interaction */
      }
    }

    if (isAllowed) {
      // The queue also feeds `flushWithBeacon`, which ships raw envelopes to a custom
      // endpoint independently of any destination.
      queue.enqueue(envelope);
    }
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
      enqueue({ groupId, traits, type: "group" });
    },
    identify(id, traits = {}) {
      // Mirrors enqueue()'s own gate — a denied identify must never leave its userId in the
      // closure for a later allowed event to pick up.
      if (options.isTrackingAllowed?.() !== false) {
        userId = id;
      }

      enqueue({ traits, type: "identify" });
    },
    page(name, props = {}) {
      enqueue({ name, props, type: "page" });
    },
    track(name, props) {
      // noUncheckedIndexedAccess types this as possibly undefined; the owner check also
      // guards callers who bypass the EventsOf filter with an `as` cast.
      const definition = options.catalog[name];

      if (!definition || definition.owner !== "client") {
        throw new Error(`Unknown client-owned event: ${String(name)}`);
      }

      definition.schema.parse(props);
      enqueue({ name: name as string, props: props as Record<string, unknown>, type: "track" });
    },
  };
}
