/** The pluggable seam that decides which spy backend the auto-mocks are built from. */

import type { Spy } from "#/mocking/spy";
import { createSpy } from "#/mocking/spy";

/**
 * The loose callable an auto-mock materializes for each accessed property.
 *
 * @remarks Deliberately structural so any backend qualifies: the built-in {@link Spy}, a Vitest
 * `vi.fn()`, a `jest.fn()`, or a Sinon stub all satisfy it. The rich {@link Spy} surface is what a
 * consumer sees back through `Mocked` and the `.impl` authoring callback.
 */
export type MockFn = (...args: ReadonlyArray<unknown>) => unknown;

/**
 * Produces one spy. Defaults to the built-in zero-dependency spy; pass `() => vi.fn()` (or `jest.fn`,
 * `() => sinon.stub()`) to build the mocks from that backend instead.
 */
export type MockFactory = () => MockFn;

/**
 * The authoring view of the active factory handed to a `.impl` callback — one call yields one `Spy`.
 *
 * @remarks Its `mockReturnValue` / `mockImplementation` are the subset every supported backend shares,
 * so a stub reads the same whether the default spy or `vi.fn()` is in use.
 */
export type StubFactory = () => Spy;

/**
 * The default `MockFactory` — one built-in {@link Spy} per call, with no test-framework dependency.
 */
export const defaultMockFactory: MockFactory = () => createSpy();
