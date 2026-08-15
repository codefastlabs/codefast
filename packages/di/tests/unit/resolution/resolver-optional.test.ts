/**
 * `resolveOptional` resolves the binding its existence probe found: one lookup, one predicate
 * evaluation — a predicate whose answer changes between two evaluations must not turn the
 * promised `undefined`/value into a throw.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { token } from "#/core/token";

describe("resolveOptional single evaluation", () => {
  it("evaluates a when() predicate once per optional resolve", () => {
    const serviceToken = token<string>("optional.count");
    let evaluations = 0;
    const container = Container.create();
    container
      .bind(serviceToken)
      .toConstantValue("x")
      .when(() => {
        evaluations += 1;
        return true;
      });

    expect(container.resolveOptional(serviceToken)).toBe("x");
    expect(evaluations).toBe(1);
  });

  it("returns the probed value even when the predicate would answer differently next time", () => {
    const serviceToken = token<string>("optional.flip");
    let allow = false;
    const container = Container.create();
    container
      .bind(serviceToken)
      .toConstantValue("x")
      .when(() => {
        allow = !allow;
        return allow;
      });

    // Probe evaluates once (true) — the resolve must not re-ask and see false.
    expect(container.resolveOptional(serviceToken)).toBe("x");
  });

  it("evaluates a when() predicate once on the async lane too", async () => {
    const serviceToken = token<string>("optional.async-count");
    let evaluations = 0;
    const container = Container.create();
    container
      .bind(serviceToken)
      .toConstantValue("x")
      .when(() => {
        evaluations += 1;
        return true;
      });

    await expect(container.resolveOptionalAsync(serviceToken)).resolves.toBe("x");
    expect(evaluations).toBe(1);
  });
});
