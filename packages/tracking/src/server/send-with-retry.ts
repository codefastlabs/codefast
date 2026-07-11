import type { Destination } from "#/core/destination";
import type { TrackedEvent } from "#/core/tracked-event";

export type DestinationErrorHandler = (error: unknown, destination: Destination, event: TrackedEvent) => void;

/** The `onDestinationError` fallback shared by the server tracker and the relay lane. */
export function logDestinationError(error: unknown, destination: Destination, event: TrackedEvent): void {
  const label = event.type === "track" ? event.name : event.type;

  console.error(`[tracking] destination "${destination.name}" failed for event "${label}"`, error);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Delivers one event to one destination with exponential backoff. Exhausted retries only
 * report through `onError` — server delivery must never throw into the request path.
 */
export async function sendWithRetry(
  destination: Destination,
  event: TrackedEvent,
  maxRetries: number,
  retryDelayMs: number,
  onError: DestinationErrorHandler,
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

/** Same ladder for a batch — all-or-nothing per attempt, exhausted retries report every event. */
async function sendBatchWithRetry(
  destination: Destination,
  sendBatch: NonNullable<Destination["sendBatch"]>,
  events: Array<TrackedEvent>,
  maxRetries: number,
  retryDelayMs: number,
  onError: DestinationErrorHandler,
): Promise<void> {
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      await sendBatch.call(destination, events);

      return;
    } catch (error) {
      if (attempt === maxRetries) {
        for (const event of events) {
          onError(error, destination, event);
        }

        return;
      }

      await sleep(retryDelayMs * 2 ** attempt);
    }
  }
}

export interface DeliveryOptions {
  maxRetries: number;
  onError: DestinationErrorHandler;
  retryDelayMs: number;
  /**
   * Hands delivery (including its retry ladder) to the platform's post-response
   * scheduler; omit to await delivery in the request path.
   */
  waitUntil?: ((work: Promise<void>) => void) | undefined;
}

/**
 * The one server-side delivery lane, shared by the tracker and the relay: fans out per
 * destination, prefers `sendBatch` for multi-event batches, retries with backoff, and
 * either defers the whole thing via `waitUntil` or awaits it.
 */
export async function deliverToDestinations(
  destinations: Array<Destination>,
  events: Array<TrackedEvent>,
  options: DeliveryOptions,
): Promise<void> {
  const { maxRetries, onError, retryDelayMs, waitUntil } = options;

  const delivery = Promise.all(
    destinations.map(async (destination) => {
      if (events.length > 1 && destination.sendBatch) {
        await sendBatchWithRetry(destination, destination.sendBatch, events, maxRetries, retryDelayMs, onError);

        return;
      }

      await Promise.all(
        events.map(async (event) => sendWithRetry(destination, event, maxRetries, retryDelayMs, onError)),
      );
    }),
  ).then(() => {
    /* collapse to void for waitUntil schedulers typed on Promise<void> */
  });

  if (waitUntil) {
    waitUntil(delivery);

    return;
  }

  await delivery;
}
