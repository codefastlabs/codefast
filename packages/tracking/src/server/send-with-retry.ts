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
