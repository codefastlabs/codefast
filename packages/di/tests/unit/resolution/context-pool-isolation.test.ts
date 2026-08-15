/**
 * A factory's ctx must keep answering from its own resolution path even after the factory runs a
 * nested top-level resolve, which mints its own path arrays at the same depth.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { token } from "#/core/token";
import { whenParentIs } from "#/resolution/select/constraints";

describe("sync context pool isolation", () => {
  it("ctx keeps its path after a nested container.resolve at the same depth", () => {
    const container = Container.create();
    const Entry = token<string>("Entry");
    const Selected = token<string>("Selected");
    const Unrelated = token<string>("Unrelated");

    container.bind(Unrelated).toDynamic(() => "unrelated");
    container.bind(Selected).toDynamic(() => "generic");
    container
      .bind(Selected)
      .toDynamic(() => "under-entry")
      .when(whenParentIs(Entry));
    container.bind(Entry).toDynamic((ctx) => {
      // A nested top-level resolve mints its own path arrays and acquires a context at the same
      // depth as this factory's ctx — which must not re-point ctx at those arrays.
      container.resolve(Unrelated);
      return ctx.resolve(Selected);
    });

    expect(container.resolve(Entry)).toBe("under-entry");
  });

  it("ctx.graph keeps its ancestors after a nested container.resolve", () => {
    const container = Container.create();
    const Entry = token<string>("Entry");
    const Unrelated = token<string>("Unrelated");

    container.bind(Unrelated).toDynamic(() => "unrelated");
    container.bind(Entry).toDynamic((ctx) => {
      container.resolve(Unrelated);
      return ctx.graph.resolutionPath.join("→");
    });

    expect(container.resolve(Entry)).toBe("Entry");
  });
});
