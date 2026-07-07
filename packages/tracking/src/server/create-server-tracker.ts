import type { z } from "zod";

import type { Destination } from "#/core/destination";
import type { EventCatalog, EventsOf } from "#/core/event-catalog";
import { generateEventId } from "#/core/event-id";
import type { TrackedEvent } from "#/core/tracked-event";

export interface ServerTrackContext {
  anonymousId: string;
  userId?: string | undefined;
}

export interface ServerTrackerOptions<Catalog extends EventCatalog> {
  catalog: Catalog;
  destinations: Array<Destination>;
  generateEventId?: () => string;
  maxRetries?: number;
  onDestinationError?: (error: unknown, destination: Destination, event: TrackedEvent) => void;
  retryDelayMs?: number;
}

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
      console.error(`[tracking] destination "${destination.name}" failed for event "${event.name}"`, error);
    });

  async function sendEvent(name: string, props: Record<string, unknown>, context: ServerTrackContext): Promise<void> {
    const event: TrackedEvent = {
      anonymousId: context.anonymousId,
      eventId: createId(),
      name,
      owner: "server",
      props,
      timestamp: Date.now(),
      ...(context.userId === undefined ? {} : { userId: context.userId }),
    };

    await Promise.all(
      options.destinations.map(async (destination) =>
        sendWithRetry(destination, event, maxRetries, retryDelayMs, onError),
      ),
    );
  }

  return {
    async alias(previousId, userId, context) {
      await sendEvent("$alias", { previousId, userId }, context);
    },
    async group(groupId, traits, context) {
      await sendEvent("$group", { groupId, ...traits }, context);
    },
    async track(name, props, context) {
      // noUncheckedIndexedAccess types this as possibly undefined; the owner check also
      // guards callers who bypass the EventsOf filter with an `as` cast.
      const definition = options.catalog[name];

      if (!definition || definition.owner !== "server") {
        throw new Error(`Unknown server-owned event: ${String(name)}`);
      }

      definition.schema.parse(props);
      await sendEvent(name as string, props as Record<string, unknown>, context);
    },
  };
}
