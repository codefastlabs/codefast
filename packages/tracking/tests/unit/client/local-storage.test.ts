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
