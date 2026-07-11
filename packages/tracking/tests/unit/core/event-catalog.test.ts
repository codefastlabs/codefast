import type { StandardSchemaV1 } from "@standard-schema/spec";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import * as zm from "zod/mini";

import { assertValidEventProps, defineEventCatalog } from "#/core/event-catalog";

describe("defineEventCatalog", () => {
  it("returns the catalog unchanged — it exists purely for inference", () => {
    const catalog = defineEventCatalog({
      button_clicked: { owner: "client", schema: z.object({ id: z.string() }) },
      order_completed: { owner: "server", schema: z.object({ orderId: z.string() }) },
    });

    expect(catalog.button_clicked.owner).toBe("client");
    expect(catalog.order_completed.owner).toBe("server");
  });

  it("accepts any Standard Schema library, not just zod classic", () => {
    const catalog = defineEventCatalog({
      search_query: { owner: "client", schema: zm.object({ query: zm.string() }) },
    });

    expect(() => {
      assertValidEventProps(catalog.search_query.schema, "search_query", { query: "button" });
    }).not.toThrow();
  });
});

describe("assertValidEventProps", () => {
  const schema = z.object({ id: z.string() });

  it("passes valid props through untouched", () => {
    expect(() => {
      assertValidEventProps(schema, "button_clicked", { id: "cta" });
    }).not.toThrow();
  });

  it("throws with the schema issues on mismatch", () => {
    expect(() => {
      assertValidEventProps(schema, "button_clicked", { id: 42 });
    }).toThrow(/Invalid props for event "button_clicked"/);
  });

  it("rejects async schemas — tracking sits on synchronous call paths", () => {
    const asyncSchema: StandardSchemaV1 = {
      "~standard": {
        validate: () => Promise.resolve({ value: {} }),
        vendor: "test",
        version: 1,
      },
    };

    expect(() => {
      assertValidEventProps(asyncSchema, "button_clicked", {});
    }).toThrow(/async schema/);
  });
});
