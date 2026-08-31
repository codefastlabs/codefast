/** The entry point for building isolated units under test. */

import type { Constructor } from "@codefast/di";

import type { MockFn } from "#/mocking/mock-factory";
import type { Spy } from "#/mocking/spy";
import type { TestBedOptions } from "#/test-bed/bed-builder";
import { SociableBuilder } from "#/test-bed/sociable-builder";
import type { SociableTestBedBuilder } from "#/test-bed/sociable-builder";
import { SolitaryBuilder } from "#/test-bed/solitary-builder";
import type { SolitaryTestBedBuilder } from "#/test-bed/solitary-builder";

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

  /**
   * Begins a sociable test bed for `target`: chosen class collaborators stay real, tokens stay mocked.
   *
   * @remarks Returns only `expose` — a sociable bed without at least one exposed collaborator is a
   * solitary bed, so the type steers the first call.
   */
  sociable<Class, Backend extends MockFn = Spy>(
    target: Constructor<Class>,
    options?: TestBedOptions<Backend>,
  ): Pick<SociableTestBedBuilder<Class, Backend>, "expose">;
}

/**
 * Entry point for auto-mocking a class in isolation from its collaborators.
 *
 * @remarks `solitary` and `sociable` record the target and options only; nothing is instantiated
 * until `compile()`.
 */
export const TestBed: TestBedStatic = {
  solitary<Class, Backend extends MockFn = Spy>(
    target: Constructor<Class>,
    options?: TestBedOptions<Backend>,
  ): SolitaryTestBedBuilder<Class, Backend> {
    return new SolitaryBuilder<Class, Backend>(target, options);
  },
  sociable<Class, Backend extends MockFn = Spy>(
    target: Constructor<Class>,
    options?: TestBedOptions<Backend>,
  ): Pick<SociableTestBedBuilder<Class, Backend>, "expose"> {
    return new SociableBuilder<Class, Backend>(target, options);
  },
};
