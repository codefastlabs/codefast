/**
 * InversifyJS 8 — the criteria lanes measured from a fresh per-request child. Parallel to
 * `../codefast/fresh-child.ts`: the parent owns every binding, the child owns nothing, and the row
 * pays create, N resolves and `unbindAll()` per request.
 */
import "reflect-metadata";
import { Container } from "inversify";

import type { FreshChildLane } from "#/fixtures/scenario-parity";
import {
  FRESH_CHILD_BATCH,
  FRESH_CHILD_RESOLVES,
  freshChildDescriptor,
  TAGGED_ENVS,
  TARGET_TAG_VALUE,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

interface ChildService {
  readonly env: string;
}

interface Lane {
  readonly id: FreshChildLane;
  readonly bindInto: (parent: Container) => void;
  readonly resolveFrom: (child: Container) => ChildService;
}

const defaultLaneIdentifier = Symbol("bench-inv-fresh-child-default");
const namedLaneIdentifier = Symbol("bench-inv-fresh-child-named");
const taggedLaneIdentifier = Symbol("bench-inv-fresh-child-tagged");

const NAMED_GET = { name: TARGET_TAG_VALUE } as const;
const TAGGED_GET = { tag: { key: "env", value: TARGET_TAG_VALUE } } as const;

const LANES: ReadonlyArray<Lane> = [
  {
    id: "default",
    bindInto: (parent) => {
      parent.bind<ChildService>(defaultLaneIdentifier).toConstantValue({ env: TARGET_TAG_VALUE });
    },
    resolveFrom: (child) => child.get<ChildService>(defaultLaneIdentifier),
  },
  {
    id: "name",
    bindInto: (parent) => {
      for (const env of TAGGED_ENVS) {
        parent.bind<ChildService>(namedLaneIdentifier).toConstantValue({ env }).whenNamed(env);
      }
    },
    resolveFrom: (child) => child.get<ChildService>(namedLaneIdentifier, NAMED_GET),
  },
  {
    id: "tag",
    bindInto: (parent) => {
      for (const env of TAGGED_ENVS) {
        parent.bind<ChildService>(taggedLaneIdentifier).toConstantValue({ env }).whenTagged("env", env);
      }
    },
    resolveFrom: (child) => child.get<ChildService>(taggedLaneIdentifier, TAGGED_GET),
  },
];

function buildFreshChildScenario(lane: Lane, resolvesPerChild: number): BenchScenario {
  const parent = new Container({ jitless: false });
  lane.bindInto(parent);

  function runOneRequest(): ChildService {
    const child = new Container({ jitless: false, parent });
    let resolved = lane.resolveFrom(child);
    for (let index = 1; index < resolvesPerChild; index++) {
      resolved = lane.resolveFrom(child);
    }
    child.unbindAll();
    return resolved;
  }

  runOneRequest();

  return {
    ...freshChildDescriptor(lane.id, resolvesPerChild),
    batch: FRESH_CHILD_BATCH,
    sanity: () => {
      const child = new Container({ jitless: false, parent });
      const ownsNothing =
        !child.isCurrentBound(defaultLaneIdentifier) &&
        !child.isCurrentBound(namedLaneIdentifier) &&
        !child.isCurrentBound(taggedLaneIdentifier);
      child.unbindAll();
      return ownsNothing && runOneRequest().env === TARGET_TAG_VALUE;
    },
    build: () =>
      batched(FRESH_CHILD_BATCH, () => {
        runOneRequest();
      }),
  };
}

/**
 * Builds inversify's fresh-child scenarios.
 */
export function buildInversifyFreshChildScenarios(): ReadonlyArray<BenchScenario> {
  return LANES.flatMap((lane) => FRESH_CHILD_RESOLVES.map((count) => buildFreshChildScenario(lane, count)));
}
