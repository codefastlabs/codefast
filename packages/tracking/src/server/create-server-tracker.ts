import type { z } from "zod";

import type { Destination } from "#/core/destination";
import type { EventCatalog, EventsOf } from "#/core/event-catalog";
import { deriveEventId, generateEventId } from "#/core/event-id";
import type { TrackedEvent, TrackedEventSeed } from "#/core/tracked-event";
import { buildTrackedEvent } from "#/core/tracked-event";

/**
 * @since 0.5.0-canary.4
 */
export interface ServerTrackContext {
  anonymousId: string;
  /**
   * A stable identifier for the inbound request, unchanged across retries — when set,
   * `eventId` is derived from it via {@link deriveEventId} instead of drawn at random, so
   * a retried request re-sends the same `eventId` and a destination that dedupes on it
   * treats the retry as a no-op. Omit to always mint a fresh, random `eventId`.
   */
  requestId?: string | undefined;
  userId?: string | undefined;
}

/**
 * @since 0.5.0-canary.4
 */
export interface ServerTrackerOptions<Catalog extends EventCatalog> {
  catalog: Catalog;
  destinations: Array<Destination>;
  generateEventId?: (() => string) | undefined;
  maxRetries?: number | undefined;
  onDestinationError?: ((error: unknown, destination: Destination, event: TrackedEvent) => void) | undefined;
  retryDelayMs?: number | undefined;
}

/**
 * @since 0.5.0-canary.4
 */
export interface ServerTracker<Catalog extends EventCatalog> {
  /** Explicit anonymous → known-user merge, for when `identify` timing can't do it. */
  alias: (previousId: string, userId: string, context: ServerTrackContext) => Promise<void>;
  group: (groupId: string, traits: Record<string, unknown> | undefined, context: ServerTrackContext) => Promise<void>;
  track: <Name extends keyof EventsOf<Catalog, "server">>(
    name: Name,
    props: z.infer<EventsOf<Catalog, "server">[Name]["schema"]>,
    context: ServerTrackContext,
  ) => Promise<void>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function sendWithRetry(
  destination: Destination,
  event: TrackedEvent,
  maxRetries: number,
  retryDelayMs: number,
  onError: (error: unknown, destination: Destination, event: TrackedEvent) => void,
): Promise<void> {
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      await destination.send(event);

      return;
    } catch (error) {
      if (attempt === maxRetries) {
        onError(error, destination, event);

        return;
      }

      await sleep(retryDelayMs * 2 ** attempt);
    }
  }
}

/**
 * No dead-letter queue yet (self-host storage is Phase 2) — a destination that keeps
 * failing after retries is only logged via `onDestinationError`, never re-queued.
 *
 * @since 0.5.0-canary.4
 */
export function createServerTracker<Catalog extends EventCatalog>(
  options: ServerTrackerOptions<Catalog>,
): ServerTracker<Catalog> {
  const maxRetries = options.maxRetries ?? 2;
  const retryDelayMs = options.retryDelayMs ?? 200;
  const createId = options.generateEventId ?? generateEventId;
  const onError =
    options.onDestinationError ??
    ((error: unknown, destination: Destination, event: TrackedEvent): void => {
      const label = event.type === "track" ? event.name : event.type;

      console.error(`[tracking] destination "${destination.name}" failed for event "${label}"`, error);
    });

  async function sendEvent(seed: TrackedEventSeed, context: ServerTrackContext): Promise<void> {
    // Deriving from the seed plus userId (not just requestId) keeps distinct event kinds —
    // and distinct merge targets, e.g. two `alias` calls for the same previousId — in the
    // same request from colliding, while an identical call on retry reproduces the same id.
    const discriminant = context.userId === undefined ? seed : { ...seed, userId: context.userId };
    const eventId =
      context.requestId === undefined ? createId() : deriveEventId(context.requestId, JSON.stringify(discriminant));

    const event = buildTrackedEvent(seed, {
      anonymousId: context.anonymousId,
      eventId,
      owner: "server",
      timestamp: Date.now(),
      ...(context.userId === undefined ? {} : { userId: context.userId }),
    });

    await Promise.all(
      options.destinations.map(async (destination) =>
        sendWithRetry(destination, event, maxRetries, retryDelayMs, onError),
      ),
    );
  }

  return {
    async alias(previousId, userId, context) {
      // The alias's userId is the merge target — it wins over whatever the context carries.
      await sendEvent({ previousId, type: "alias" }, { ...context, userId });
    },
    async group(groupId, traits, context) {
      await sendEvent({ groupId, traits: traits ?? {}, type: "group" }, context);
    },
    async track(name, props, context) {
      // noUncheckedIndexedAccess types this as possibly undefined; the owner check also
      // guards callers who bypass the EventsOf filter with an `as` cast.
      const definition = options.catalog[name];

      if (!definition || definition.owner !== "server") {
        throw new Error(`Unknown server-owned event: ${String(name)}`);
      }

      definition.schema.parse(props);
      // Catalog keys are strings; zod-inferred props are opaque to the open envelope record.
      await sendEvent({ name: String(name), props: props as Record<string, unknown>, type: "track" }, context);
    },
  };
}
