/// <reference lib="esnext.disposable" />

/** The compiled result of a test bed: the real unit plus handles to its mocks. */

import type { Constructor, Container, DependencyKey, InjectOptions, TokenValue } from "@codefast/di";
import { tokenName } from "@codefast/di";

import type { BoundMock } from "#/discovery/mock-binder";
import { criteriaEquals, normalizeCriteria } from "#/discovery/mock-binder";
import { ExposureError, SealedDependencyError, UndeclaredDependencyError } from "#/errors/errors";
import type { Mocked } from "#/mocking/auto-mock";
import { MOCK_RESET } from "#/mocking/auto-mock";
import type { MockFunction } from "#/mocking/mock-factory";
import type { Spy } from "#/mocking/spy";

/**
 * A lookup from a dependency's token or class to the mock the unit was built with.
 *
 * @typeParam Backend - The spy type the bed's mock factory produces.
 *
 * @since 0.1.0
 */
export interface UnitReference<Backend extends MockFunction = Spy> {
  /**
   * Retrieves the mock bound for one of the unit's dependencies, typed to that dependency's value.
   *
   * @remarks Pass `options` (a name or tags) to address one slot of a token injected several ways.
   * Only auto-mocks and `.stub` seeds come back — a value supplied with `.using()`, `.absent()`, or
   * `.usingAll()` is sealed, and an exposed class is real, so neither has a mock surface for the
   * `Mocked` type to describe.
   *
   * @throws UndeclaredDependencyError When the identifier or slot is not one of the unit's dependencies.
   * @throws SealedDependencyError When the dependency was supplied as a sealed value or exposed.
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
 *
 * @since 0.1.0
 */
export interface UnitTestBed<Class, Backend extends MockFunction = Spy> extends AsyncDisposable {
  readonly unit: Class;
  readonly mocks: UnitReference<Backend>;
  /** Clears the call history and configured behaviour of every auto-mock and stub the bed created. */
  resetMocks(this: void): void;
  /** Runs the unit's `@preDestroy` hooks and disposes the backing container. */
  dispose(this: void): Promise<void>;
}

/**
 * A sociable bed: the solitary surface plus access to the real collaborators it exposed.
 *
 * @typeParam Class - The class under test.
 * @typeParam Backend - The spy type the bed's mock factory produces.
 *
 * @since 0.1.0
 */
export interface SociableUnitTestBed<Class, Backend extends MockFunction = Spy> extends UnitTestBed<Class, Backend> {
  /**
   * Returns the real instance of an exposed collaborator — the one the unit was actually built with.
   *
   * @throws ExposureError When the class was not exposed.
   */
  exposed<Real>(target: Constructor<Real>): Real;
}

/**
 * Wraps a compiled bed with access to its exposed real collaborators.
 *
 * @since 0.1.0
 */
export function createSociableUnitTestBed<Class, Backend extends MockFunction = Spy>(
  bed: UnitTestBed<Class, Backend>,
  container: Container,
  exposedClasses: ReadonlySet<Constructor>,
): SociableUnitTestBed<Class, Backend> {
  // Copied member by member, so a future bed with accessor or prototype members cannot be dropped
  // silently by a spread.
  return {
    unit: bed.unit,
    mocks: bed.mocks,
    resetMocks: bed.resetMocks,
    dispose: bed.dispose,
    [Symbol.asyncDispose]: bed[Symbol.asyncDispose],
    exposed<Real>(target: Constructor<Real>): Real {
      if (!exposedClasses.has(target)) {
        throw new ExposureError(target.name, "the class was not exposed. Add .expose(Class) before compile().");
      }
      // Exposed classes are singletons the unit's construction already instantiated.
      return container.resolve(target);
    },
  };
}

/**
 * Assembles a {@link UnitTestBed} around an instantiated unit and its bound mock entries.
 *
 * @since 0.1.0
 */
export function createUnitTestBed<Class, Backend extends MockFunction = Spy>(
  unit: Class,
  entries: ReadonlyMap<DependencyKey, ReadonlyArray<BoundMock>>,
  container: Container,
): UnitTestBed<Class, Backend> {
  const mocks: UnitReference<Backend> = {
    get<Identifier extends DependencyKey>(
      identifier: Identifier,
      options?: InjectOptions,
    ): Mocked<TokenValue<Identifier>, Backend> {
      const bound = entries.get(identifier);
      if (bound === undefined) {
        throw new UndeclaredDependencyError(tokenName(identifier));
      }
      const criteria = normalizeCriteria(options);
      const entry =
        criteria === undefined
          ? (bound.find((candidate) => candidate.criteria === undefined) ?? (bound.length === 1 ? bound[0] : undefined))
          : bound.find((candidate) => candidate.criteria !== undefined && criteriaEquals(candidate.criteria, criteria));
      if (entry === undefined) {
        throw new UndeclaredDependencyError(tokenName(identifier), "no such slot");
      }
      if (entry.kind !== "auto" && entry.kind !== "stub") {
        throw new SealedDependencyError(tokenName(identifier), entry.kind);
      }
      return entry.value as Mocked<TokenValue<Identifier>, Backend>;
    },
  };

  const resetMocks = (): void => {
    for (const bound of entries.values()) {
      for (const entry of bound) {
        if (entry.kind === "auto" || entry.kind === "stub") {
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
    mocks,
    resetMocks,
    dispose,
    [Symbol.asyncDispose]: dispose,
  };
}
