import type { EventQueueStorage } from "#/client/queue";
import type { Destination } from "#/core/destination";
import type { TrackedEvent } from "#/core/tracked-event";

export function createRecordingDestination(name = "fake"): Destination & { received: Array<TrackedEvent> } {
  const received: Array<TrackedEvent> = [];

  return {
    name,
    received,
    async send(event) {
      received.push(event);
    },
  };
}

export function createFailingDestination(
  name: string,
  failuresBeforeSuccess: number,
): Destination & { attempts: number } {
  return {
    attempts: 0,
    name,
    async send() {
      this.attempts += 1;

      if (this.attempts <= failuresBeforeSuccess) {
        throw new Error(`${name} failed on attempt ${String(this.attempts)}`);
      }
    },
  };
}

export function createMemoryQueueStorage(): EventQueueStorage {
  let events: Array<TrackedEvent> = [];

  return {
    load: () => events,
    save(next) {
      events = next;
    },
  };
}
