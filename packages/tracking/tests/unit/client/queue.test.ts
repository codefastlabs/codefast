import { describe, expect, it, vi } from "vitest";

import { EventQueue } from "#/client/queue";
import type { TrackedEvent } from "#/core/tracked-event";
import {
  createFailingDestination,
  createMemoryQueueStorage,
  createRecordingDestination,
} from "#/tests/unit/client/support/fakes";

function buildEvent(name: string): TrackedEvent {
  return {
    anonymousId: "anon-1",
    eventId: name,
    name,
    owner: "client",
    properties: {},
    timestamp: 0,
    type: "track",
  };
}

describe("EventQueue", () => {
  it("persists on enqueue and delivers to every destination on flush", async () => {
    const storage = createMemoryQueueStorage();
    const destination = createRecordingDestination();
    const queue = new EventQueue({ destinations: [destination], storage });

    queue.enqueue(buildEvent("page_viewed"));
    expect(storage.load()).toHaveLength(1);

    await queue.flush();

    expect(destination.received.map((event) => event.eventId)).toEqual(["page_viewed"]);
    expect(queue.size).toBe(0);
    expect(storage.load()).toHaveLength(0);
  });

  it("drops the oldest events once the queue exceeds its cap", () => {
    const storage = createMemoryQueueStorage();
    const queue = new EventQueue({ destinations: [], maxQueueSize: 2, storage });

    queue.enqueue(buildEvent("a"));
    queue.enqueue(buildEvent("b"));
    queue.enqueue(buildEvent("c"));

    expect(storage.load().map((event) => event.eventId)).toEqual(["b", "c"]);
  });

  it("re-queues a failed event up to maxRetries, then drops it", async () => {
    const storage = createMemoryQueueStorage();
    const destination = createFailingDestination("flaky", 10);
    const queue = new EventQueue({ destinations: [destination], maxRetries: 2, storage });

    queue.enqueue(buildEvent("checkout_started"));

    await queue.flush();
    expect(queue.size).toBe(1);

    await queue.flush();
    expect(queue.size).toBe(1);

    await queue.flush();
    expect(queue.size).toBe(0);
    expect(destination.attempts).toBe(3);
  });

  it("flushes a partially filled queue on its own after flushDelayMs", async () => {
    vi.useFakeTimers();

    try {
      const destination = createRecordingDestination();
      const queue = new EventQueue({
        destinations: [destination],
        flushDelayMs: 1000,
        storage: createMemoryQueueStorage(),
      });

      queue.enqueue(buildEvent("below_batch_threshold"));
      expect(destination.received).toHaveLength(0);

      await vi.advanceTimersByTimeAsync(1000);

      expect(destination.received.map((event) => event.eventId)).toEqual(["below_batch_threshold"]);
      // Queue drained — no further timer stays armed.
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("never arms a timer with no destinations to deliver to", () => {
    vi.useFakeTimers();

    try {
      const queue = new EventQueue({ destinations: [], flushDelayMs: 1000, storage: createMemoryQueueStorage() });

      queue.enqueue(buildEvent("beacon_only"));

      expect(vi.getTimerCount()).toBe(0);
      expect(queue.size).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("skips flushing while offline without burning the retry budget", async () => {
    const destination = createRecordingDestination();
    const queue = new EventQueue({ destinations: [destination], storage: createMemoryQueueStorage() });

    queue.enqueue(buildEvent("offline_event"));
    Object.defineProperty(window.navigator, "onLine", { configurable: true, value: false });

    try {
      await queue.flush();

      expect(destination.received).toHaveLength(0);
      expect(queue.size).toBe(1);
    } finally {
      Object.defineProperty(window.navigator, "onLine", { configurable: true, value: true });
    }

    await queue.flush();
    expect(destination.received).toHaveLength(1);
  });

  it("forwards keepalive to every destination delivery", async () => {
    const sendOptions: Array<unknown> = [];
    const queue = new EventQueue({
      destinations: [
        {
          name: "capture-options",
          async send(_event, options) {
            sendOptions.push(options);
          },
        },
      ],
      storage: createMemoryQueueStorage(),
    });

    queue.enqueue(buildEvent("unload_event"));
    await queue.flush({ keepalive: true });

    expect(sendOptions).toEqual([{ keepalive: true }]);
  });

  it("prefers sendBatch and re-queues the whole batch when it throws", async () => {
    const batches: Array<number> = [];
    let shouldFail = true;
    const queue = new EventQueue({
      destinations: [
        {
          name: "batching",
          async send() {
            throw new Error("send must not be called when sendBatch exists");
          },
          async sendBatch(events) {
            if (shouldFail) {
              shouldFail = false;
              throw new Error("batch failed");
            }

            batches.push(events.length);
          },
        },
      ],
      storage: createMemoryQueueStorage(),
    });

    queue.enqueue(buildEvent("a"));
    queue.enqueue(buildEvent("b"));

    await queue.flush();
    expect(queue.size).toBe(2);

    await queue.flush();
    expect(batches).toEqual([2]);
    expect(queue.size).toBe(0);
  });
});
