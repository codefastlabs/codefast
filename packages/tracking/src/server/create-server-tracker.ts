import type { StandardSchemaV1 } from "@standard-schema/spec";

import type { Destination } from "#/core/destination";
import type { EventCatalog, EventsOf } from "#/core/event-catalog";
import { assertValidEventProperties } from "#/core/event-catalog";
import { deriveEventId, generateEventId } from "#/core/event-id";
import type { TrackedEventSeed } from "#/core/tracked-event";
import { buildTrackedEvent } from "#/core/tracked-event";
import type { DestinationErrorHandler } from "#/server/send-with-retry";
import { deliverToDestinations, logDestinationError } from "#/server/send-with-retry";

/**
 * Per-request identity for server-owned events — resolved once from the request (cookies,
 * session) and either passed per call or bound via `withContext`.
 *
 * @since 0.5.0-canary.4
 */
export interface ServerTrackerContext {
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
  onDestinationError?: DestinationErrorHandler | undefined;
  retryDelayMs?: number | undefined;
  /**
   * Hands destination delivery (including its retry ladder) to the platform's
   * post-response scheduler — Cloudflare's `ctx.waitUntil`, Vercel's `waitUntil`, srvx's
   * `request.waitUntil`. With it set, `track`/`group`/`alias` resolve as soon as the event
   * is validated and built instead of after the slowest destination; failures still
   * surface through `onDestinationError`.
   */
  waitUntil?: ((work: Promise<void>) => void) | undefined;
}

/**
 * A tracker with the per-request context already applied — what `withContext` returns, so
 * request handlers call `track(name, properties)` like client code does.
 *
 * @since 0.5.0-canary.4
 */
export interface BoundServerTracker<Catalog extends EventCatalog> {
  /** Explicit anonymous → known-user merge, for when `identify` timing can't do it. */
  alias: (previousId: string, userId: string) => Promise<void>;
  group: (groupId: string, traits?: Record<string, unknown>) => Promise<void>;
  track: <Name extends keyof EventsOf<Catalog, "server">>(
    name: Name,
    properties: StandardSchemaV1.InferOutput<EventsOf<Catalog, "server">[Name]["schema"]>,
  ) => Promise<void>;
}

/**
 * @since 0.5.0-canary.4
 */
export interface ServerTracker<Catalog extends EventCatalog> {
  /** Explicit anonymous → known-user merge, for when `identify` timing can't do it. */
  alias: (previousId: string, userId: string, context: ServerTrackerContext) => Promise<void>;
  // Context is mandatory identity so it reads well right after groupId, and traits stays optional.
  group: (groupId: string, context: ServerTrackerContext, traits?: Record<string, unknown>) => Promise<void>;
  track: <Name extends keyof EventsOf<Catalog, "server">>(
    name: Name,
    properties: StandardSchemaV1.InferOutput<EventsOf<Catalog, "server">[Name]["schema"]>,
    context: ServerTrackerContext,
  ) => Promise<void>;
  /** The same tracker with `context` applied once — for request-scoped use (middleware, handlers). */
  withContext: (context: ServerTrackerContext) => BoundServerTracker<Catalog>;
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
  const onError = options.onDestinationError ?? logDestinationError;

  async function sendEvent(seed: TrackedEventSeed, context: ServerTrackerContext): Promise<void> {
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

    await deliverToDestinations(options.destinations, [event], {
      maxRetries,
      onError,
      retryDelayMs,
      waitUntil: options.waitUntil,
    });
  }

  const tracker: ServerTracker<Catalog> = {
    async alias(previousId, userId, context) {
      // The alias's userId is the merge target — it wins over whatever the context carries.
      await sendEvent({ previousId, type: "alias" }, { ...context, userId });
    },
    async group(groupId, context, traits) {
      await sendEvent({ groupId, traits: traits ?? {}, type: "group" }, context);
    },
    async track(name, properties, context) {
      // noUncheckedIndexedAccess types this as possibly undefined; the owner check also
      // guards callers who bypass the EventsOf filter with an `as` cast.
      const definition = options.catalog[name];

      if (!definition || definition.owner !== "server") {
        throw new Error(`Unknown server-owned event: ${String(name)}`);
      }

      assertValidEventProperties(definition.schema, String(name), properties);
      // Catalog keys are strings; schema-inferred properties are opaque to the open envelope record.
      await sendEvent(
        { name: String(name), properties: properties as Record<string, unknown>, type: "track" },
        context,
      );
    },
    withContext(context) {
      return {
        alias: (previousId, userId) => tracker.alias(previousId, userId, context),
        group: (groupId, traits) => tracker.group(groupId, context, traits),
        track: (name, properties) => tracker.track(name, properties, context),
      };
    },
  };

  return tracker;
}
