/** The entry point for building isolated units under test. */

import type { Constructor } from "@codefast/di";

import type { MockFn } from "#/mocking/mock-factory";
import type { Spy } from "#/mocking/spy";
import { SolitaryBuilder } from "#/test-bed/solitary-builder";
import type { SolitaryTestBedBuilder, TestBedOptions } from "#/test-bed/solitary-builder";

/**
 * The factory surface for building isolated units under test.
 */
export interface TestBedStatic {
  /**
   * Begins a solitary test bed for `target`, auto-mocking every dependency it declares.
   *
   * @remarks The mock factory's return type becomes `Backend` and types every mock the bed hands
   * out — pass `{ mockFactory: () => vi.fn() }` and `unitRef.get(X).method` carries Vitest's own
   * mock surface.
   */
  solitary<Class, Backend extends MockFn = Spy>(
    target: Constructor<Class>,
    options?: TestBedOptions<Backend>,
  ): SolitaryTestBedBuilder<Class, Backend>;
}

/**
 * Entry point for auto-mocking a class in isolation from its collaborators.
 *
 * @remarks `solitary` records the target and options only; nothing is instantiated until `compile()`.
 */
export const TestBed: TestBedStatic = {
  solitary<Class, Backend extends MockFn = Spy>(
    target: Constructor<Class>,
    options?: TestBedOptions<Backend>,
  ): SolitaryTestBedBuilder<Class, Backend> {
    return new SolitaryBuilder<Class, Backend>(target, options);
  },
};
