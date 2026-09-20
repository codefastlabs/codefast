import type { Binding } from "#core/binding";
import type { ResolutionFrame } from "#core/types";
/** Cycle-detection bookkeeping carried on the resolution stack itself. */
import { CircularDependencyError } from "#errors/errors";

/** The key under which a resolver-built frame carries its binding, for marking a seeded path. */
const FRAME_BINDING: unique symbol = Symbol("di:frame-binding");

interface LinkedFrame extends ResolutionFrame {
  readonly [FRAME_BINDING]?: Binding;
}

/**
 * Creates the resolution-stack frame for one in-flight resolve of a binding.
 *
 * @remarks A literal, because the engine's hot loads read frames: a class instance costs every level
 * a few nanoseconds, and a weak map beside the frames costs every cold container an ephemeron insert
 * per binding. The binding rides under a symbol no caller enumerates.
 *
 * @since 0.3.16-canary.0
 */
export function buildResolutionFrame(binding: Binding, tokenName: string): ResolutionFrame {
  const frame: LinkedFrame = {
    tokenName,
    scope: binding.scope,
    bindingId: binding.identifier,
    kind: binding.kind,
    slot: binding.slot,
    [FRAME_BINDING]: binding,
  };
  return frame;
}

/** The bindings behind the resolver-built frames of a path, in path order. */
export function bindingsOf(frames: ReadonlyArray<ResolutionFrame>): Array<Binding> {
  const bindings: Array<Binding> = [];
  for (let index = 0; index < frames.length; index += 1) {
    const binding = (frames[index] as LinkedFrame)[FRAME_BINDING];
    if (binding !== undefined) {
      bindings.push(binding);
    }
  }
  return bindings;
}

/**
 * The token names along a stack plus the frame that closed the cycle — built only to throw.
 *
 * @since 0.6.0
 */
export function cycleNamesOf(resolutionStack: ReadonlyArray<ResolutionFrame>, closingName: string): Array<string> {
  const names = new Array<string>(resolutionStack.length + 1);
  for (let index = 0; index < resolutionStack.length; index += 1) {
    names[index] = resolutionStack[index]!.tokenName;
  }
  names[resolutionStack.length] = closingName;
  return names;
}

/**
 * Marks a level in flight on a synchronous path and pushes its frame, throwing if its binding already is.
 *
 * @remarks Synchronous code does not interleave, so the flag on the binding is exact membership in the
 * path one call stack is resolving — at any depth, with no side table and nothing to size. The check
 * keys on the binding, never on a token's display name, and the names an error prints are read off
 * the frames at the throw site. Unmark with {@link leaveSyncPath}. Sync only: the async branch lane
 * never unwinds, so it extends a branch instead; see {@link extendResolutionBranch}.
 */
export function enterSyncPath(resolutionStack: Array<ResolutionFrame>, binding: Binding, frame: ResolutionFrame): void {
  if (binding.inFlight) {
    throw new CircularDependencyError(cycleNamesOf(resolutionStack, frame.tokenName));
  }
  binding.inFlight = true;
  resolutionStack.push(frame);
}

/**
 * Pops the level {@link enterSyncPath} pushed and clears its binding's flag.
 */
export function leaveSyncPath(resolutionStack: Array<ResolutionFrame>, binding: Binding): void {
  resolutionStack.pop();
  binding.inFlight = false;
}

/**
 * Marks every binding of a seeded path in flight for the synchronous call about to run over it.
 *
 * @remarks A seed is a path no synchronous frame pushed — a plan's static ancestors handed to an
 * escape, or an async level's branch handed to a factory's synchronous call — so its bindings carry no
 * flag, and marking them is what keeps the flag the one check. A binding already in flight was
 * flagged by an enclosing synchronous frame that is still running, which is the same fact stated
 * once already, so it is left as it is and left alone on the way out; a cycle is reported where the
 * path re-enters that binding, which is where the frames to name it are.
 *
 * @returns the bindings this call left flagged as it found them, when there were any, for {@link leaveSeededPath}
 */
export function enterSeededPath(bindings: ReadonlyArray<Binding>): Set<Binding> | undefined {
  let alreadyInFlight: Set<Binding> | undefined;
  for (let index = 0; index < bindings.length; index += 1) {
    const binding = bindings[index]!;
    if (binding.inFlight) {
      (alreadyInFlight ??= new Set()).add(binding);
      continue;
    }
    binding.inFlight = true;
  }
  return alreadyInFlight;
}

/**
 * Clears the flags {@link enterSeededPath} set, leaving the ones it found already set.
 */
export function leaveSeededPath(bindings: ReadonlyArray<Binding>, alreadyInFlight: Set<Binding> | undefined): void {
  for (let index = 0; index < bindings.length; index += 1) {
    const binding = bindings[index]!;
    if (alreadyInFlight === undefined || !alreadyInFlight.has(binding)) {
      binding.inFlight = false;
    }
  }
}

declare const BRANCH_BRAND: unique symbol;

/**
 * A resolution stack one async branch owns, so appending to it cannot disturb another branch.
 *
 * @remarks Only {@link extendResolutionBranch} mints one. That is what makes "may this lane append
 * to this array" a question the compiler answers instead of a rule in a doc — a sync frame's stack,
 * which that frame will pop, is a plain `Array<ResolutionFrame>` and cannot reach a level that owns
 * its own.
 *
 * @since 0.5.0-canary.9
 */
export type OwnedBranchStack = Array<ResolutionFrame> & { readonly [BRANCH_BRAND]: true };

declare const BRANCH_DEPTH_BRAND: unique symbol;

/**
 * How many leading entries of a stack belong to one async branch.
 *
 * @remarks Branded so a bare number cannot be passed: a depth from anywhere but this branch silently
 * re-parents a level.
 *
 * @since 0.5.0-canary.9
 */
export type OwnedBranchDepth = number & { readonly [BRANCH_DEPTH_BRAND]: true };

/**
 * A stack no async branch owns yet, so its first extension must copy rather than append.
 *
 * @since 0.5.0-canary.9
 */
export const UNOWNED_BRANCH = -1;

/**
 * How far into a stack one extension may reach: this branch's own depth, or nobody's.
 *
 * @remarks A union rather than a sentinel hidden inside the branded number, so the two cases are
 * visible at every signature that takes one and `=== UNOWNED_BRANCH` narrows to the owned case.
 *
 * @since 0.5.0-canary.9
 */
export type BranchDepth = OwnedBranchDepth | typeof UNOWNED_BRANCH;

/**
 * The depth a chain's first level extends from, over an array its caller just minted.
 *
 * @since 0.5.0-canary.9
 */
export const ROOT_BRANCH = 0 as OwnedBranchDepth;

/**
 * A branch's own depth: the length its stack had when this level took it.
 *
 * @since 0.5.0-canary.9
 */
export function branchDepthOf(branch: OwnedBranchStack): OwnedBranchDepth {
  return branch.length as OwnedBranchDepth;
}

/**
 * Extends one branch of an append-only stack, throwing if the binding is already an ancestor.
 *
 * @remarks The check compares binding ids on the frames; the names an error prints are derived at
 * the throw site. Appends in place while this branch still owns the next slot, and copies its own
 * prefix once a sibling has claimed it. Nothing is ever removed, so no async level has to observe
 * its own settlement to unwind.
 *
 * @since 0.5.0-canary.9
 */
export function extendResolutionBranch(
  resolutionStack: Array<ResolutionFrame>,
  branchDepth: BranchDepth,
  frame: ResolutionFrame,
): OwnedBranchStack {
  const depth = branchDepth === UNOWNED_BRANCH ? resolutionStack.length : branchDepth;
  for (let index = 0; index < depth; index += 1) {
    if (resolutionStack[index]!.bindingId === frame.bindingId) {
      throw new CircularDependencyError(cycleNamesOf(resolutionStack.slice(0, depth), frame.tokenName));
    }
  }
  // An unowned array belongs to a sync frame that will pop it, or carries a membership Set this
  // lane cannot keep true; copying is what makes the branch's own appends safe.
  if (branchDepth === resolutionStack.length) {
    // The sole mint: appending in place needs a depth that came from a branch already owned, or
    // ROOT_BRANCH over an array its caller minted for this chain alone.
    resolutionStack.push(frame);
    return resolutionStack as OwnedBranchStack;
  }
  const branch = resolutionStack.slice(0, depth);
  branch.push(frame);
  return branch as OwnedBranchStack;
}
