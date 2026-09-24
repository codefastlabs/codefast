/** The entry points for building isolated units under test. */

import type { Constructor } from "@codefast/di";

import { MissingMockFactoryError } from "#errors/errors";
import type { MockFunction } from "#mocking/mock-factory";
import { defaultMockFactory } from "#mocking/mock-factory";
import type { Spy } from "#mocking/spy";
import type { TestBedOptions } from "#test-bed/bed-builder";
import { SociableBuilder } from "#test-bed/sociable-builder";
import type { SociableTestBedBuilder } from "#test-bed/sociable-builder";
import { SolitaryBuilder } from "#test-bed/solitary-builder";
import type { SolitaryTestBedBuilder } from "#test-bed/solitary-builder";

/**
 * Begins test beds for classes under test, every one of them mocked with the same backend.
 *
 * @typeParam Backend - The spy type every bed's mocks are built with, fixed when the entry point is created.
 *
 * @since 0.1.0
 */
export interface TestBedStatic<Backend extends MockFunction> {
  /**
   * Begins a solitary test bed for `target`, auto-mocking every dependency it declares.
   */
  solitary<Class>(target: Constructor<Class>): SolitaryTestBedBuilder<Class, Backend>;

  /**
   * Begins a sociable test bed for `target`: chosen class collaborators stay real, tokens stay mocked.
   *
   * @remarks Returns only `expose` — a sociable bed without at least one exposed collaborator is a
   * solitary bed, so the type steers the first call.
   */
  sociable<Class>(target: Constructor<Class>): Pick<SociableTestBedBuilder<Class, Backend>, "expose">;
}

/**
 * Creates the test-bed entry point for one mock backend, so a suite states its backend once.
 *
 * @remarks The factory's return type becomes `Backend` and types every mock the beds hand out —
 * `createTestBed({ mockFactory: () => vi.fn() })` gives `mocks.get(X).method` Vitest's own mock
 * surface. A bed can have no other backend than the entry point it was begun from.
 *
 * @throws MissingMockFactoryError When no factory is passed, which only a caller past the types can do.
 */
export function createTestBed<Backend extends MockFunction>(options: TestBedOptions<Backend>): TestBedStatic<Backend> {
  // Read once, so a later write to the caller's object cannot change the beds already begun.
  const { mockFactory, metadataReader } = options;
  if (typeof mockFactory !== "function") {
    throw new MissingMockFactoryError();
  }
  const resolved: TestBedOptions<Backend> = { mockFactory, metadataReader };
  return {
    solitary: <Class>(target: Constructor<Class>) => new SolitaryBuilder<Class, Backend>(target, resolved),
    sociable: <Class>(target: Constructor<Class>) => new SociableBuilder<Class, Backend>(target, resolved),
  };
}

/**
 * The test-bed entry point on the built-in spy, the backend with no test-framework dependency.
 *
 * @remarks `solitary` and `sociable` record the target only; nothing is instantiated until
 * `compile()`. A suite on another backend creates its own with `createTestBed`.
 *
 * @since 0.1.0
 */
export const TestBed: TestBedStatic<Spy> = createTestBed({ mockFactory: defaultMockFactory });
