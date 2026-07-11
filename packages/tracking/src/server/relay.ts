import type { Destination } from "#/core/destination";
import type { EventCatalog } from "#/core/event-catalog";
import { assertValidEventProperties } from "#/core/event-catalog";
import type { TrackedEvent } from "#/core/tracked-event";
import { isTrackedEvent } from "#/core/tracked-event";
import type { DestinationErrorHandler } from "#/server/send-with-retry";
import { deliverToDestinations, logDestinationError } from "#/server/send-with-retry";

/**
 * Server-read identity applied to relayed envelopes — what the request actually proves
 * (cookie, session) wins over whatever the client claimed in the payload. Providing a
 * context makes it authoritative for `userId`: an absent `userId` here DROPS any
 * client-claimed one (a forged identity must never ride through). `anonymousId` keeps
 * the envelope's own correlation key when the request carries none.
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

  await deliverToDestinations(options.destinations, accepted, {
    maxRetries,
    onError,
    retryDelayMs,
    waitUntil: options.waitUntil,
  });

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
      assertValidEventProperties(definition.schema, candidate.name, candidate.properties);
    } catch {
      return undefined;
    }
  }

  const context = options.context;
  // With a context, the request's identity is authoritative: userId is replaced outright
  // (undefined drops a client-forged claim); anonymousId keeps the envelope's correlation
  // key only when the request carries none.
  const event: TrackedEvent =
    context === undefined
      ? candidate
      : {
          ...candidate,
          userId: context.userId,
          ...(context.anonymousId === undefined ? {} : { anonymousId: context.anonymousId }),
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

    // Cap on real bytes — a string's length counts UTF-16 code units and undercounts
    // multibyte UTF-8 payloads by up to 3x.
    const body = await request.arrayBuffer();

    if (body.byteLength > maxBodyBytes) {
      return new Response(null, { status: 413 });
    }

    let payload: unknown;

    try {
      payload = JSON.parse(new TextDecoder().decode(body));
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
