/**
 * Every lane of the engine is one implementation of one contract: a graph resolves to the same
 * values, the same sharing pattern and the same errors whether the resolve is interpreted, runs a
 * compiled closure, runs a generated plan, reads a collection, asks optionally, starts from a
 * per-request child or goes through the async pipeline. A threshold inside the engine may pick a
 * data structure or a tier; it may never pick an answer. These properties generate graphs at random
 * and hold every lane to the same snapshot — a first async resolve to a cold one, the rest to a warm one.
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
// A seed pins one run for a replay or a second sweep; unset, fast-check draws its own.
const SEED = process.env["DIFF_SEED"];
const propertyOptions: fc.Parameters<unknown> =
  SEED === undefined ? { numRuns: NUM_RUNS } : { numRuns: NUM_RUNS, seed: Number(SEED) };
// Hundreds of graphs through a dozen lanes each: seconds here, tens of seconds on a CI runner.
const PROPERTY_TIMEOUT_MS = 300_000;

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

/** The sync lanes are all held to the interpreted resolve. */
function syncReferenceOf(): string {
  return "interpreted";
}

/**
 * The lane an async lane is held to: the first resolve, and the cold reference itself, to the
 * cold reference; every later lane to the warm interpreted resolve.
 *
 * @remarks A singleton still pending refuses a synchronous read that a warm resolve answers, by
 * contract, so a cold and a warm resolve of one graph may legitimately differ — but two cold ones,
 * and two warm ones, may not.
 */
function asyncReferenceOf(lane: string): string {
  return lane === "async#0" || lane === "async-cold" ? "async-cold" : "async-interpreted";
}

/**
 * Every lane's snapshot against its reference lane's.
 *
 * @remarks Two lanes answer a different question by contract and are held to that instead: an
 * optional read answers a root-level miss with `undefined`, and a collection read is empty on one
 * and stands in for a single resolve only over a token with one default-slot, non-member binding.
 */
function laneDisagreements(
  lanes: LaneSnapshots,
  referenceOf: (lane: string) => string,
  where: string,
  collections: boolean,
  spec: GraphSpec,
): Array<Disagreement> {
  const found: Array<Disagreement> = [];
  for (const [lane, actual] of lanes) {
    const reference = lanes.get(referenceOf(lane));
    if (
      lane.includes("collection") &&
      (!collections || (isEmptyCollection(actual) && isRootLevelMiss(reference, spec)))
    ) {
      continue;
    }
    if (lane.includes("optional") && actual === undefined && isRootLevelMiss(reference, spec)) {
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
 * @remarks Every lane reports the first failing dependency in declaration order — the async lanes
 * start siblings concurrently but settle them in order before reporting — so errors match verbatim.
 * `both-fail` stays available for a generator that deliberately loosens that; none does today.
 */
type ErrorAgreement = "exact" | "both-fail";

async function disagreementsOf(spec: GraphSpec, errors: ErrorAgreement): Promise<Array<Disagreement>> {
  const materials = prepareGraph(spec);
  const root = materials.tokens[0]!;
  const collections = isLoneRootBinding(spec);
  const found: Array<Disagreement> = [];

  const rootContainer = rootHost(spec, materials);
  const rootSync = syncLanes(rootContainer, root);
  found.push(...laneDisagreements(rootSync, syncReferenceOf, "root sync", collections, spec));
  const rootAsync = await asyncLanes(rootContainer, root, () => rootHost(spec, materials));
  found.push(...laneDisagreements(rootAsync, asyncReferenceOf, "root async", collections, spec));

  const childContainer = childHost(spec, materials);
  const childSync = syncLanes(childContainer, root);
  found.push(...laneDisagreements(childSync, syncReferenceOf, "child sync", collections, spec));
  const childAsync = await asyncLanes(childContainer, root, () => childHost(spec, materials));
  found.push(...laneDisagreements(childAsync, asyncReferenceOf, "child async", collections, spec));

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
  it(
    "random graphs: kinds, scopes, slots, members, predicates, siblings, cycles and misses",
    async () => {
      await fc.assert(
        fc.asyncProperty(graphSpecArb, async (spec) => {
          expect(await disagreementsOf(spec, "exact")).toEqual([]);
        }),
        propertyOptions,
      );
    },
    PROPERTY_TIMEOUT_MS,
  );

  it(
    "sibling dependencies: selection by parent while the async lane starts siblings concurrently",
    async () => {
      await fc.assert(
        fc.asyncProperty(siblingSpecArb, async (spec) => {
          expect(await disagreementsOf(spec, "exact")).toEqual([]);
        }),
        propertyOptions,
      );
    },
    PROPERTY_TIMEOUT_MS,
  );

  it(
    "deep chains: dozens of levels compiled and interpreted, with and without a cycle",
    async () => {
      await fc.assert(
        fc.asyncProperty(chainSpecArb, async (spec) => {
          expect(await disagreementsOf(spec, "exact")).toEqual([]);
        }),
        propertyOptions,
      );
    },
    PROPERTY_TIMEOUT_MS,
  );
});

/**
 * The seed counterexample's graph with its tagged singleton made genuinely async: a collection
 * member that reads it synchronously meets it still pending on the first resolve and cached on
 * every later one.
 */
function pendingSingletonGraph(kind: "dynamic-async" | "resolved-async"): GraphSpec {
  const node = { token: 0, many: false, parentIs: undefined, hook: false, aliasTarget: 0 } as const;
  return {
    tokenCount: 1,
    nodes: [
      { ...node, kind: "class", scope: "transient", deps: [{ target: 0, mode: "single", tags: [2] }], slotTags: [] },
      { ...node, kind, scope: "singleton", deps: [], slotTags: [0] },
      { ...node, kind: "dynamic", scope: "transient", deps: [{ target: 0, mode: "single", tags: [0] }], slotTags: [1] },
      {
        ...node,
        kind: "dynamic-async",
        scope: "transient",
        deps: [{ target: 0, mode: "multi", tags: [0, 1] }],
        slotTags: [2],
      },
      { ...node, kind: "class", scope: "transient", deps: [], slotTags: [], parentIs: 0 },
    ],
  };
}

describe("a cold first async resolve is held to a cold reference, the warm lanes to a warm one", () => {
  it.each(["dynamic-async", "resolved-async"] as const)(
    "a %s singleton read synchronously by a later collection member refuses cold and answers warm",
    async (kind) => {
      const spec = pendingSingletonGraph(kind);
      const materials = prepareGraph(spec);
      const root = materials.tokens[0]!;
      const lanes = await asyncLanes(rootHost(spec, materials), root, () => rootHost(spec, materials));

      expect(lanes.get("async-cold")).toMatchObject({ error: "AsyncResolutionError" });
      expect(lanes.get("async#0")).toEqual(lanes.get("async-cold"));
      expect(isErrorSnapshot(lanes.get("async#1"))).toBe(false);
      expect(isErrorSnapshot(lanes.get("async-interpreted"))).toBe(false);
      expect(await disagreementsOf(spec, "exact")).toEqual([]);
    },
  );
});
