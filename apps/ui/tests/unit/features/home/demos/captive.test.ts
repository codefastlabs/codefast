import { describe, expect, it } from "vitest";

import { createCaptiveContainer, validationMessage } from "#/features/home/demos/captive";

describe("validationMessage", () => {
  it("reports the captive dependency of a singleton over a scoped binding", () => {
    expect(validationMessage(createCaptiveContainer(false))).toMatch(/^Scope violation: /);
  });

  it("is silent once the cache is scoped alongside the session", () => {
    expect(validationMessage(createCaptiveContainer(true))).toBeNull();
  });
});
