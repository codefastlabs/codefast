/**
 * The async lane's central invariant is that a branch may only ever append to an array it minted
 * itself — a sync frame's stack is one that frame will pop, and it may carry a membership `Set` this
 * lane cannot keep true. The rule is a type rather than prose, so the compiler answers it:
 * `OwnedBranchStack` is minted only by `extendResolutionBranch`, and a `BranchDepth` cannot be a
 * number that came from anywhere else.
 */
import { expectTypeOf } from "expect-type";
import { describe, expect, it } from "vitest";

import { NO_TAG_KEYS } from "#/core/tag";
import type { BindingIdentifier, ResolutionFrame } from "#/core/types";
import type { ResolutionDiagnostics } from "#/errors/diagnostics";
import type { BranchDepth, OwnedBranchDepth, OwnedBranchStack } from "#/resolution/path/resolution-path";
import { branchDepthOf, extendResolutionBranch, ROOT_BRANCH } from "#/resolution/path/resolution-path";

function frameOf(name: string, id: number): ResolutionFrame {
  return {
    tokenName: name,
    scope: "transient",
    bindingId: String(id) as BindingIdentifier,
    kind: "class",
    slot: { name: undefined, tags: [], keyMask: NO_TAG_KEYS },
  };
}

describe("only the lane's own helper mints a branch", () => {
  it("returns an owned branch, which a plain array is not", () => {
    expectTypeOf(extendResolutionBranch).returns.toEqualTypeOf<OwnedBranchStack>();
    expectTypeOf<OwnedBranchStack>().toExtend<Array<ResolutionFrame>>();
    expectTypeOf<Array<ResolutionFrame>>().not.toExtend<OwnedBranchStack>();
  });

  it("takes any stack to extend from, since an unowned one is copied", () => {
    expectTypeOf(extendResolutionBranch).parameter(0).toEqualTypeOf<Array<ResolutionFrame>>();
  });
});

describe("a branch depth cannot be an arbitrary number", () => {
  it("rejects a bare number and accepts only the lane's own depths", () => {
    expectTypeOf<number>().not.toExtend<BranchDepth>();
    expectTypeOf<BranchDepth>().toExtend<number>();
    expectTypeOf(ROOT_BRANCH).toEqualTypeOf<OwnedBranchDepth>();
    expectTypeOf(branchDepthOf).returns.toEqualTypeOf<OwnedBranchDepth>();
    expectTypeOf(extendResolutionBranch).parameter(1).toEqualTypeOf<BranchDepth>();
  });

  it("keeps the unowned case visible in the type rather than hidden in the brand", () => {
    // Both members are reachable, so a signature taking one says that an unowned array is allowed.
    expectTypeOf<OwnedBranchDepth>().toExtend<BranchDepth>();
    expectTypeOf<-1>().toExtend<BranchDepth>();
    // ...and the owned half is still not something a bare number can satisfy.
    expectTypeOf<number>().not.toExtend<OwnedBranchDepth>();
  });

  it("only reads a depth off a branch that owns one", () => {
    expectTypeOf(branchDepthOf).parameter(0).toEqualTypeOf<OwnedBranchStack>();
  });

  it("is the length the branch had when the level took it", () => {
    const rootFrame = frameOf("root", 1);
    const branch = extendResolutionBranch([], ROOT_BRANCH, rootFrame);
    expect(branchDepthOf(branch)).toBe(1);
    expect(branchDepthOf(extendResolutionBranch(branch, branchDepthOf(branch), frameOf("child", 2)))).toBe(2);
  });
});

describe("the async context pool is gone from the public diagnostics", () => {
  it("no longer reports a pool that does not exist", () => {
    expectTypeOf<ResolutionDiagnostics>().not.toHaveProperty("asyncContextPoolSize");
    expectTypeOf<ResolutionDiagnostics>().toHaveProperty("syncContextPoolSize");
  });
});
