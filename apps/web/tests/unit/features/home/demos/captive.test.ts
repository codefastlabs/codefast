import { describe, expect, it } from "vitest";

import { createCaptiveContainer, validationMessage } from "#/features/home/demos/captive";

describe("validationMessage", () => {
  it("reports the singleton OrderService holding the scoped RequestContext captive", () => {
    expect(validationMessage(createCaptiveContainer(false))).toMatch(
      /^Scope violation: 'shop:OrderService' \(singleton\) depends on 'shop:RequestContext' \(scoped\)/,
    );
  });

  it("is silent for the shop as shipped, with OrderService transient", () => {
    expect(validationMessage(createCaptiveContainer(true))).toBeNull();
  });
});
