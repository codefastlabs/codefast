import type { z } from "zod";

import { EventQueue, type EventQueueStorage } from "#/client/queue";
import type { Destination } from "#/core/destination";
import type { EventCatalog, EventsOf } from "#/core/event-catalog";
import { generateEventId } from "#/core/event-id";
import type { TrackedEvent, TrackedEventBase, TrackedEventSeed } from "#/core/tracked-event";
import { buildTrackedEvent } from "#/core/tracked-event";

/**
 * `Destination.send` is typed to always return a `Promise`, but that's unenforceable at
 * runtime for a third-party/plain-JS destination — one that ignores the contract and
 * throws synchronously (or returns a non-`Promise`) must still never break the tracked
 * interaction. `Promise.resolve(...)` normalizes a non-`Promise` return; the outer
 * try/catch is the only thing that can catch a throw that happens before `send` ever
 * gets to return anything.
 */
function sendToDestination(destination: Destination, event: TrackedEvent): void {
  try {
    void Promise.resolve(destination.send(event)).catch(() => {
      /* an immediate destination owns its transport — no retry path here */
    });
  } catch {
    /* a sync throw must never break the tracked interaction */
  }
}

/**
 * @since 0.5.0-canary.4
 */
export interface ClientTrackerOptions<Catalog extends EventCatalog> {
  /** Invoked per allowed event — defer creating the id (e.g. minting a cookie) until an event is actually allowed to send, never as an import-time side effect. */
  anonymousId: () => string;
  catalog: Catalog;
  destinations: Array<Destination>;
  /**
   * Analytics-consent gate consulted before every event — while it returns `false`,
   * nothing is queued and only `consentRequirement: "exempt"` destinations still receive
   * `track`/`page` events, stripped of identifiers. Omit to always allow. Name mirrors
   * `useConsent`'s `isAnalyticsAllowed` (the `analytics` category), not all tracking.
   */
  isAnalyticsAllowed?: (() => boolean) | undefined;
  maxQueueSize?: number | undefined;
  maxRetries?: number | undefined;
  /** Cross-reload persistence for the offline queue — omit to keep the queue in memory only. */
  storage?: EventQueueStorage | undefined;
}

/**
 * @since 0.5.0-canary.4
 */
export interface ClientTracker<Catalog extends EventCatalog> {
  /**
   * Drops every pending event and forgets the in-memory `userId` from `identify` — call
   * when consent is revoked. Does not clear a cookie-backed anonymous id; call that
   * helper's `clear()` separately when the visitor withdraws tracking consent.
   */
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
  const exemptDestinations = immediateDestinations.filter((destination) => destination.consentRequirement === "exempt");
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

  function enqueue(seed: TrackedEventSeed): void {
    // The gate runs per event (not at creation) so a consent change mid-session applies immediately.
    const isAllowed = options.isAnalyticsAllowed?.() !== false;
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
      ? { anonymousId: options.anonymousId(), ...(userId === undefined ? {} : { userId }) }
      : { anonymousId: "" };

    const envelope = buildTrackedEvent(seed, {
      ...identity,
      eventId: generateEventId(),
      owner: "client",
      timestamp: Date.now(),
    });

    for (const destination of isAllowed ? immediateDestinations : exemptDestinations) {
      sendToDestination(destination, envelope);
    }

    if (isAllowed) {
      // The queue also feeds `flushWithBeacon`, which ships raw envelopes to a custom
      // endpoint independently of any destination.
      queue.enqueue(envelope);
    }
  }

  return {
    clear: () => {
      // Revoke must drop identity too — otherwise a later grant would stamp the pre-revoke
      // userId onto new events without a fresh identify().
      userId = undefined;
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
      if (options.isAnalyticsAllowed?.() !== false) {
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
      // Catalog keys are strings; zod-inferred props are opaque to the open envelope record.
      enqueue({ name: String(name), props: props as Record<string, unknown>, type: "track" });
    },
  };
}
