/** Solitary and sociable auto-mocking test beds for `@codefast/di`. */

export { TestBed } from "#/test-bed/test-bed";
export type { TestBedStatic } from "#/test-bed/test-bed";
export type { MockOverrideBuilder, TestBedOptions } from "#/test-bed/bed-builder";
export type { SolitaryTestBedBuilder } from "#/test-bed/solitary-builder";
export type { SociableTestBedBuilder } from "#/test-bed/sociable-builder";
export type { SociableUnitTestBed, UnitReference, UnitTestBed } from "#/test-bed/unit-test-bed";

export { createAutoMock, MOCK_RESET } from "#/mocking/auto-mock";
export type { DeepPartial, Mocked } from "#/mocking/auto-mock";
export { defaultMockFactory } from "#/mocking/mock-factory";
export type { MockFactory, MockFn } from "#/mocking/mock-factory";
export { createSpy } from "#/mocking/spy";
export type { Spy, SpyResult, SpyState } from "#/mocking/spy";

export type { InjectionIdentifier } from "#/types";
export {
  NotInjectableError,
  OverrideMismatchError,
  SealedDependencyError,
  TestingError,
  UndeclaredDependencyError,
} from "#/errors/errors";
