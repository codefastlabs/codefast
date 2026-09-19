/**
 * The cycle check keys on binding identity — two distinct tokens may share a display name — and the
 * names an error prints are derived from the frames at the throw site. On a synchronous path the
 * check is the flag on the binding, at any depth: a graph resolves the same whether it is shallow or
 * deeper than any threshold the engine ever carried. A seeded path — one no synchronous frame pushed —
 * is marked before a synchronous call runs over it and unmarked after, so several tests here resolve
 * a deep graph more than once and from a sibling branch.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import type { Binding } from "#core/binding";
import { NO_TAG_KEYS } from "#core/tag";
import type { Token } from "#core/token";
import { token } from "#core/token";
import type { BindingIdentifier, Constructor, ResolutionContext, ResolutionFrame } from "#core/types";
import { injectable } from "#decorators/injectable";
import {
  bindingsOf,
  enterSeededPath,
  enterSyncPath,
  extendResolutionBranch,
  leaveSeededPath,
  leaveSyncPath,
  linkFrameBinding,
  UNOWNED_BRANCH,
} from "#resolution/path/resolution-path";

// Deeper than the plan compiler inlines, so the interpreted tail and its escape seed are both exercised.
const DEEP = 40;
const SHALLOW = 24;

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
 * @remarks A `toDynamic` chain would not do: that lane never reaches `#resolveBinding`. The hook on
 * the deepest binding is what declines its plan.
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
    bindingId: id as BindingIdentifier,
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

describe("a path deeper than the plan compiler inlines", () => {
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

  it("matches a shallow path's answer", () => {
    const { container, tokens } = buildChain("shallow-repeat", SHALLOW);
    const leafToken = tokens[SHALLOW - 1]!;

    expect(container.resolve(leafToken).depth).toBe(SHALLOW - 1);
    expect(container.resolve(leafToken).depth).toBe(SHALLOW - 1);
  });
});

function bindingStub(): Binding {
  return { inFlight: false } as Binding;
}

function linkedFrameOf(name: string, id: number, binding: Binding): ResolutionFrame {
  const frame = frameOf(name, id);
  linkFrameBinding(frame, binding);
  return frame;
}

describe("enterSyncPath, called directly", () => {
  it("keys on the binding, not on the display name", () => {
    const stack: Array<ResolutionFrame> = [];
    const first = bindingStub();
    const second = bindingStub();

    enterSyncPath(stack, first, frameOf("Dup", 1));

    expect(() => enterSyncPath(stack, second, frameOf("Dup", 2))).not.toThrow();
    expect(() => enterSyncPath(stack, first, frameOf("renamed", 1))).toThrow(/Circular dependency/);
    expect(stack).toHaveLength(2);
  });

  it("names the path from the frames when it throws", () => {
    const stack: Array<ResolutionFrame> = [];
    const binding = bindingStub();

    enterSyncPath(stack, binding, frameOf("outer", 1));
    enterSyncPath(stack, bindingStub(), frameOf("inner", 2));

    expect(() => enterSyncPath(stack, binding, frameOf("outer", 1))).toThrow("outer → inner → outer");
  });

  it("releases the binding on leave, so the same binding enters a later path", () => {
    const stack: Array<ResolutionFrame> = [];
    const binding = bindingStub();

    enterSyncPath(stack, binding, frameOf("once", 1));
    leaveSyncPath(stack, binding);

    expect(stack).toHaveLength(0);
    expect(binding.inFlight).toBe(false);
    expect(() => enterSyncPath(stack, binding, frameOf("again", 1))).not.toThrow();
  });
});

describe("enterSeededPath, called directly", () => {
  it("marks every binding behind the seed's linked frames and unmarks them on leave", () => {
    const first = bindingStub();
    const second = bindingStub();
    const seed = bindingsOf([
      linkedFrameOf("first", 1, first),
      frameOf("unlinked", 3),
      linkedFrameOf("second", 2, second),
    ]);
    expect(seed).toEqual([first, second]);

    const alreadyInFlight = enterSeededPath(seed);
    expect(alreadyInFlight).toBeUndefined();
    expect(first.inFlight).toBe(true);
    expect(second.inFlight).toBe(true);

    leaveSeededPath(seed, alreadyInFlight);
    expect(first.inFlight).toBe(false);
    expect(second.inFlight).toBe(false);
  });

  it("leaves a binding an enclosing frame already flagged as it found it, on the way in and out", () => {
    const first = bindingStub();
    const enclosing = bindingStub();
    enclosing.inFlight = true;
    const seed = [first, enclosing];

    const alreadyInFlight = enterSeededPath(seed);
    expect(first.inFlight).toBe(true);
    expect(enclosing.inFlight).toBe(true);

    leaveSeededPath(seed, alreadyInFlight);
    expect(first.inFlight).toBe(false);
    // Still the enclosing frame's to clear.
    expect(enclosing.inFlight).toBe(true);
  });
});

describe("extendResolutionBranch, called directly", () => {
  it("keys on binding identity, not on the display name", () => {
    const stack: Array<ResolutionFrame> = [frameOf("Dup", 1)];

    expect(() => extendResolutionBranch(stack, UNOWNED_BRANCH, frameOf("Dup", 2))).not.toThrow();
    expect(() => extendResolutionBranch(stack, UNOWNED_BRANCH, frameOf("renamed", 1))).toThrow(/Circular dependency/);
  });
});
