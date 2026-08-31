/** Binds a unit's discovered dependencies onto a container as mocks — the sole container coupling. */

import type { Container, DependencyKey, DependencySlot } from "@codefast/di";
import { tokenName } from "@codefast/di";

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
 * @remarks One mock per distinct token — duplicate tokens across parameters share it — and one
 * constant binding per slot: the registry's slot-aware last-wins folds identical slots into one,
 * while a named or tagged slot keeps its own binding so its request still matches. An override that
 * names an undeclared dependency is an {@link UndeclaredDependencyError}.
 */
export function bindMocks(
  container: Container,
  dependencies: ReadonlyArray<DependencySlot>,
  overrides: ReadonlyMap<DependencyKey, MockOverride>,
  mockFactory: MockFactory,
): ReadonlyMap<DependencyKey, unknown> {
  const declared = new Set<DependencyKey>(dependencies.map((slot) => slot.token));
  for (const key of overrides.keys()) {
    if (!declared.has(key)) {
      throw new UndeclaredDependencyError(tokenName(key));
    }
  }

  const mocks = new Map<DependencyKey, unknown>();

  for (const slot of dependencies) {
    if (!mocks.has(slot.token)) {
      mocks.set(slot.token, buildMock(overrides.get(slot.token), mockFactory));
    }

    const builder = container.bind(slot.token).toConstantValue(mocks.get(slot.token));
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
