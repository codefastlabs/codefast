import { afterEach, describe, expect, it, vi } from "vitest";

import { createLocalStorageQueueStorage } from "#/client/local-storage";
import type { TrackedEvent } from "#/core/tracked-event";

const event: TrackedEvent = {
  anonymousId: "anon-1",
  eventId: "e1",
  name: "button_clicked",
  owner: "client",
  props: {},
  timestamp: 0,
  type: "track",
};

describe("createLocalStorageQueueStorage", () => {
  it("round-trips queued events", () => {
    const storage = createLocalStorageQueueStorage("tracking-queue");

    storage.save([event]);
    expect(storage.load()).toEqual([event]);
  });

  it("treats missing, corrupt, or non-array state as an empty queue", () => {
    const storage = createLocalStorageQueueStorage("tracking-queue-corrupt");

    expect(storage.load()).toEqual([]);

    localStorage.setItem("tracking-queue-corrupt", "{not json");
    expect(storage.load()).toEqual([]);

    localStorage.setItem("tracking-queue-corrupt", JSON.stringify({ not: "an array" }));
    expect(storage.load()).toEqual([]);
  });

  it("drops pre-migration/malformed records, keeping only valid envelopes", () => {
    const storage = createLocalStorageQueueStorage("tracking-queue-malformed");

    localStorage.setItem(
      "tracking-queue-malformed",
      JSON.stringify([
        event,
        { name: "button_clicked", props: {} }, // pre-migration shape, no `type`
        // type presents but missing kind-specific fields
        { anonymousId: "anon-1", eventId: "e2", timestamp: 0, type: "track" },
        null,
        "not an object",
      ]),
    );
    expect(storage.load()).toEqual([event]);
  });

  describe("without a window (SSR)", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("never throws, treating every call as a no-op with an empty queue", () => {
      vi.stubGlobal("window", undefined);

      const storage = createLocalStorageQueueStorage("tracking-queue-ssr");

      expect(() => {
        storage.save([event]);
      }).not.toThrow();
      expect(storage.load()).toEqual([]);
    });
  });
});
