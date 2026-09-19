/**
 * Every lane of the engine is one implementation of one contract: a graph resolves to the same
 * values, the same sharing pattern and the same errors whether the resolve is interpreted, runs a
 * compiled closure, runs a generated plan, reads a collection, asks optionally, starts from a
 * per-request child or goes through the async pipeline. A threshold inside the engine may pick a
 * data structure or a tier; it may never pick an answer. These properties generate graphs at random
 * and hold every lane to the same snapshot.
 */
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { GraphSpec, LaneSnapshots } from "#tests/integration/support/lane-differential";
import {
  asyncLanes,
  chainSpecArb,
  childHost,
  graphSpecArb,
  hasAsyncKind,
  hasScopedNode,
  isLoneRootBinding,
  isRootLevelMiss,
  prepareGraph,
  rootHost,
  siblingSpecArb,
  syncLanes,
} from "#tests/integration/support/lane-differential";

const NUM_RUNS = Number(process.env["DIFF_RUNS"] ?? "250");

function isEmptyCollection(snapshot: unknown): boolean {
  return (
    typeof snapshot === "object" && snapshot !== null && (snapshot as { collectionOf?: number }).collectionOf === 0
  );
}

function isErrorSnapshot(snapshot: unknown): boolean {
  return typeof snapshot === "object" && snapshot !== null && "error" in snapshot;
}

/** One lane answering differently from the lane it is held to — what a failing property prints. */
interface Disagreement {
  readonly where: string;
  readonly lane: string;
  readonly expected: unknown;
  readonly actual: unknown;
}

function differs(expected: unknown, actual: unknown): boolean {
  return JSON.stringify(expected) !== JSON.stringify(actual);
}

/**
 * Every lane's snapshot against the reference lane's.
 *
 * @remarks Two lanes answer a different question by contract and are held to that instead: an
 * optional read answers a root-level miss with `undefined`, and a collection read is empty on one
 * and stands in for a single resolve only over a token with one default-slot, non-member binding.
 */
function laneDisagreements(
  lanes: LaneSnapshots,
  referenceName: string,
  where: string,
  collections: boolean,
): Array<Disagreement> {
  const reference = lanes.get(referenceName);
  const found: Array<Disagreement> = [];
  for (const [lane, actual] of lanes) {
    if (lane.includes("collection") && (!collections || (isEmptyCollection(actual) && isRootLevelMiss(reference)))) {
      continue;
    }
    if (lane.includes("optional") && actual === undefined && isRootLevelMiss(reference)) {
      continue;
    }
    if (differs(reference, actual)) {
      found.push({ where, lane, expected: reference, actual });
    }
  }
  return found;
}

/** Two hosts' lanes, lane by lane. */
function hostDisagreements(left: LaneSnapshots, right: LaneSnapshots, where: string): Array<Disagreement> {
  const found: Array<Disagreement> = [];
  for (const [lane, expected] of left) {
    const actual = right.get(lane);
    if (differs(expected, actual)) {
      found.push({ where, lane, expected, actual });
    }
  }
  return found;
}

/**
 * How the async lane's outcome is held to the sync lane's.
 *
 * @remarks Siblings resolve concurrently on the async lane, so when two of them fail the error that
 * settles first is reported, where the sync lane reports the first in declaration order. A graph
 * with sibling dependencies therefore requires the async lane to fail where the sync lane fails; a
 * chain has one dependency per level and no race, so its errors must match verbatim.
 */
type ErrorAgreement = "exact" | "both-fail";

async function disagreementsOf(spec: GraphSpec, errors: ErrorAgreement): Promise<Array<Disagreement>> {
  const materials = prepareGraph(spec);
  const root = materials.tokens[0]!;
  const collections = isLoneRootBinding(spec);
  const found: Array<Disagreement> = [];

  const rootContainer = rootHost(spec, materials);
  const rootSync = syncLanes(rootContainer, root);
  found.push(...laneDisagreements(rootSync, "interpreted", "root sync", collections));
  const rootAsync = await asyncLanes(rootContainer, root);
  found.push(...laneDisagreements(rootAsync, "async-interpreted", "root async", collections));

  const childContainer = childHost(spec, materials);
  const childSync = syncLanes(childContainer, root);
  found.push(...laneDisagreements(childSync, "interpreted", "child sync", collections));
  const childAsync = await asyncLanes(childContainer, root);
  found.push(...laneDisagreements(childAsync, "async-interpreted", "child async", collections));

  // A sync lane that reached an async node fails where the async lane succeeds; every other outcome
  // — a value, or an error raised before any async node — is the async lane's outcome too.
  const syncReference = rootSync.get("interpreted");
  const asyncReference = rootAsync.get("async-interpreted");
  if (!isErrorSnapshot(syncReference)) {
    if (differs(syncReference, asyncReference)) {
      found.push({
        where: "root async vs root sync",
        lane: "async-interpreted",
        expected: syncReference,
        actual: asyncReference,
      });
    }
    const childSyncReference = childSync.get("interpreted");
    const childAsyncReference = childAsync.get("async-interpreted");
    if (differs(childSyncReference, childAsyncReference)) {
      found.push({
        where: "child async vs child sync",
        lane: "async-interpreted",
        expected: childSyncReference,
        actual: childAsyncReference,
      });
    }
  } else if (!hasAsyncKind(spec)) {
    if (errors === "exact" ? differs(syncReference, asyncReference) : !isErrorSnapshot(asyncReference)) {
      found.push({
        where: "root async vs root sync",
        lane: "async-interpreted",
        expected: syncReference,
        actual: asyncReference,
      });
    }
  }

  // A root container cannot hold a scoped instance, so only a scope-free graph reads the same from both hosts.
  if (!hasScopedNode(spec)) {
    found.push(...hostDisagreements(rootSync, childSync, "child vs root, sync"));
    found.push(...hostDisagreements(rootAsync, childAsync, "child vs root, async"));
  }
  return found;
}

describe("every resolution lane answers a random graph identically", () => {
  it("random graphs: kinds, scopes, slots, members, predicates, siblings, cycles and misses", async () => {
    await fc.assert(
      fc.asyncProperty(graphSpecArb, async (spec) => {
        expect(await disagreementsOf(spec, "both-fail")).toEqual([]);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("sibling dependencies: selection by parent while the async lane starts siblings concurrently", async () => {
    await fc.assert(
      fc.asyncProperty(siblingSpecArb, async (spec) => {
        expect(await disagreementsOf(spec, "both-fail")).toEqual([]);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("deep chains: across the plan depth limit and the membership-set threshold, with and without a cycle", async () => {
    await fc.assert(
      fc.asyncProperty(chainSpecArb, async (spec) => {
        expect(await disagreementsOf(spec, "exact")).toEqual([]);
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
