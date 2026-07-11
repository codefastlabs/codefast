import type { Destination, DestinationSendOptions } from "#/core/destination";
import type { TrackedEvent } from "#/core/tracked-event";

/**
 * Persistence backend for the offline queue — a thin wrapper so tests and non-browser
 * environments can swap in an in-memory implementation instead of real `localStorage`.
 *
 * @since 0.5.0-canary.4
 */
export interface EventQueueStorage {
  load: () => Array<TrackedEvent>;
  save: (events: Array<TrackedEvent>) => void;
}

/**
 * @since 0.5.0-canary.4
 */
export interface EventQueueOptions {
  destinations: Array<Destination>;
  flushBatchSize?: number | undefined;
  /** Delay before a partially filled queue flushes on its own. */
  flushDelayMs?: number | undefined;
  maxQueueSize?: number | undefined;
  maxRetries?: number | undefined;
  storage: EventQueueStorage;
}

/**
 * @since 0.5.0-canary.4
 */
export interface FlushOptions {
  /** Forwarded to every destination delivery — set on unload-time flushes. */
  keepalive?: boolean | undefined;
}

interface QueuedEvent {
  attempts: number;
  event: TrackedEvent;
}

/**
 * Client-side batching/offline queue: persists across reloads, caps its size
 * (drop-oldest), retries a failed batch up to `maxRetries` times, and schedules its own
 * time-based flush — a one-shot timer armed only while events are actually pending, so an
 * idle page runs no timer at all.
 *
 * Package-private — owned by `createClientTracker`. Custom persistence uses
 * {@link EventQueueStorage} via `ClientTrackerOptions.storage`.
 *
 * @since 0.5.0-canary.4
 */
export class EventQueue {
  private readonly destinations: Array<Destination>;
  private readonly flushBatchSize: number;
  private readonly flushDelayMs: number;
  private flushTimerId: ReturnType<typeof setTimeout> | undefined;
  private readonly maxQueueSize: number;
  private readonly maxRetries: number;
  private pending: Array<QueuedEvent>;
  private readonly storage: EventQueueStorage;

  constructor(options: EventQueueOptions) {
    this.destinations = options.destinations;
    this.storage = options.storage;
    this.maxQueueSize = options.maxQueueSize ?? 500;
    this.maxRetries = options.maxRetries ?? 3;
    this.flushBatchSize = options.flushBatchSize ?? 20;
    this.flushDelayMs = options.flushDelayMs ?? 10_000;
    this.pending = this.storage.load().map((event) => ({ attempts: 0, event }));
    // A backlog restored from a previous session must still flush without new activity.
    this.armFlushTimer();
  }

  get size(): number {
    return this.pending.length;
  }

  /** Drops every pending event without sending it — used on consent revoke. */
  clear(): void {
    this.pending = [];
    this.disarmFlushTimer();
    this.persist();
  }

  /** Empties the queue synchronously for `navigator.sendBeacon`, which can't be awaited. */
  drain(): Array<TrackedEvent> {
    const events = this.pending.map((queued) => queued.event);

    this.pending = [];
    this.disarmFlushTimer();
    this.persist();

    return events;
  }

  enqueue(event: TrackedEvent): void {
    this.pending.push({ attempts: 0, event });

    if (this.pending.length > this.maxQueueSize) {
      this.pending = this.pending.slice(this.pending.length - this.maxQueueSize);
    }

    this.persist();

    if (this.pending.length >= this.flushBatchSize) {
      void this.flush();

      return;
    }

    this.armFlushTimer();
  }

  async flush(options?: FlushOptions): Promise<void> {
    if (this.pending.length === 0) {
      return;
    }

    // An offline flush is a guaranteed network error per event — it would only burn the
    // retry budget. Fail open when `onLine` is unavailable (non-browser test environments).
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return;
    }

    const batch = this.pending;

    this.pending = [];
    this.disarmFlushTimer();

    const sendOptions: DestinationSendOptions = { keepalive: options?.keepalive };
    const failedIndexes = new Set<number>();

    await Promise.all(
      this.destinations.map(async (destination) => {
        if (destination.sendBatch) {
          try {
            await destination.sendBatch(
              batch.map((queued) => queued.event),
              sendOptions,
            );
          } catch {
            // All-or-nothing transport: the whole batch failed for this destination.
            for (const index of batch.keys()) {
              failedIndexes.add(index);
            }
          }

          return;
        }

        await Promise.all(
          batch.map(async (queued, index) => {
            try {
              await destination.send(queued.event, sendOptions);
            } catch {
              failedIndexes.add(index);
            }
          }),
        );
      }),
    );

    // Iterate the batch (not the set) so re-queued events keep their original order.
    for (const [index, queued] of batch.entries()) {
      if (failedIndexes.has(index) && queued.attempts < this.maxRetries) {
        this.pending.push({ attempts: queued.attempts + 1, event: queued.event });
      }
    }

    this.persist();
    this.armFlushTimer();
  }

  /** One-shot, armed only when there is something to deliver and somewhere to deliver it. */
  private armFlushTimer(): void {
    if (this.flushTimerId !== undefined || this.pending.length === 0 || this.destinations.length === 0) {
      return;
    }

    this.flushTimerId = setTimeout(() => {
      this.flushTimerId = undefined;
      void this.flush();
    }, this.flushDelayMs);
  }

  private disarmFlushTimer(): void {
    if (this.flushTimerId !== undefined) {
      clearTimeout(this.flushTimerId);
      this.flushTimerId = undefined;
    }
  }

  private persist(): void {
    this.storage.save(this.pending.map((queued) => queued.event));
  }
}
