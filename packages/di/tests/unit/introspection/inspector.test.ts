/**
 * Inspector contract: `has`/`hasOwn` answer with a boolean even when resolution would be
 * ambiguous, and snapshots never alias live registry state.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { tag } from "#/core/tag";
import { token } from "#/core/token";

describe("has and hasOwn as existence probes", () => {
  it("answers true when several bindings match instead of throwing AmbiguousBindingError", () => {
    const serviceToken = token<string>("inspector.ambiguous");
    const container = Container.create();
    container
      .bind(serviceToken)
      .toDynamic(() => "first")
      .when(() => true);
    container
      .bind(serviceToken)
      .toDynamic(() => "second")
      .when(() => true);

    expect(container.has(serviceToken, {})).toBe(true);
    expect(container.hasOwn(serviceToken, {})).toBe(true);
  });

  it("still answers false when nothing matches the options", () => {
    const serviceToken = token<string>("inspector.no-match");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue("x");

    expect(container.has(serviceToken, { name: "missing" })).toBe(false);
    expect(container.hasOwn(serviceToken, { name: "missing" })).toBe(false);
  });
});

describe("binding snapshots", () => {
  it("hands out a frozen tag list, so mutating it throws instead of corrupting the registry", () => {
    const serviceToken = token<string>("inspector.snapshot");
    const regionTag = tag<string>("region");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue("eu-value").whenTagged(regionTag.of("eu"));

    const [snapshot] = container.lookupBindings(serviceToken);
    expect(() => {
      (snapshot!.slot.tags as Array<unknown>).length = 0;
    }).toThrow(TypeError);

    expect(container.resolve(serviceToken, { tags: [regionTag.of("eu")] })).toBe("eu-value");
    const [fresh] = container.lookupBindings(serviceToken);
    expect(fresh!.slot.tags).toHaveLength(1);
  });
});
