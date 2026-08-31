/** The pluggable seam that decides which spy backend the auto-mocks are built from. */

import type { Spy } from "#/mocking/spy";
import { createSpy } from "#/mocking/spy";

/**
 * The loose callable an auto-mock materializes for each accessed property.
 *
 * @remarks Deliberately structural so any backend qualifies: the built-in {@link Spy}, a Vitest
 * `vi.fn()`, a `jest.fn()`, or a Sinon stub all satisfy it.
 */
export type MockFn = (...args: ReadonlyArray<unknown>) => unknown;

/**
 * The factory each auto-mocked member is created by.
 *
 * @remarks Defaults to the built-in zero-dependency spy; `() => vi.fn()` or `jest.fn` slot in
 * directly. Auto-mocks only need the result to be callable, so `() => sinon.stub()` works too — but
 * see {@link StubFactory} for what `.impl` assumes.
 */
export type MockFactory = () => MockFn;

/**
 * The authoring view of the active factory handed to a `.impl` callback — one call yields one `Spy`.
 *
 * @remarks Typed for the built-in spy and the jest-shaped backends (`vi.fn`, `jest.fn`), which share
 * `mockReturnValue` / `mockImplementation`. A backend with its own authoring surface (a Sinon stub's
 * `returns` / `callsFake`) still works — call its methods on the returned value instead.
 */
export type StubFactory = () => Spy;

/**
 * The default `MockFactory` — one built-in {@link Spy} per call, with no test-framework dependency.
 */
export const defaultMockFactory: MockFactory = () => createSpy();
