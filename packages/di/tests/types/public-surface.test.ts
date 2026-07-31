/**
 * The exported surface has to be usable from outside, which is a stronger claim than "it compiles".
 *
 * A function is only public in a useful sense if a consumer can obtain a value to pass it, using
 * nothing but the package's own exports. `effectiveBindingScope` failed that test for several
 * releases: it reads a `Binding`, which `package.json#exports` deliberately withholds, and no public
 * API returns one — so it was exported and uncallable. These assertions import through the package
 * specifier, exactly as a consumer does, so a repeat shows up here rather than in an issue.
 */
import { bindingSlotToResolveOptions, Container, injectionSlotToResolveOptions, token } from "@codefast/di";
import type { BindingScope, BindingSnapshot, ResolveOptions } from "@codefast/di";
import { expectTypeOf } from "expect-type";
import { describe, expect, it } from "vitest";

describe("every exported function is callable with public values", () => {
  const serviceToken = token<number>("public-surface");

  function snapshot(): BindingSnapshot {
    const container = Container.create();
    container.bind(serviceToken).toConstantValue(1).whenNamed("primary");
    return container.lookupBindings(serviceToken)[0]!;
  }

  it("derives resolve options from the slot a snapshot hands out", () => {
    const options = bindingSlotToResolveOptions(snapshot().slot);

    expectTypeOf(options).toEqualTypeOf<ResolveOptions | undefined>();
    expect(options).toEqual({ name: "primary" });
  });

  it("derives resolve options from an injection slot literal", () => {
    const options = injectionSlotToResolveOptions({ name: "primary", tags: [["env", "prod"]] });

    expectTypeOf(options).toEqualTypeOf<ResolveOptions | undefined>();
    expect(options).toEqual({ name: "primary", tags: [["env", "prod"]] });
  });

  it("reads a binding's scope off the snapshot rather than off an internal binding", () => {
    // The public replacement for the removed `effectiveBindingScope`.
    expectTypeOf(snapshot().scope).toEqualTypeOf<BindingScope>();
    expect(snapshot().scope).toBe("singleton");
  });

  it("reads a binding's scope off a graph node", () => {
    const container = Container.create();
    container.bind(serviceToken).toConstantValue(1);
    const graph = container.generateDependencyGraph();

    expectTypeOf(graph.nodes[0]!.scope).toEqualTypeOf<BindingScope>();
    expect(graph.nodes[0]!.scope).toBe("singleton");
  });
});
