import type { Destination } from "#/core/destination";
import type { TrackedEvent } from "#/core/tracked-event";

export function createFailingDestination(
  name: string,
  failuresBeforeSuccess: number,
): Destination & { received: Array<TrackedEvent> } {
  return {
    name,
    received: [],
    async send(event) {
      if (this.received.length < failuresBeforeSuccess) {
        this.received.push(event);

        throw new Error(`${name} failed`);
      }

      this.received.push(event);
    },
  };
}
