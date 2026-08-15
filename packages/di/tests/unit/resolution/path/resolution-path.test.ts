/**
 * The cycle check keys on binding identity — two distinct tokens may share a display name — while
 * the path keeps names for the error message alone. The membership set `enterResolutionPath`
 * attaches past its threshold is an implementation of that check, never a second semantics: a graph
 * resolves the same whether or not it is deep enough to carry one. The set is seeded from the
 * stack, so the frames already on it are handed nothing to delete from on unwind — several tests
 * here are ways of observing that seed after those frames left.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { NO_TAG_KEYS } from "#/core/tag";
import type { Token } from "#/core/token";
import { token } from "#/core/token";
import type { BindingIdentifier, Constructor, ResolutionContext, ResolutionFrame } from "#/core/types";
import { injectable } from "#/decorators/injectable";
import {
  RESOLUTION_SET_THRESHOLD,
  UNOWNED_BRANCH,
  enterResolutionPath,
  extendResolutionBranch,
} from "#/resolution/path/resolution-path";

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
function buildChain(
  name: string,
  depth: number,
  nameOf: (level: number) => string = (level) => `${name}-${String(level)}`,
): { container: Container; tokens: ReadonlyArray<Token<ChainNode>> } {
  const tokens = Array.from({ length: depth }, (_value, level) => token<ChainNode>(nameOf(level)));
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

function frameOf(name: string, id: number): ResolutionFrame {
  return {
    tokenName: name,
    scope: "transient",
    bindingId: String(id) as BindingIdentifier,
    kind: "class",
    slot: { name: undefined, tags: [], keyMask: NO_TAG_KEYS },
  };
}

describe("distinct tokens sharing a display name", () => {
  it("resolves a shallow chain whose ends are both named the same", () => {
    const container = Container.create();
    const inner = token<ChainNode>("Dup");
    const mid = token<ChainNode>("mid");
    const outer = token<ChainNode>("Dup");

    @injectable()
    class Leaf implements ChainNode {
      readonly depth = 0;
    }

    container.bind(inner).to(Leaf).transient();
    container.bind(mid).to(buildChainLevelClass(inner)).transient();
    container
      .bind(outer)
      .to(buildChainLevelClass(mid))
      .transient()
      // Declines the root's compiled plan, so the runtime guard sees every level.
      .onActivation((_context, instance) => instance);

    expect(container.resolve(outer).depth).toBe(2);
  });

  it("resolves a chain deep enough that the membership set carries the check", () => {
    const { container, tokens } = buildChain("deep-dup", DEEP, (level) =>
      level === 1 || level === DEEP - 1 ? "deep-dup" : `deep-dup-${String(level)}`,
    );

    expect(container.resolve(tokens[DEEP - 1]!).depth).toBe(DEEP - 1);
  });

  it("resolves the same-named ends of an async chain", async () => {
    const container = Container.create();
    const inner = token<ChainNode>("Dup");
    const mid = token<ChainNode>("mid");
    const outer = token<ChainNode>("Dup");

    @injectable()
    class Leaf implements ChainNode {
      readonly depth = 0;
    }

    container.bind(inner).to(Leaf).transient();
    container.bind(mid).to(buildChainLevelClass(inner)).transient();
    container.bind(outer).to(buildChainLevelClass(mid)).transient();

    await expect(container.resolveAsync(outer)).resolves.toMatchObject({ depth: 2 });
  });

  it("still reports a real cycle between distinct same-named bindings", () => {
    const container = Container.create();
    const first = token<ChainNode>("Dup");
    const second = token<ChainNode>("Dup");

    container
      .bind(first)
      .to(buildChainLevelClass(second))
      .transient()
      .onActivation((_context, instance) => instance);
    container.bind(second).to(buildChainLevelClass(first)).transient();

    expect(() => container.resolve(first)).toThrow(/Circular dependency/);
  });

  it("still rejects a real cycle on the async lane", async () => {
    const container = Container.create();
    const first = token<ChainNode>("cycle-first");
    const second = token<ChainNode>("cycle-second");

    container.bind(first).to(buildChainLevelClass(second)).transient();
    container.bind(second).to(buildChainLevelClass(first)).transient();

    await expect(container.resolveAsync(first)).rejects.toThrow(/Circular dependency/);
  });
});

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
  it("keys on binding identity in the linear lane, not on the display name", () => {
    const path: Array<string> = [];
    const stack: Array<ResolutionFrame> = [];

    enterResolutionPath(path, stack, frameOf("Dup", 1));

    expect(() => enterResolutionPath(path, stack, frameOf("Dup", 2))).not.toThrow();
    expect(() => enterResolutionPath(path, stack, frameOf("renamed", 1))).toThrow(/Circular dependency/);
  });

  it("keys on binding identity once the membership set carries the check", () => {
    const path: Array<string> = [];
    const stack: Array<ResolutionFrame> = [];

    for (let index = 0; index < RESOLUTION_SET_THRESHOLD; index++) {
      enterResolutionPath(path, stack, frameOf(`frame-${String(index)}`, index));
    }

    expect(() => enterResolutionPath(path, stack, frameOf("frame-0", RESOLUTION_SET_THRESHOLD))).not.toThrow();
    expect(() => enterResolutionPath(path, stack, frameOf("renamed", 0))).toThrow(/Circular dependency/);
  });

  it("drops a set whose path has unwound past the depth it attached at", () => {
    const path: Array<string> = [];
    const stack: Array<ResolutionFrame> = [];

    for (let index = 0; index < RESOLUTION_SET_THRESHOLD; index++) {
      enterResolutionPath(path, stack, frameOf(`frame-${String(index)}`, index));
    }
    // The first frame past the threshold is the one that attaches the set.
    const attachingFrame = frameOf("attaching-frame", RESOLUTION_SET_THRESHOLD);
    const attached = enterResolutionPath(path, stack, attachingFrame);

    expect(attached).toBeInstanceOf(Set);

    // That frame unwinds knowing about the set; the seeded ones below it never did.
    stack.pop();
    path.pop();
    attached?.delete(attachingFrame.bindingId);
    while (path.length > 0) {
      stack.pop();
      path.pop();
    }

    expect(() => enterResolutionPath(path, stack, frameOf("frame-0", 0))).not.toThrow();
  });
});

describe("extendResolutionBranch, called directly", () => {
  it("keys on binding identity, not on the display name", () => {
    const path: Array<string> = [];
    const stack: Array<ResolutionFrame> = [];

    enterResolutionPath(path, stack, frameOf("Dup", 1));

    expect(() => extendResolutionBranch(path, stack, UNOWNED_BRANCH, frameOf("Dup", 2))).not.toThrow();
    expect(() => extendResolutionBranch(path, stack, UNOWNED_BRANCH, frameOf("renamed", 1))).toThrow(
      /Circular dependency/,
    );
  });
});
