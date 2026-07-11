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
