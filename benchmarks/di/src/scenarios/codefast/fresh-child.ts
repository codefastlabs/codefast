/**
 * `@codefast/di` — the criteria lanes measured from a **fresh** child container.
 *
 * `slot-tag-parent-owned` and `slot-name-parent-owned` resolve from a child built once, so they read
 * a warm chain walk against a warm memo. A memo is not paid for there: it is paid for on the first
 * resolve inside a container that will not live to make a second. These rows are that container.
 *
 * Three lanes × two duty cycles, one 2×3 matrix:
 *
 *                       N=1 (memo paid, never reused)   N=4 (memo amortised)
 *   no options          fresh-child-default-n1          fresh-child-default-n4
 *   name only           fresh-child-name-n1             fresh-child-name-n4
 *   single tag          fresh-child-tag-n1              fresh-child-tag-n4
 *
 *   - down a column → which lane a per-request container should prefer at that duty cycle.
 *   - across a row  → what the lane's per-container state costs to build, since the create and
 *     teardown either side of it are identical in all six.
 *
 * Every row's parent owns the binding and the child owns nothing, so the resolve always walks the
 * chain; `sanity` asserts that rather than trusting the fixture.
 */
import { Container, token } from "@codefast/di";

import { ENV_TAG } from "#/fixtures/bench-tags";
import type { FreshChildLane as FreshChildLaneId } from "#/fixtures/scenario-parity";
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

interface FreshChildLane {
  readonly id: FreshChildLaneId;
  readonly bindInto: (parent: Container) => void;
  readonly resolveFrom: (child: Container) => ChildService;
}

const defaultLaneToken = token<ChildService>("bench-cf-fresh-child-default");
const namedLaneToken = token<ChildService>("bench-cf-fresh-child-named");
const taggedLaneToken = token<ChildService>("bench-cf-fresh-child-tagged");

/** Hoisted so the request allocates only its options object, as the parent-owned rows do. */
const HOISTED_TAGS = [ENV_TAG.of(TARGET_TAG_VALUE)];

const FRESH_CHILD_LANES: ReadonlyArray<FreshChildLane> = [
  {
    id: "default",
    bindInto: (parent) => {
      parent.bind(defaultLaneToken).toConstantValue({ env: TARGET_TAG_VALUE });
    },
    resolveFrom: (child) => child.resolve(defaultLaneToken),
  },
  {
    id: "name",
    bindInto: (parent) => {
      for (const env of TAGGED_ENVS) {
        parent.bind(namedLaneToken).toConstantValue({ env }).whenNamed(env);
      }
    },
    resolveFrom: (child) => child.resolve(namedLaneToken, { name: TARGET_TAG_VALUE }),
  },
  {
    id: "tag",
    bindInto: (parent) => {
      for (const env of TAGGED_ENVS) {
        parent.bind(taggedLaneToken).toConstantValue({ env }).whenTagged(ENV_TAG.of(env));
      }
    },
    resolveFrom: (child) => child.resolve(taggedLaneToken, { tags: HOISTED_TAGS }),
  },
];

function buildFreshChildScenario(lane: FreshChildLane, resolvesPerChild: number): BenchScenario {
  const parent = Container.create();
  lane.bindInto(parent);

  function runOneRequest(): ChildService {
    const child = parent.createChild();
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
      const child = parent.createChild();
      const ownsNothing =
        !child.hasOwn(defaultLaneToken) && !child.hasOwn(namedLaneToken) && !child.hasOwn(taggedLaneToken);

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
 * @since 0.6.0
 */
export function buildCodefastFreshChildScenarios(): ReadonlyArray<BenchScenario> {
  return FRESH_CHILD_LANES.flatMap((lane) =>
    FRESH_CHILD_RESOLVES.map((resolvesPerChild) => buildFreshChildScenario(lane, resolvesPerChild)),
  );
}
