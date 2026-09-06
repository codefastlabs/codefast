import { describe, expect, it } from "vitest";

import { createCaptiveContainer, validationMessage } from "#/features/home/demos/captive";

describe("validationMessage", () => {
  it("reports the singleton OrderService holding its first captive, the transient gateway", () => {
    expect(validationMessage(createCaptiveContainer(false))).toMatch(
      /^Scope violation: 'OrderService' \(singleton\) depends on 'PaymentGateway' \(transient\)/,
    );
  });

  it("is silent for the shop as shipped, with OrderService transient", () => {
    expect(validationMessage(createCaptiveContainer(true))).toBeNull();
  });
});
