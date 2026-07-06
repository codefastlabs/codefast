import { describe, expect, it } from "vitest";
import { z } from "zod";

import { defineEventCatalog } from "#/core/event-catalog";

describe("defineEventCatalog", () => {
  it("returns the catalog unchanged — it exists purely for inference", () => {
    const catalog = defineEventCatalog({
      button_clicked: { owner: "client", schema: z.object({ id: z.string() }) },
      order_completed: { owner: "server", schema: z.object({ orderId: z.string() }) },
    });

    expect(catalog.button_clicked.owner).toBe("client");
    expect(catalog.order_completed.owner).toBe("server");
  });
});
