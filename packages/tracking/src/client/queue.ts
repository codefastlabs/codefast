import type { Destination } from "#/core/destination";
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
  maxQueueSize?: number | undefined;
  maxRetries?: number | undefined;
  storage: EventQueueStorage;
}

interface QueuedEvent {
  attempts: number;
  event: TrackedEvent;
}

/**
 * Client-side batching/offline queue: persists across reloads, caps its size
 * (drop-oldest), and retries a failed batch up to `maxRetries` times.
 *
 * @since 0.5.0-canary.4
 */
export class EventQueue {
  private readonly destinations: Array<Destination>;
  private readonly flushBatchSize: number;
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
    this.pending = this.storage.load().map((event) => ({ attempts: 0, event }));
  }

  get size(): number {
    return this.pending.length;
  }

  /** Drops every pending event without sending it — used on consent revoke. */
  clear(): void {
    this.pending = [];
    this.persist();
  }

  /** Empties the queue synchronously for `navigator.sendBeacon`, which can't be awaited. */
  drain(): Array<TrackedEvent> {
    const events = this.pending.map((queued) => queued.event);

    this.pending = [];
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
    }
  }

  async flush(): Promise<void> {
    if (this.pending.length === 0) {
      return;
    }

    const batch = this.pending;

    this.pending = [];

    const results = await Promise.allSettled(
      batch.map(async (queued) => {
        await Promise.all(this.destinations.map(async (destination) => destination.send(queued.event)));
      }),
    );

    for (const [index, result] of results.entries()) {
      const queued = batch[index];

      if (result.status === "rejected" && queued && queued.attempts < this.maxRetries) {
        this.pending.push({ attempts: queued.attempts + 1, event: queued.event });
      }
    }

    this.persist();
  }

  private persist(): void {
    this.storage.save(this.pending.map((queued) => queued.event));
  }
}
