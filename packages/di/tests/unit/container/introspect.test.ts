/**
 * The functions that take a container read its private state through the class's own brand check, so they refuse
 * an object `Container` did not create and a disposed chain exactly as the methods they replace did.
 */
import { describe, expect, it } from "vitest";

import type { Container as ContainerInterface } from "#container/container";
import { Container } from "#container/container";
import { explain, generateDependencyGraph, inspect, lookupBindings, validate } from "#container/introspect";
import { token } from "#core/token";
import { DisposedContainerError } from "#errors";

const Logger = token<string>("introspect-test:Logger");

const READS: ReadonlyArray<readonly [string, (container: ContainerInterface) => unknown]> = [
  ["validate", (container) => validate(container)],
  ["inspect", (container) => inspect(container)],
  ["lookupBindings", (container) => lookupBindings(container, Logger)],
  ["explain", (container) => explain(container, Logger)],
  ["generateDependencyGraph", (container) => generateDependencyGraph(container)],
];

describe("functions that take a container", () => {
  it.each(READS)("%s refuses an object Container did not create", (_name, read) => {
    const lookalike = Object.create(Container.create()) as ContainerInterface;

    expect(() => read(lookalike)).toThrow(TypeError);
  });

  it.each(READS)("%s throws DisposedContainerError once the container is disposed", async (_name, read) => {
    const container = Container.create();
    container.bind(Logger).toConstantValue("console");
    await container.disposeAsync();

    expect(() => read(container)).toThrow(DisposedContainerError);
  });

  it.each(READS)("%s throws DisposedContainerError on a child whose parent is disposed", async (_name, read) => {
    const parent = Container.create();
    parent.bind(Logger).toConstantValue("console");
    const child = parent.createChild();
    await parent.disposeAsync();

    expect(() => read(child)).toThrow(DisposedContainerError);
  });

  it("reads the parent chain the way resolve does", () => {
    const parent = Container.create();
    parent.bind(Logger).toConstantValue("console");
    const child = parent.createChild();

    expect(explain(child, Logger).selected?.tokenName).toBe("introspect-test:Logger");
    expect(lookupBindings(child, Logger)).toEqual([]);
    expect(generateDependencyGraph(child, { includeParent: true }).nodes.map((node) => node.fromParent)).toEqual([
      true,
    ]);
  });
});
