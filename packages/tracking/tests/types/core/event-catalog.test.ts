import { expectTypeOf } from "expect-type";
import { describe, it } from "vitest";
import type { z } from "zod";

import type { EventsOf } from "#/core/event-catalog";

describe("EventsOf", () => {
  it("keeps only the keys owned by the requested side", () => {
    type Catalog = {
      button_clicked: { owner: "client"; schema: z.ZodObject<{ id: z.ZodString }> };
      order_completed: { owner: "server"; schema: z.ZodObject<{ orderId: z.ZodString }> };
      page_viewed: { owner: "client"; schema: z.ZodObject<{ path: z.ZodString }> };
    };

    expectTypeOf<keyof EventsOf<Catalog, "client">>().toEqualTypeOf<"button_clicked" | "page_viewed">();
    expectTypeOf<keyof EventsOf<Catalog, "server">>().toEqualTypeOf<"order_completed">();
  });
});
