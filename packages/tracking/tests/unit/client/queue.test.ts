import { describe, expect, it } from "vitest";

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
});
