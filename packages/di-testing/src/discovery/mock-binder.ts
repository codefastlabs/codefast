/** Binds a unit's discovered dependencies onto a container as mocks — the sole container coupling. */

import type { BindingTag, Constructor, Container, DependencyKey, DependencySlot, InjectOptions } from "@codefast/di";
import { tokenName } from "@codefast/di";

import { OverrideMismatchError, UndeclaredDependencyError } from "#/errors/errors";
import type { DeepPartial } from "#/mocking/auto-mock";
import { createAutoMock } from "#/mocking/auto-mock";
import type { MockFactory } from "#/mocking/mock-factory";

/**
 * How one dependency is supplied instead of a plain auto-mock.
 */
export type MockOverride =
  | { readonly kind: "stub"; readonly seed: unknown }
  | { readonly kind: "value"; readonly value: unknown }
  | { readonly kind: "absent" }
  | { readonly kind: "all"; readonly values: ReadonlyArray<unknown> };

/**
 * Normalized slot criteria an override or a `mocks` lookup addresses one binding slot with.
 */
export interface SlotCriteria {
  readonly name: string | undefined;
  readonly tags: ReadonlyArray<BindingTag>;
}

/**
 * One override registration: how a dependency is supplied, and which slot it targets (none = every
 * slot of the token that has no more specific override).
 */
export interface SlottedOverride {
  readonly criteria: SlotCriteria | undefined;
  readonly override: MockOverride;
}

/**
 * One bound value `mocks` can look up: its slot criteria and whether it is sealed.
 *
 * @remarks Sealed entries came from `.using()`, `.absent()`, or `.all()` — they carry no mock
 * surface, so retrieving them as `Mocked` would lie.
 */
export interface BoundMock {
  readonly criteria: SlotCriteria | undefined;
  readonly value: unknown;
  readonly sealed: boolean;
}

/**
 * Folds an `InjectOptions` into slot criteria, or `undefined` when it names no criterion.
 */
export function normalizeCriteria(options: InjectOptions | undefined): SlotCriteria | undefined {
  if (options === undefined) {
    return undefined;
  }
  const tags = options.tag === undefined ? (options.tags ?? []) : [options.tag, ...(options.tags ?? [])];
  if (options.name === undefined && tags.length === 0) {
    return undefined;
  }
  return { name: options.name, tags };
}

/**
 * Returns whether two criteria address the same slot — equal name and the same tag set.
 */
export function criteriaEquals(left: SlotCriteria, right: SlotCriteria): boolean {
  return left.name === right.name && tagSetEquals(left.tags, right.tags);
}

/** Tag pairs are interned by di, so set equality is identity membership both ways. */
function tagSetEquals(left: ReadonlyArray<BindingTag>, right: ReadonlyArray<BindingTag>): boolean {
  return left.length === right.length && left.every((tag) => right.includes(tag));
}

/** Returns whether an override's criteria address exactly this slot. */
function matchesSlot(criteria: SlotCriteria, slot: DependencySlot): boolean {
  return criteria.name === slot.name && tagSetEquals(criteria.tags, slot.tags ?? []);
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

/**
 * Binds a mock for every discovered dependency and returns the entries `mocks` reads.
 *
 * @remarks One shared mock per token for slots without a specific override — duplicate tokens across
 * parameters share it — while an override carrying slot criteria supplies just its own slot. An
 * override that matches nothing is an {@link UndeclaredDependencyError}; `.absent()` on a required
 * slot or `.all()` on a non-`injectAll` slot is an {@link OverrideMismatchError}.
 */
export function bindMocks(
  container: Container,
  dependencies: ReadonlyArray<DependencySlot>,
  overrides: ReadonlyMap<DependencyKey, ReadonlyArray<SlottedOverride>>,
  mockFactory: MockFactory,
  exposed?: ReadonlySet<Constructor>,
): ReadonlyMap<DependencyKey, ReadonlyArray<BoundMock>> {
  const declared = new Set<DependencyKey>(dependencies.map((slot) => slot.token));
  for (const key of overrides.keys()) {
    if (exposed !== undefined && typeof key === "function" && exposed.has(key)) {
      throw new OverrideMismatchError(
        tokenName(key),
        "the class is exposed as a real collaborator, so it cannot also be mocked.",
      );
    }
    if (!declared.has(key)) {
      throw new UndeclaredDependencyError(tokenName(key));
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
    entries.push(entry);
  };

  for (const slot of dependencies) {
    const list = overrides.get(slot.token) ?? [];
    const override =
      list.find((candidate) => candidate.criteria !== undefined && matchesSlot(candidate.criteria, slot)) ??
      list.find((candidate) => candidate.criteria === undefined);
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
          record(slot.token, { criteria: override.criteria, value: undefined, sealed: true });
        }
        continue;
      }

      if (override.override.kind === "all") {
        if (!slot.multi || slot.name !== undefined || (slot.tags?.length ?? 0) > 0) {
          throw new OverrideMismatchError(
            tokenName(slot.token),
            ".all() supplies the elements of an unconstrained injectAll() slot — this slot is not one.",
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
              .whenNamed(`di-testing:all:${String(index)}`);
          }
          record(slot.token, { criteria: override.criteria, value: values, sealed: true });
        }
        continue;
      }
    }
    // absent/all slots continued above, so only the value/impl lanes reach here.
    const lane = override?.override as Extract<MockOverride, { kind: "value" | "stub" }> | undefined;

    // A slotted override owns its own value; the token-level lane is shared across plain slots.
    let value: unknown;
    if (override !== undefined && override.criteria !== undefined) {
      if (!overrideValues.has(override)) {
        overrideValues.set(override, buildMock(lane, mockFactory));
        record(slot.token, {
          criteria: override.criteria,
          value: overrideValues.get(override),
          sealed: lane?.kind === "value",
        });
      }
      value = overrideValues.get(override);
    } else {
      if (!sharedValues.has(slot.token)) {
        sharedValues.set(slot.token, buildMock(lane, mockFactory));
        record(slot.token, {
          criteria: undefined,
          value: sharedValues.get(slot.token),
          sealed: lane?.kind === "value",
        });
      }
      value = sharedValues.get(slot.token);
    }

    const builder = container.bind(slot.token).toConstantValue(value);
    if (slot.name !== undefined) {
      builder.whenNamed(slot.name);
    }
    if (slot.tags !== undefined) {
      for (const tag of slot.tags) {
        builder.whenTagged(tag);
      }
    }
  }

  for (const [token, list] of overrides) {
    for (const override of list) {
      if (!consumed.has(override)) {
        throw new UndeclaredDependencyError(
          tokenName(token),
          override.criteria === undefined ? undefined : describeCriteria(override.criteria),
        );
      }
    }
  }

  return bound;
}

/** The value bound for one lane: an override's value, a seeded auto-mock, or a plain auto-mock. */
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
  return createAutoMock(mockFactory, override.seed as DeepPartial<unknown>);
}
