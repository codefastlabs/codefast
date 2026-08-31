/** The pluggable seam that decides which spy backend the auto-mocks are built from. */

import type { Spy } from "#/mocking/spy";
import { createSpy } from "#/mocking/spy";

/**
 * The loose callable an auto-mock materializes for each accessed property.
 *
 * @remarks Deliberately structural so any backend qualifies: the built-in {@link Spy}, a Vitest
 * `vi.fn()`, a `jest.fn()`, or a Sinon stub all satisfy it.
 */
export type MockFunction = (...args: ReadonlyArray<unknown>) => unknown;

/**
 * The factory each auto-mocked member is created by.
 *
 * @remarks `Backend` is the spy type the factory returns, and it flows through the whole test bed:
 * `Mocked` members, `mocks.get`, and the `.stub` callback are all typed against it, so
 * `() => vi.fn()` gives every mock Vitest's own surface and `() => sinon.stub()` gives Sinon's —
 * with no adapter package and no module augmentation.
 *
 * @typeParam Backend - The spy type one factory call produces; defaults to the loose callable.
 */
export type MockFactory<Backend extends MockFunction = MockFunction> = () => Backend;

/**
 * The default `MockFactory` — one built-in {@link Spy} per call, with no test-framework dependency.
 */
export const defaultMockFactory: MockFactory<Spy> = () => createSpy();
