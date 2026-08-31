/** The compiled result of a solitary test bed: the real unit plus handles to its mocks. */

import type { Constructor, Container, DependencyKey, InjectOptions, TokenValue } from "@codefast/di";
import { tokenName } from "@codefast/di";

import type { BoundMock } from "#/discovery/mock-binder";
import { criteriaEquals, normalizeCriteria } from "#/discovery/mock-binder";
import { SealedDependencyError, UndeclaredDependencyError } from "#/errors/errors";
import type { Mocked } from "#/mocking/auto-mock";
import { MOCK_RESET } from "#/mocking/auto-mock";
import type { MockFn } from "#/mocking/mock-factory";
import type { Spy } from "#/mocking/spy";

/**
 * A lookup from a dependency's token or class to the mock the unit was built with.
 *
 * @typeParam Backend - The spy type the bed's mock factory produces.
 */
export interface UnitReference<Backend extends MockFn = Spy> {
  /**
   * Retrieves the mock bound for one of the unit's dependencies, typed to that dependency's value.
   *
   * @remarks Pass `options` (a name or tags) to address a slot that carries its own override. Only
   * auto-mocks and `.impl` stubs come back — a value supplied with `.using()`, `.absent()`, or
   * `.all()` is sealed, because it has no mock surface for the `Mocked` type to describe.
   *
   * @throws UndeclaredDependencyError When the identifier or slot is not one of the unit's dependencies.
   * @throws SealedDependencyError When the dependency was supplied as a sealed value.
   */
  get<Identifier extends DependencyKey>(
    identifier: Identifier,
    options?: InjectOptions,
  ): Mocked<TokenValue<Identifier>, Backend>;
}

/**
 * A compiled unit: the real class under test, plus a handle to every mock it received.
 *
 * @remarks Implements `AsyncDisposable`, so `await using bed = TestBed.solitary(X).compile()` runs
 * the unit's `@preDestroy` hooks and disposes the backing container at the end of the block.
 *
 * @typeParam Class - The class under test.
 * @typeParam Backend - The spy type the bed's mock factory produces.
 */
export interface UnitTestBed<Class, Backend extends MockFn = Spy> extends AsyncDisposable {
  readonly unit: Class;
  readonly unitRef: UnitReference<Backend>;
  /** Clears the call history and configured behaviour of every auto-mock the bed created. */
  reset(): void;
  /** Runs the unit's `@preDestroy` hooks and disposes the backing container. */
  dispose(): Promise<void>;
}

/**
 * A sociable bed: the solitary surface plus access to the real collaborators it exposed.
 *
 * @typeParam Class - The class under test.
 * @typeParam Backend - The spy type the bed's mock factory produces.
 */
export interface SociableUnitTestBed<Class, Backend extends MockFn = Spy> extends UnitTestBed<Class, Backend> {
  /**
   * The real instance of an exposed collaborator — the one the unit was actually built with.
   *
   * @throws UndeclaredDependencyError When the class was not exposed.
   */
  exposed<Real>(target: Constructor<Real>): Real;
}

/**
 * Wraps a compiled bed with access to its exposed real collaborators.
 */
export function createSociableUnitTestBed<Class, Backend extends MockFn = Spy>(
  bed: UnitTestBed<Class, Backend>,
  container: Container,
  exposedClasses: ReadonlySet<Constructor>,
): SociableUnitTestBed<Class, Backend> {
  return {
    ...bed,
    [Symbol.asyncDispose]: bed[Symbol.asyncDispose],
    exposed<Real>(target: Constructor<Real>): Real {
      if (!exposedClasses.has(target)) {
        throw new UndeclaredDependencyError(tokenName(target), "not exposed");
      }
      // Exposed classes are singletons the unit's construction already instantiated.
      return container.resolve(target);
    },
  };
}

/**
 * Assembles a {@link UnitTestBed} around an instantiated unit and its bound mocks.
 */
export function createUnitTestBed<Class, Backend extends MockFn = Spy>(
  unit: Class,
  mocks: ReadonlyMap<DependencyKey, ReadonlyArray<BoundMock>>,
  container: Container,
): UnitTestBed<Class, Backend> {
  const unitRef: UnitReference<Backend> = {
    get<Identifier extends DependencyKey>(
      identifier: Identifier,
      options?: InjectOptions,
    ): Mocked<TokenValue<Identifier>, Backend> {
      const entries = mocks.get(identifier);
      if (entries === undefined) {
        throw new UndeclaredDependencyError(tokenName(identifier));
      }
      const criteria = normalizeCriteria(options);
      const entry =
        criteria === undefined
          ? (entries.find((candidate) => candidate.criteria === undefined) ??
            (entries.length === 1 ? entries[0] : undefined))
          : entries.find(
              (candidate) => candidate.criteria !== undefined && criteriaEquals(candidate.criteria, criteria),
            );
      if (entry === undefined) {
        throw new UndeclaredDependencyError(tokenName(identifier), "the requested slot");
      }
      if (entry.sealed) {
        throw new SealedDependencyError(tokenName(identifier));
      }
      return entry.value as Mocked<TokenValue<Identifier>, Backend>;
    },
  };

  const reset = (): void => {
    for (const entries of mocks.values()) {
      for (const entry of entries) {
        if (!entry.sealed) {
          (entry.value as { [MOCK_RESET]?: () => void })[MOCK_RESET]?.();
        }
      }
    }
  };

  const dispose = async (): Promise<void> => {
    await container.dispose();
  };

  return {
    unit,
    unitRef,
    reset,
    dispose,
    [Symbol.asyncDispose]: dispose,
  };
}
