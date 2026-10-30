import { describe, expect, test } from "vitest";

import { cn } from "#app/lib/utils";

describe("cn", () => {
  test("keeps a font-size token beside a text color", () => {
    expect(cn("text-bh-caption text-zinc-400")).toBe("text-bh-caption text-zinc-400");
    expect(cn("text-bh-small", "text-bh-label-muted")).toBe("text-bh-small text-bh-label-muted");
  });

  test("lets a later font-size token override an earlier one", () => {
    expect(cn("text-bh-caption", "text-bh-small")).toBe("text-bh-small");
  });
});
