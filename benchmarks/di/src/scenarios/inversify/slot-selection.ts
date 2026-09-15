/**
 * InversifyJS 8 — the public slot-selection rows: a zero-valued tag, a name and a tag together,
 * `getAll()` over a tag, a tagged miss over a populated identifier, and a parent-owned tagged or
 * named binding read from a long-lived child.
 */
import "reflect-metadata";
import { Container } from "inversify";

import {
  SLOT_NAME_AND_TAG,
  SLOT_NAME_PARENT_OWNED,
  SLOT_RESOLVE_BATCH,
  SLOT_TAG_MISS_OPTIONAL,
  SLOT_TAG_PARENT_OWNED,
  SLOT_TAG_RESOLVE_ALL,
  SLOT_TAG_ZERO_VALUE,
  TAGGED_ENVS,
  TARGET_TAG_VALUE,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

interface TaggedService {
  readonly env: string;
}

interface NumberedService {
  readonly level: number;
}

// Hoisted like the codefast side, so the measured closures allocate alike.
const TARGET_TAG_GET = { tag: { key: "env", value: TARGET_TAG_VALUE } } as const;
const ZERO_TAG_GET = { tag: { key: "level", value: 0 } } as const;
const MISSING_TAG_GET = { optional: true, tag: { key: "env", value: "no-such-env" } } as const;
const PRESENT_TAG_OPTIONAL_GET = { optional: true, tag: { key: "env", value: TARGET_TAG_VALUE } } as const;
const NAMED_TAG_NAME = "primary";
const NAME_AND_TAG_GET = { name: NAMED_TAG_NAME, tag: { key: "env", value: TARGET_TAG_VALUE } } as const;
const NAMED_GET = { name: TARGET_TAG_VALUE } as const;

function bindTaggedSet(container: Container, identifier: symbol): void {
  for (const env of TAGGED_ENVS) {
    container.bind<TaggedService>(identifier).toConstantValue({ env }).whenTagged("env", env);
  }
}

function buildZeroValueScenario(): BenchScenario {
  const identifier = Symbol("bench-inv-slot-numbered-service");
  const container = new Container({ jitless: false });
  for (const level of [0, 1, 2, 3]) {
    container.bind<NumberedService>(identifier).toConstantValue({ level }).whenTagged("level", level);
  }
  container.get<NumberedService>(identifier, ZERO_TAG_GET);

  return {
    ...SLOT_TAG_ZERO_VALUE,
    what: "get(id, { tag: { key, value: 0 } }) — select by a tag whose value is zero",
    batch: SLOT_RESOLVE_BATCH,
    sanity: () => container.get<NumberedService>(identifier, ZERO_TAG_GET).level === 0,
    build: () =>
      batched(SLOT_RESOLVE_BATCH, () => {
        container.get(identifier, ZERO_TAG_GET);
      }),
  };
}

function buildNameAndTagScenario(): BenchScenario {
  const identifier = Symbol("bench-inv-slot-named-tagged-service");
  const container = new Container({ jitless: false });
  for (const env of TAGGED_ENVS) {
    container
      .bind<TaggedService>(identifier)
      .toConstantValue({ env })
      .when((constraints) => constraints.name === NAMED_TAG_NAME && constraints.tags.get("env") === env);
  }
  container.get<TaggedService>(identifier, NAME_AND_TAG_GET);

  return {
    ...SLOT_NAME_AND_TAG,
    what: "get(id, { name, tag }) — select by a name and a tag together through one when() predicate",
    batch: SLOT_RESOLVE_BATCH,
    sanity: () => container.get<TaggedService>(identifier, NAME_AND_TAG_GET).env === TARGET_TAG_VALUE,
    build: () =>
      batched(SLOT_RESOLVE_BATCH, () => {
        container.get(identifier, NAME_AND_TAG_GET);
      }),
  };
}

function buildResolveAllScenario(): BenchScenario {
  const identifier = Symbol("bench-inv-slot-tagged-service-all");
  const container = new Container({ jitless: false });
  bindTaggedSet(container, identifier);
  container.getAll<TaggedService>(identifier, TARGET_TAG_GET);

  return {
    ...SLOT_TAG_RESOLVE_ALL,
    what: "getAll(id, { tag }) — every binding on the identifier carrying the tag",
    batch: SLOT_RESOLVE_BATCH,
    sanity: () => {
      const all = container.getAll<TaggedService>(identifier, TARGET_TAG_GET);
      return all.length === 1 && all[0]?.env === TARGET_TAG_VALUE;
    },
    build: () =>
      batched(SLOT_RESOLVE_BATCH, () => {
        container.getAll(identifier, TARGET_TAG_GET);
      }),
  };
}

function buildMissOptionalScenario(): BenchScenario {
  const identifier = Symbol("bench-inv-slot-tagged-service-miss");
  const container = new Container({ jitless: false });
  bindTaggedSet(container, identifier);
  container.get<TaggedService>(identifier, MISSING_TAG_GET);

  return {
    ...SLOT_TAG_MISS_OPTIONAL,
    what: "get(id, { optional: true, tag }) that matches no binding — the failed lookup over a populated identifier",
    batch: SLOT_RESOLVE_BATCH,
    sanity: () =>
      container.get<TaggedService>(identifier, MISSING_TAG_GET) === undefined &&
      container.get<TaggedService>(identifier, PRESENT_TAG_OPTIONAL_GET)?.env === TARGET_TAG_VALUE,
    build: () =>
      batched(SLOT_RESOLVE_BATCH, () => {
        container.get(identifier, MISSING_TAG_GET);
      }),
  };
}

function buildTaggedParentOwnedScenario(): BenchScenario {
  const identifier = Symbol("bench-inv-slot-parent-tagged-service");
  const appContainer = new Container({ jitless: false });
  bindTaggedSet(appContainer, identifier);
  const longLivedChild = new Container({ jitless: false, parent: appContainer });
  longLivedChild.get<TaggedService>(identifier, TARGET_TAG_GET);

  return {
    ...SLOT_TAG_PARENT_OWNED,
    what: "get(id, { tag }) from a child for a tagged binding the parent owns",
    batch: SLOT_RESOLVE_BATCH,
    sanity: () =>
      !longLivedChild.isCurrentBound(identifier) &&
      longLivedChild.get<TaggedService>(identifier, TARGET_TAG_GET).env === TARGET_TAG_VALUE,
    build: () =>
      batched(SLOT_RESOLVE_BATCH, () => {
        longLivedChild.get(identifier, TARGET_TAG_GET);
      }),
  };
}

function buildNamedParentOwnedScenario(): BenchScenario {
  const identifier = Symbol("bench-inv-slot-parent-named-service");
  const appContainer = new Container({ jitless: false });
  for (const env of TAGGED_ENVS) {
    appContainer.bind<TaggedService>(identifier).toConstantValue({ env }).whenNamed(env);
  }
  const longLivedChild = new Container({ jitless: false, parent: appContainer });
  longLivedChild.get<TaggedService>(identifier, NAMED_GET);

  return {
    ...SLOT_NAME_PARENT_OWNED,
    what: "get(id, { name }) from a child for a named binding the parent owns",
    batch: SLOT_RESOLVE_BATCH,
    sanity: () =>
      !longLivedChild.isCurrentBound(identifier) &&
      longLivedChild.get<TaggedService>(identifier, NAMED_GET).env === TARGET_TAG_VALUE,
    build: () =>
      batched(SLOT_RESOLVE_BATCH, () => {
        longLivedChild.get(identifier, NAMED_GET);
      }),
  };
}

/**
 * Builds inversify's public slot-selection scenarios.
 *
 * @since 0.8.0
 */
export function buildInversifySlotSelectionScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildZeroValueScenario(),
    buildNameAndTagScenario(),
    buildResolveAllScenario(),
    buildMissOptionalScenario(),
    buildTaggedParentOwnedScenario(),
    buildNamedParentOwnedScenario(),
  ];
}
