/**
 * The exported surface has to be usable from outside, which is a stronger claim than "it compiles".
 *
 * A function is only public in a useful sense if a consumer can obtain a value to pass it, using
 * nothing but the package's own exports. `effectiveBindingScope` failed that test for several
 * releases: it reads a `Binding`, which `package.json#exports` deliberately withholds, and no public
 * API returns one — so it was exported and uncallable. These assertions import through the package
 * specifier, exactly as a consumer does, so a repeat shows up here rather than in an issue.
 */
import {
  bindingSlotToResolveOptions,
  Container,
  defaultMetadataReader,
  getActiveContainer,
  injectionSlotToResolveOptions,
  runWithContainer,
  token,
} from "@codefast/di";
import type {
  BindingScope,
  BindingSnapshot,
  ConstructorMetadata,
  Constructor,
  ContainerInterface,
  LifecycleMetadata,
  MetadataReader,
  ResolveOptions,
} from "@codefast/di";
import { describe, expect, expectTypeOf, it } from "vitest";

import { tag } from "#/core/tag";

const ENV_TAG = tag("env");

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
    const options = injectionSlotToResolveOptions({ name: "primary", tags: [ENV_TAG.of("prod")] });

    expectTypeOf(options).toEqualTypeOf<ResolveOptions | undefined>();
    expect(options).toEqual({ name: "primary", tags: [ENV_TAG.of("prod")] });
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

    expectTypeOf(graph.nodes[0]!.scope).toEqualTypeOf<BindingScope | "unbound">();
    expect(graph.nodes[0]!.scope).toBe("singleton");
  });
});

describe("the ambient container is reachable from the root entry", () => {
  it("opens a context around a callback and restores it after", () => {
    const container = Container.create();

    expectTypeOf(getActiveContainer()).toEqualTypeOf<ContainerInterface | undefined>();
    expect(getActiveContainer()).toBeUndefined();

    const seen = runWithContainer(container, () => getActiveContainer());

    expectTypeOf(seen).toEqualTypeOf<ContainerInterface | undefined>();
    expect(seen).toBe(container);
    expect(getActiveContainer()).toBeUndefined();
  });
});

describe("a MetadataReader can be written and installed with root exports only", () => {
  const dsnToken = token<string>("public-surface.dsn");

  class Pool {
    constructor(readonly dsn: string) {}
  }

  it("describes an undecorated class and delegates the rest to the default reader", () => {
    const reader: MetadataReader = {
      getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined {
        return target === (Pool as Constructor)
          ? { params: [{ index: 0, token: dsnToken, optional: false, multi: false }] }
          : defaultMetadataReader.getConstructorMetadata(target);
      },
      getLifecycleMetadata(target: Constructor): LifecycleMetadata | undefined {
        return defaultMetadataReader.getLifecycleMetadata(target);
      },
    };

    const container = Container.create({ metadataReader: reader });

    container.bind(dsnToken).toConstantValue("postgres://localhost/app");
    container.bind(Pool).toSelf().singleton();

    expectTypeOf(container.resolve(Pool)).toEqualTypeOf<Pool>();
    expect(container.resolve(Pool).dsn).toBe("postgres://localhost/app");
  });
});
