/** Binds a unit's discovered dependencies onto a container as mocks — the sole container coupling. */

import type { Container, DependencyKey, DependencySlot } from "@codefast/di";
import { tokenName } from "@codefast/di";

import type { DiscoveredDependency } from "#/discovery/dependency-scanner";
import { UndeclaredDependencyError } from "#/errors/errors";
import type { DeepPartial } from "#/mocking/auto-mock";
import { createAutoMock } from "#/mocking/auto-mock";
import type { MockFactory } from "#/mocking/mock-factory";

/**
 * How one dependency is supplied instead of a plain auto-mock: a fixed value or a seeded partial stub.
 */
export type MockOverride =
  | { readonly kind: "value"; readonly value: unknown }
  | { readonly kind: "impl"; readonly seed: unknown };

/**
 * Binds a mock for every discovered dependency and returns the token-to-mock map `unitRef` reads.
 *
 * @remarks One mock per distinct token (duplicate tokens across parameters share it) but one binding
 * per distinct `(token, name, tags)` slot, so a named or tagged parameter still finds a match. An
 * override that names an undeclared dependency is a {@link UndeclaredDependencyError}.
 */
export function bindMocks(
  container: Container,
  dependencies: ReadonlyArray<DiscoveredDependency>,
  overrides: ReadonlyMap<DependencyKey, MockOverride>,
  mockFactory: MockFactory,
): ReadonlyMap<DependencyKey, unknown> {
  const declared = new Set<DependencyKey>(dependencies.map(({ slot }) => slot.token));
  for (const key of overrides.keys()) {
    if (!declared.has(key)) {
      throw new UndeclaredDependencyError(tokenName(key));
    }
  }

  const mocks = new Map<DependencyKey, unknown>();
  const boundSlots = new Map<DependencyKey, Set<string>>();

  for (const { slot } of dependencies) {
    const token = slot.token;
    if (!mocks.has(token)) {
      mocks.set(token, buildMock(overrides.get(token), mockFactory));
    }

    let seen = boundSlots.get(token);
    if (seen === undefined) {
      seen = new Set<string>();
      boundSlots.set(token, seen);
    }
    const signature = slotSignature(slot);
    if (seen.has(signature)) {
      continue;
    }
    seen.add(signature);

    const builder = container.bind(token).toConstantValue(mocks.get(token));
    if (slot.name !== undefined) {
      builder.whenNamed(slot.name);
    }
    if (slot.tags !== undefined) {
      for (const tag of slot.tags) {
        builder.whenTagged(tag);
      }
    }
  }

  return mocks;
}

/** The value bound for one token: an override's value, a seeded auto-mock, or a plain auto-mock. */
function buildMock(override: MockOverride | undefined, mockFactory: MockFactory): unknown {
  if (override === undefined) {
    return createAutoMock(mockFactory);
  }
  if (override.kind === "value") {
    return override.value;
  }
  return createAutoMock(mockFactory, override.seed as DeepPartial<unknown>);
}

/** A stable key for a slot's constraint, so an identical `(name, tags)` binds only once. */
function slotSignature(slot: DependencySlot): string {
  const tags = (slot.tags ?? [])
    .map((tag) => `${String(tag.mask)}=${String(tag.value)}`)
    .sort()
    .join(",");
  return `${slot.name ?? ""}|${tags}`;
}
