/** The compiled result of a solitary test bed: the real unit plus handles to its mocks. */

import type { Container, DependencyKey, TokenValue } from "@codefast/di";
import { tokenName } from "@codefast/di";

import { UndeclaredDependencyError } from "#/errors/errors";
import type { Mocked } from "#/mocking/auto-mock";

/**
 * A lookup from a dependency's token or class to the mock the unit was built with.
 */
export interface UnitReference {
  /**
   * Retrieves the mock bound for one of the unit's dependencies, typed to that dependency's value.
   *
   * @remarks A dependency overridden with `.using()` comes back as the supplied value itself, which
   * carries no spy surface — the `Mocked` type describes auto-mocks and `.impl` stubs.
   *
   * @throws UndeclaredDependencyError When the identifier is not one of the unit's dependencies.
   */
  get<Identifier extends DependencyKey>(identifier: Identifier): Mocked<TokenValue<Identifier>>;
}

/**
 * A compiled unit: the real class under test, plus a handle to every mock it received.
 *
 * @remarks Implements `AsyncDisposable`, so `await using bed = TestBed.solitary(X).compile()` runs
 * the unit's `@preDestroy` hooks and disposes the backing container at the end of the block.
 *
 * @typeParam Class - The class under test.
 */
export interface UnitTestBed<Class> extends AsyncDisposable {
  readonly unit: Class;
  readonly unitRef: UnitReference;
  /** Runs the unit's `@preDestroy` hooks and disposes the backing container. */
  dispose(): Promise<void>;
}

/**
 * Assembles a {@link UnitTestBed} around an instantiated unit and its bound mocks.
 */
export function createUnitTestBed<Class>(
  unit: Class,
  mocks: ReadonlyMap<DependencyKey, unknown>,
  container: Container,
): UnitTestBed<Class> {
  const unitRef: UnitReference = {
    get<Identifier extends DependencyKey>(identifier: Identifier): Mocked<TokenValue<Identifier>> {
      if (!mocks.has(identifier)) {
        throw new UndeclaredDependencyError(tokenName(identifier));
      }
      return mocks.get(identifier) as Mocked<TokenValue<Identifier>>;
    },
  };

  const dispose = async (): Promise<void> => {
    await container.dispose();
  };

  return {
    unit,
    unitRef,
    dispose,
    [Symbol.asyncDispose]: dispose,
  };
}
