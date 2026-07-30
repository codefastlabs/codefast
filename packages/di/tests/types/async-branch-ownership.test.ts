/**
 * The async lane's central invariant is that a branch may only ever append to an array it minted
 * itself — a sync frame's path is one that frame will pop, and it may carry a membership `Set` this
 * lane cannot keep true. That used to be a rule in `ARCHITECTURE.md` and a comment. It is a type
 * here instead, so the compiler answers it: `OwnedBranchPath` is minted only by
 * `extendResolutionBranch`, and a `BranchDepth` cannot be a number that came from anywhere else.
 */
import { expectTypeOf } from "expect-type";
import { describe, expect, it } from "vitest";

import type { ResolutionDiagnostics } from "#/resolution/diagnostics";
import type { BranchDepth, OwnedBranchPath, OwnedBranchStack } from "#/resolution/resolution-path";
import {
  branchDepthOf,
  extendResolutionBranch,
  extendResolutionStackBranch,
  ROOT_BRANCH,
} from "#/resolution/resolution-path";
import type { ResolutionFrame } from "#/types";

describe("only the lane's own helpers mint a branch", () => {
  it("returns an owned branch, which a plain array is not", () => {
    expectTypeOf(extendResolutionBranch).returns.toEqualTypeOf<OwnedBranchPath>();
    expectTypeOf(extendResolutionStackBranch).returns.toEqualTypeOf<OwnedBranchStack>();
    expectTypeOf<OwnedBranchPath>().toExtend<Array<string>>();
    expectTypeOf<Array<string>>().not.toExtend<OwnedBranchPath>();
    expectTypeOf<Array<ResolutionFrame>>().not.toExtend<OwnedBranchStack>();
  });

  it("takes any array to extend from, since an unowned one is copied", () => {
    expectTypeOf(extendResolutionBranch).parameter(0).toEqualTypeOf<Array<string>>();
  });
});

describe("a branch depth cannot be an arbitrary number", () => {
  it("rejects a bare number and accepts only the lane's own depths", () => {
    expectTypeOf<number>().not.toExtend<BranchDepth>();
    expectTypeOf<BranchDepth>().toExtend<number>();
    expectTypeOf(ROOT_BRANCH).toEqualTypeOf<BranchDepth>();
    expectTypeOf(branchDepthOf).returns.toEqualTypeOf<BranchDepth>();
    expectTypeOf(extendResolutionBranch).parameter(1).toEqualTypeOf<BranchDepth>();
  });

  it("only reads a depth off a branch that owns one", () => {
    expectTypeOf(branchDepthOf).parameter(0).toEqualTypeOf<OwnedBranchPath>();
  });

  it("is the length the branch had when the level took it", () => {
    const branch = extendResolutionBranch([], ROOT_BRANCH, "root");
    expect(branchDepthOf(branch)).toBe(1);
    expect(branchDepthOf(extendResolutionBranch(branch, branchDepthOf(branch), "child"))).toBe(2);
  });
});

describe("the async context pool is gone from the public diagnostics", () => {
  it("no longer reports a pool that does not exist", () => {
    expectTypeOf<ResolutionDiagnostics>().not.toHaveProperty("asyncContextPoolSize");
    expectTypeOf<ResolutionDiagnostics>().toHaveProperty("syncContextPoolSize");
  });
});
