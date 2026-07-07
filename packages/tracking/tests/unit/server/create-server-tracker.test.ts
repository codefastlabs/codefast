import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { defineEventCatalog } from "#/core/event-catalog";
import { createServerTracker } from "#/server/create-server-tracker";
import { createFailingDestination } from "#/tests/unit/server/support/fakes";

const catalog = defineEventCatalog({
  button_clicked: { owner: "client", schema: z.object({ id: z.string() }) },
  order_completed: { owner: "server", schema: z.object({ orderId: z.string() }) },
});

describe("createServerTracker", () => {
  it("sends a valid server-owned event, stamping identity from context", async () => {
    const destination = createFailingDestination("posthog", 0);
    const tracker = createServerTracker({ catalog, destinations: [destination] });

    await tracker.track("order_completed", { orderId: "o1" }, { anonymousId: "anon-1", userId: "user-1" });

    expect(destination.received).toHaveLength(1);
    expect(destination.received[0]).toMatchObject({ anonymousId: "anon-1", owner: "server", userId: "user-1" });
  });

  it("rejects a client-owned event at runtime", async () => {
    const destination = createFailingDestination("posthog", 0);
    const tracker = createServerTracker({ catalog, destinations: [destination] });

    await expect(
      tracker.track("button_clicked" as never, { id: "cta" } as never, { anonymousId: "anon-1" }),
    ).rejects.toThrow(/Unknown server-owned event/);
  });

  it("sends a $group event carrying the groupId and traits", async () => {
    const destination = createFailingDestination("posthog", 0);
    const tracker = createServerTracker({ catalog, destinations: [destination] });

    await tracker.group("acme", { plan: "enterprise" }, { anonymousId: "anon-1", userId: "user-1" });

    expect(destination.received).toMatchObject([
      { name: "$group", owner: "server", props: { groupId: "acme", plan: "enterprise" } },
    ]);
  });

  it("sends a $alias event merging the previous anonymous id into the user id", async () => {
    const destination = createFailingDestination("posthog", 0);
    const tracker = createServerTracker({ catalog, destinations: [destination] });

    await tracker.alias("anon-1", "user-1", { anonymousId: "anon-1" });

    expect(destination.received).toMatchObject([
      { name: "$alias", owner: "server", props: { previousId: "anon-1", userId: "user-1" } },
    ]);
  });

  it("retries a failing destination up to maxRetries before giving up", async () => {
    const destination = createFailingDestination("flaky", 2);
    const onDestinationError = vi.fn();
    const tracker = createServerTracker({
      catalog,
      destinations: [destination],
      maxRetries: 2,
      onDestinationError,
      retryDelayMs: 1,
    });

    await tracker.track("order_completed", { orderId: "o1" }, { anonymousId: "anon-1" });

    expect(destination.received).toHaveLength(3);
    expect(onDestinationError).not.toHaveBeenCalled();
  });

  it("reports through onDestinationError once retries are exhausted", async () => {
    const destination = createFailingDestination("always-down", 99);
    const onDestinationError = vi.fn();
    const tracker = createServerTracker({
      catalog,
      destinations: [destination],
      maxRetries: 1,
      onDestinationError,
      retryDelayMs: 1,
    });

    await tracker.track("order_completed", { orderId: "o1" }, { anonymousId: "anon-1" });

    expect(onDestinationError).toHaveBeenCalledTimes(1);
  });
});
