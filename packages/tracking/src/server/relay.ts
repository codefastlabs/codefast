import type { Destination } from "#/core/destination";
import type { EventCatalog } from "#/core/event-catalog";
import { assertValidEventProps } from "#/core/event-catalog";
import type { TrackedEvent } from "#/core/tracked-event";
import { isTrackedEvent } from "#/core/tracked-event";
import type { DestinationErrorHandler } from "#/server/send-with-retry";
import { logDestinationError, sendWithRetry } from "#/server/send-with-retry";

/**
 * Server-read identity applied to relayed envelopes — what the request actually proves
 * (cookie, session) wins over whatever the client claimed in the payload.
 */
export interface RelayContext {
  anonymousId?: string | undefined;
  userId?: string | undefined;
}

export interface RelayTrackedEventsOptions<Catalog extends EventCatalog> {
  catalog: Catalog;
  /** Omit to trust the envelope identity as-is (e.g. behind an authenticated first-party route). */
  context?: RelayContext | undefined;
  destinations: Array<Destination>;
  /** Per-event consent/abuse gate — e.g. built on `readConsentDecisionCookie`. Omit to accept all. */
  isAllowed?: ((event: TrackedEvent) => boolean) | undefined;
  /** Envelopes past this cap are rejected, not truncated silently. */
  maxBatchSize?: number | undefined;
  maxRetries?: number | undefined;
  onDestinationError?: DestinationErrorHandler | undefined;
  retryDelayMs?: number | undefined;
  /** Same contract as `ServerTrackerOptions.waitUntil` — defer delivery past the response. */
  waitUntil?: ((work: Promise<void>) => void) | undefined;
}

export interface RelayResult {
  accepted: number;
  rejected: number;
}

/**
 * The receive half of the client's beacon/queue lane: validates a batch of client-owned
 * envelopes (shape, catalog membership, schema), re-stamps identity from what the server
 * read off the request, and fans out to destinations with the server retry ladder.
 * Relayed envelopes keep their client-minted `eventId`, so a re-sent beacon dedupes
 * downstream instead of double-counting.
 */
export async function relayTrackedEvents<Catalog extends EventCatalog>(
  payload: unknown,
  options: RelayTrackedEventsOptions<Catalog>,
): Promise<RelayResult> {
  const maxBatchSize = options.maxBatchSize ?? 100;
  const maxRetries = options.maxRetries ?? 2;
  const retryDelayMs = options.retryDelayMs ?? 200;
  const onError = options.onDestinationError ?? logDestinationError;

  if (!Array.isArray(payload)) {
    return { accepted: 0, rejected: 0 };
  }

  const batch = payload.slice(0, maxBatchSize);
  const overflow = payload.length - batch.length;
  const accepted: Array<TrackedEvent> = [];
  let rejected = overflow;

  for (const candidate of batch) {
    const event = validateRelayedEvent(candidate, options);

    if (event === undefined) {
      rejected += 1;
      continue;
    }

    accepted.push(event);
  }

  const delivery = Promise.all(
    accepted.flatMap((event) =>
      options.destinations.map(async (destination) =>
        sendWithRetry(destination, event, maxRetries, retryDelayMs, onError),
      ),
    ),
  ).then(() => {
    /* collapse to void for waitUntil schedulers typed on Promise<void> */
  });

  if (options.waitUntil) {
    options.waitUntil(delivery);
  } else {
    await delivery;
  }

  return { accepted: accepted.length, rejected };
}

/** Shape → owner → catalog/schema → gate; identity re-stamp happens on the accepted copy. */
function validateRelayedEvent<Catalog extends EventCatalog>(
  candidate: unknown,
  options: RelayTrackedEventsOptions<Catalog>,
): TrackedEvent | undefined {
  if (!isTrackedEvent(candidate) || candidate.owner !== "client") {
    return undefined;
  }

  if (candidate.type === "track") {
    const definition = options.catalog[candidate.name];

    if (!definition || definition.owner !== "client") {
      return undefined;
    }

    try {
      assertValidEventProps(definition.schema, candidate.name, candidate.properties);
    } catch {
      return undefined;
    }
  }

  const context = options.context;
  const event: TrackedEvent = {
    ...candidate,
    ...(context?.anonymousId === undefined ? {} : { anonymousId: context.anonymousId }),
    ...(context?.userId === undefined ? {} : { userId: context.userId }),
  };

  return options.isAllowed?.(event) === false ? undefined : event;
}

export interface TrackedEventIngestHandlerOptions<Catalog extends EventCatalog> extends Omit<
  RelayTrackedEventsOptions<Catalog>,
  "context"
> {
  /** Resolve server-read identity from the inbound request (cookies, session). */
  context?: ((request: Request) => RelayContext) | undefined;
  /** Requests past this cap answer 413 — `sendBeacon` bodies cap out around 64KB anyway. */
  maxBodyBytes?: number | undefined;
}

/**
 * `Request → Response` ingestion endpoint for `flushWithBeacon`/`attachClientLifecycle`'s
 * `beaconEndpoint` — framework-agnostic (fetch primitives only), so it drops into a
 * TanStack Start server route, a Nitro handler, or an edge function as-is.
 */
export function createTrackedEventIngestHandler<Catalog extends EventCatalog>(
  options: TrackedEventIngestHandlerOptions<Catalog>,
): (request: Request) => Promise<Response> {
  const maxBodyBytes = options.maxBodyBytes ?? 262_144;

  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") {
      return new Response(null, { headers: { allow: "POST" }, status: 405 });
    }

    const body = await request.text();

    if (body.length > maxBodyBytes) {
      return new Response(null, { status: 413 });
    }

    let payload: unknown;

    try {
      payload = JSON.parse(body);
    } catch {
      return new Response(null, { status: 400 });
    }

    if (!Array.isArray(payload)) {
      return new Response(null, { status: 400 });
    }

    const result = await relayTrackedEvents(payload, {
      ...options,
      context: options.context?.(request),
    });

    return Response.json(result);
  };
}
