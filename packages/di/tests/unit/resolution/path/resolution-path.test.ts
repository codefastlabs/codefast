/**
 * The membership set `enterResolutionPath` attaches past its threshold is an implementation of the
 * cycle check, never a second semantics: a graph resolves the same whether or not it is deep enough
 * to carry one. The set is seeded from the path, so the frames already on it are handed nothing to
 * delete from on unwind — every test here is a way of observing that seed after those frames left.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import type { Token } from "#/core/token";
import { token } from "#/core/token";
import type { Constructor, ResolutionContext } from "#/core/types";
import { injectable } from "#/decorators/injectable";
import { RESOLUTION_SET_THRESHOLD, enterResolutionPath } from "#/resolution/path/resolution-path";

const DEEP = RESOLUTION_SET_THRESHOLD + 8;
const SHALLOW = RESOLUTION_SET_THRESHOLD - 8;

interface ChainNode {
  readonly depth: number;
}

function buildChainLevelClass(previousToken: Token<ChainNode>): Constructor<ChainNode> {
  @injectable([previousToken])
  class ChainLevel implements ChainNode {
    readonly depth: number;

    constructor(previous: ChainNode) {
      this.depth = previous.depth + 1;
    }
  }

  return ChainLevel;
}

/**
 * A chain of transient class bindings, kept off a compiled plan so every level enters the path.
 *
 * @remarks A `toDynamic` chain would not do: that lane takes `binding.inFlight` and never calls
 * `enterResolutionPath`. The hook on the deepest binding is what declines its plan.
 */
function buildChain(name: string, depth: number): { container: Container; tokens: ReadonlyArray<Token<ChainNode>> } {
  const tokens = Array.from({ length: depth }, (_value, level) => token<ChainNode>(`${name}-${String(level)}`));
  const container = Container.create();

  container.bind(tokens[0]!).toConstantValue({ depth: 0 });
  for (let level = 1; level < depth; level++) {
    const levelBinding = container
      .bind(tokens[level]!)
      .to(buildChainLevelClass(tokens[level - 1]!))
      .transient();

    if (level === depth - 1) {
      levelBinding.onActivation((_context, instance) => instance);
    }
  }

  return { container, tokens };
}

describe("a path deep enough to carry a membership set", () => {
  it("resolves the same graph again, rather than reporting a cycle the second time", () => {
    const { container, tokens } = buildChain("deep-repeat", DEEP);
    const leafToken = tokens[DEEP - 1]!;

    expect(container.resolve(leafToken).depth).toBe(DEEP - 1);
    expect(container.resolve(leafToken).depth).toBe(DEEP - 1);
    expect(container.resolve(leafToken).depth).toBe(DEEP - 1);
  });

  it("answers a sibling needing a token the branch before it has already unwound past", () => {
    const { container, tokens } = buildChain("deep-sibling", DEEP);
    const leafToken = tokens[DEEP - 1]!;
    const forkToken = token<number>("deep-sibling-fork");

    container
      .bind(forkToken)
      .toDynamic((context: ResolutionContext) => context.resolve(leafToken).depth + context.resolve(leafToken).depth)
      .transient();

    expect(container.resolve(forkToken)).toBe((DEEP - 1) * 2);
  });

  it("still reports a real cycle at that depth", () => {
    const { container, tokens } = buildChain("deep-cycle", DEEP);
    const leafToken = tokens[DEEP - 1]!;

    container.rebind(tokens[0]!).toDynamic((context: ResolutionContext) => context.resolve(leafToken));

    expect(() => container.resolve(leafToken)).toThrow(/Circular dependency/);
  });

  it("matches a shallow path's answer, which never attaches one", () => {
    const { container, tokens } = buildChain("shallow-repeat", SHALLOW);
    const leafToken = tokens[SHALLOW - 1]!;

    expect(container.resolve(leafToken).depth).toBe(SHALLOW - 1);
    expect(container.resolve(leafToken).depth).toBe(SHALLOW - 1);
  });
});

describe("enterResolutionPath, called directly", () => {
  it("drops a set whose path has unwound past the depth it attached at", () => {
    const path: Array<string> = [];

    for (let index = 0; index < RESOLUTION_SET_THRESHOLD; index++) {
      enterResolutionPath(path, `frame-${String(index)}`);
    }
    // The first frame past the threshold is the one that attaches the set.
    const attached = enterResolutionPath(path, "attaching-frame");

    expect(attached).toBeInstanceOf(Set);

    // That frame unwinds knowing about the set; the seeded ones below it never did.
    path.pop();
    attached?.delete("attaching-frame");
    while (path.length > 0) {
      path.pop();
    }

    expect(() => enterResolutionPath(path, "frame-0")).not.toThrow();
  });
});
