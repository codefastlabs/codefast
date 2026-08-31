/** The entry point for building isolated units under test. */

import type { Constructor } from "@codefast/di";

import { SolitaryBuilder } from "#/test-bed/solitary-builder";
import type { SolitaryTestBedBuilder, TestBedOptions } from "#/test-bed/solitary-builder";

/**
 * The factory surface for building isolated units under test.
 */
export interface TestBedStatic {
  /** Begins a solitary test bed for `target`, auto-mocking every dependency it declares. */
  solitary<Class>(target: Constructor<Class>, options?: TestBedOptions): SolitaryTestBedBuilder<Class>;
}

/**
 * Entry point for auto-mocking a class in isolation from its collaborators.
 *
 * @remarks `solitary` records the target and options only; nothing is instantiated until `compile()`.
 */
export const TestBed: TestBedStatic = {
  solitary<Class>(target: Constructor<Class>, options?: TestBedOptions): SolitaryTestBedBuilder<Class> {
    return new SolitaryBuilder<Class>(target, options);
  },
};
