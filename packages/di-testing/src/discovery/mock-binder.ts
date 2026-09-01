/** Binds a unit's discovered dependencies onto a container as mocks — the sole container coupling. */

import type { BindingTag, Constructor, Container, DependencyKey, DependencySlot, InjectOptions } from "@codefast/di";
import { slotName, tokenName } from "@codefast/di";

import { OverrideMismatchError, UndeclaredDependencyError } from "#/errors/errors";
import type { DeepPartial } from "#/mocking/auto-mock";
import { createAutoMock } from "#/mocking/auto-mock";
import type { MockFactory } from "#/mocking/mock-factory";

/**
 * How one dependency is supplied instead of a plain auto-mock.
 *
 * @remarks A stub's `setup` runs once per compile, so two beds built from one builder never share
 * seeded spies.
 *
 * @since 0.1.0
 */
export type MockOverride =
  | { readonly kind: "stub"; readonly setup: (mock: MockFactory) => unknown }
  | { readonly kind: "value"; readonly value: unknown }
  | { readonly kind: "absent" }
  | { readonly kind: "all"; readonly values: ReadonlyArray<unknown> };

/**
 * Normalized slot criteria an override or a `mocks.get` lookup addresses one binding slot with.
 *
 * @since 0.1.0
 */
export interface SlotCriteria {
  readonly name: string | undefined;
  readonly tags: ReadonlyArray<BindingTag>;
}

/**
 * One override registration: how a dependency is supplied, and which slot it targets (none = every
 * slot of the token that has no more specific override).
 *
 * @since 0.1.0
 */
export interface SlottedOverride {
  readonly criteria: SlotCriteria | undefined;
  readonly override: MockOverride;
}

/**
 * What one bound entry was supplied with — only `auto` and `stub` entries carry a mock surface.
 *
 * @since 0.1.0
 */
export type BoundMockKind = "auto" | "stub" | "value" | "absent" | "all" | "exposed";

/**
 * One bound value `mocks` can look up: its slot criteria, the value, and how it was supplied.
 *
 * @since 0.1.0
 */
export interface BoundMock {
  readonly criteria: SlotCriteria | undefined;
  readonly value: unknown;
  readonly kind: BoundMockKind;
}

/** The name prefix `usingAll` elements are bound under, so identical constants keep distinct slots. */
const ALL_ELEMENT_SLOT_PREFIX = "di-testing:all:";

/**
 * One name and plain tag set, with di's reserved criterion folded into the name.
 *
 * @remarks di treats `{name: "x"}` and `{tag: slotName.of("x")}` as one slot, so addressing here
 * must too — mirroring `bindingSlotToResolveOptions` in di.
 */
function foldReservedName(
  name: string | undefined,
  tags: ReadonlyArray<BindingTag>,
): { name: string | undefined; tags: ReadonlyArray<BindingTag> } {
  const reserved = tags.find((tag) => tag.key === slotName);
  if (reserved === undefined) {
    return { name, tags };
  }
  return { name: name ?? (reserved.value as string), tags: tags.filter((tag) => tag.key !== slotName) };
}

/**
 * Folds an `InjectOptions` into slot criteria, or `undefined` when it names no criterion.
 *
 * @remarks Tags are copied and deduplicated by identity — di interns each `(key, value)` pair, so a
 * repeated pair is the same object. A reserved `slotName` criterion folds into `name`, so both
 * spellings address one slot.
 *
 * @since 0.1.0
 */
export function normalizeCriteria(options: InjectOptions | undefined): SlotCriteria | undefined {
  if (options === undefined) {
    return undefined;
  }
  const merged = options.tag === undefined ? (options.tags ?? []) : [options.tag, ...(options.tags ?? [])];
  const { name, tags } = foldReservedName(options.name, [...new Set(merged)]);
  if (name === undefined && tags.length === 0) {
    return undefined;
  }
  return { name, tags };
}

/**
 * Returns whether two criteria address the same slot — equal name and the same tag set.
 *
 * @since 0.1.0
 */
export function criteriaEquals(left: SlotCriteria, right: SlotCriteria): boolean {
  return left.name === right.name && tagSetEquals(left.tags, right.tags);
}

/** Tag pairs are interned by di, so tag lists compare as identity sets, duplicates collapsed. */
function tagSetEquals(left: ReadonlyArray<BindingTag>, right: ReadonlyArray<BindingTag>): boolean {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  if (leftSet.size !== rightSet.size) {
    return false;
  }
  for (const tag of leftSet) {
    if (!rightSet.has(tag)) {
      return false;
    }
  }
  return true;
}

/** Returns the slot's own criteria, or `undefined` for an unconstrained slot. */
function criteriaOfSlot(slot: DependencySlot): SlotCriteria | undefined {
  const { name, tags } = foldReservedName(slot.name, slot.tags ?? []);
  if (name === undefined && tags.length === 0) {
    return undefined;
  }
  return { name, tags };
}

/** Returns whether an override's criteria address exactly this slot. */
function matchesSlot(criteria: SlotCriteria, slot: DependencySlot): boolean {
  const folded = foldReservedName(slot.name, slot.tags ?? []);
  return criteria.name === folded.name && tagSetEquals(criteria.tags, folded.tags);
}

/** A readable rendering of criteria for error messages. */
function describeCriteria(criteria: SlotCriteria): string {
  const parts: Array<string> = [];
  if (criteria.name !== undefined) {
    parts.push(`name "${criteria.name}"`);
  }
  if (criteria.tags.length > 0) {
    parts.push(`${String(criteria.tags.length)} tag(s)`);
  }
  return `slot with ${parts.join(" and ")}`;
}

/** Whether a slot can take a `usingAll` override — an unconstrained `injectAll` collects in order. */
function acceptsAll(slot: DependencySlot): boolean {
  return slot.multi && slot.name === undefined && (slot.tags?.length ?? 0) === 0;
}

/**
 * Binds a mock for every discovered dependency and returns the entries `mocks` reads.
 *
 * @remarks One shared mock per token for slots without a specific override — duplicate tokens across
 * parameters share it — while an override carrying slot criteria supplies just its own slot; every
 * constrained slot is also recorded under its own criteria so `mocks.get(token, options)` resolves.
 * An override that matches nothing is an {@link UndeclaredDependencyError}; `.absent()` on a
 * required slot or `.usingAll()` with no unconstrained `injectAll()` slot is an
 * {@link OverrideMismatchError}.
 *
 * @since 0.1.0
 */
export function bindMocks(
  container: Container,
  dependencies: ReadonlyArray<DependencySlot>,
  overrides: ReadonlyMap<DependencyKey, ReadonlyArray<SlottedOverride>>,
  mockFactory: MockFactory,
  exposed?: ReadonlySet<Constructor>,
): ReadonlyMap<DependencyKey, ReadonlyArray<BoundMock>> {
  if (exposed !== undefined) {
    for (const key of overrides.keys()) {
      if (typeof key === "function" && exposed.has(key)) {
        throw new OverrideMismatchError(
          tokenName(key),
          "the class is exposed as a real collaborator, so it cannot also be mocked.",
        );
      }
    }
  }

  const bound = new Map<DependencyKey, Array<BoundMock>>();
  const consumed = new Set<SlottedOverride>();
  // One value per token-level lane and per slotted override, shared across duplicate slots.
  const sharedValues = new Map<DependencyKey, unknown>();
  const overrideValues = new Map<SlottedOverride, unknown>();

  const record = (token: DependencyKey, entry: BoundMock): void => {
    let entries = bound.get(token);
    if (entries === undefined) {
      entries = [];
      bound.set(token, entries);
    }
    // One entry per distinct slot criteria; duplicate slots share the first recording.
    const duplicate = entries.some((candidate) =>
      candidate.criteria === undefined || entry.criteria === undefined
        ? candidate.criteria === entry.criteria
        : criteriaEquals(candidate.criteria, entry.criteria),
    );
    if (!duplicate) {
      entries.push(entry);
    }
  };

  const bindConstant = (slot: DependencySlot, value: unknown): void => {
    const builder = container.bind(slot.token).toConstantValue(value);
    if (slot.name !== undefined) {
      builder.whenNamed(slot.name);
    }
    if (slot.tags !== undefined) {
      for (const tag of slot.tags) {
        builder.whenTagged(tag);
      }
    }
  };

  for (const slot of dependencies) {
    const list = overrides.get(slot.token) ?? [];
    // A slotless `usingAll` applies only to the slots that can take it; other slots fall through.
    const override =
      list.find((candidate) => candidate.criteria !== undefined && matchesSlot(candidate.criteria, slot)) ??
      list.find(
        (candidate) => candidate.criteria === undefined && (candidate.override.kind !== "all" || acceptsAll(slot)),
      );

    if (override !== undefined) {
      consumed.add(override);

      if (override.override.kind === "absent") {
        if (!slot.optional && !slot.multi) {
          throw new OverrideMismatchError(
            tokenName(slot.token),
            ".absent() targets a required dependency — only optional() or injectAll() slots can be absent.",
          );
        }
        if (!overrideValues.has(override)) {
          overrideValues.set(override, undefined);
        }
        record(slot.token, { criteria: override.criteria, value: undefined, kind: "absent" });
        continue;
      }

      if (override.override.kind === "all") {
        if (!acceptsAll(slot)) {
          throw new OverrideMismatchError(
            tokenName(slot.token),
            ".usingAll() supplies the elements of an unconstrained injectAll() slot — this slot is not one.",
          );
        }
        if (!overrideValues.has(override)) {
          const values = override.override.values;
          overrideValues.set(override, values);
          // Every element gets its own named slot: identical slots displace each other, and even a
          // default-slot first element would be displaced-then-restored out of order by the second.
          // An unconstrained resolveAll ignores slots and collects every binding in order.
          for (const [index, value] of values.entries()) {
            container
              .bind(slot.token)
              .toConstantValue(value)
              .whenNamed(`${ALL_ELEMENT_SLOT_PREFIX}${String(index)}`);
          }
          record(slot.token, { criteria: override.criteria, value: values, kind: "all" });
        }
        continue;
      }
    }

    // A slotted override owns its own value; the token-level lane is shared across plain slots.
    const lane = override?.override as Extract<MockOverride, { kind: "value" | "stub" }> | undefined;
    const kind: BoundMockKind = lane === undefined ? "auto" : lane.kind;
    let value: unknown;
    if (override !== undefined && override.criteria !== undefined) {
      if (!overrideValues.has(override)) {
        overrideValues.set(override, buildMock(lane, mockFactory));
      }
      value = overrideValues.get(override);
      record(slot.token, { criteria: override.criteria, value, kind });
    } else {
      if (!sharedValues.has(slot.token)) {
        sharedValues.set(slot.token, buildMock(lane, mockFactory));
        record(slot.token, { criteria: undefined, value: sharedValues.get(slot.token), kind });
      }
      value = sharedValues.get(slot.token);
      // A constrained slot on the shared lane is also addressable by its own criteria.
      const slotCriteria = criteriaOfSlot(slot);
      if (slotCriteria !== undefined) {
        record(slot.token, { criteria: slotCriteria, value, kind });
      }
    }

    bindConstant(slot, value);
  }

  for (const [token, list] of overrides) {
    for (const override of list) {
      if (!consumed.has(override)) {
        throw new UndeclaredDependencyError(
          tokenName(token),
          override.criteria === undefined
            ? override.override.kind === "all"
              ? "no unconstrained injectAll() slot"
              : undefined
            : describeCriteria(override.criteria),
        );
      }
    }
  }

  return bound;
}

/** Returns the value bound for one lane: an override's value, a seeded auto-mock, or a plain auto-mock. */
function buildMock(
  override: Extract<MockOverride, { kind: "value" | "stub" }> | undefined,
  mockFactory: MockFactory,
): unknown {
  if (override === undefined) {
    return createAutoMock(mockFactory);
  }
  if (override.kind === "value") {
    return override.value;
  }
  // The stub's seed is built here, once per compile, so beds never share seeded spies.
  return createAutoMock(mockFactory, override.setup(mockFactory) as DeepPartial<unknown>);
}
