/** The fluent builder that records overrides and compiles a solitary unit under test. */

import type { Constructor, DependencyKey, InjectOptions, MetadataReader } from "@codefast/di";
import { Container, defaultMetadataReader } from "@codefast/di";
import { verifyingMetadataReader } from "@codefast/di/metadata/verifying-metadata-reader";

import { scanDependencies } from "#/discovery/dependency-scanner";
import type { BoundMock, SlotCriteria, SlottedOverride } from "#/discovery/mock-binder";
import { bindMocks, criteriaEquals, normalizeCriteria } from "#/discovery/mock-binder";
import type { DeepPartial } from "#/mocking/auto-mock";
import type { MockFactory, MockFn } from "#/mocking/mock-factory";
import { defaultMockFactory } from "#/mocking/mock-factory";
import type { Spy } from "#/mocking/spy";
import type { UnitTestBed } from "#/test-bed/unit-test-bed";
import { createUnitTestBed } from "#/test-bed/unit-test-bed";
import type { InjectionIdentifier } from "#/types";

/**
 * Options that configure a whole solitary compile.
 *
 * @typeParam Backend - The spy type the mock factory produces; it flows into every `Mocked` member,
 * `unitRef.get`, and the `.impl` callback, so `() => vi.fn()` yields Vitest's own mock typing.
 */
export interface TestBedOptions<Backend extends MockFn = Spy> {
  /** Spy factory each auto-mock property is materialized with; defaults to the built-in spy. */
  readonly mockFactory?: MockFactory<Backend> | undefined;
  /** Reader the dependency scan and the compile container both consult; defaults to di's reader. */
  readonly metadataReader?: MetadataReader | undefined;
}

/**
 * The override step: choose how one named dependency is supplied instead of a plain auto-mock.
 *
 * @typeParam Dependency - The dependency's value type.
 * @typeParam Class - The class under test.
 * @typeParam Backend - The spy type the bed's mock factory produces.
 */
export interface MockOverrideBuilder<Dependency, Class, Backend extends MockFn = Spy> {
  /**
   * Supplies a fixed value for this dependency.
   *
   * @remarks The value is bound as-is and sealed: it has no mock surface, so `unitRef.get` refuses
   * it rather than hand it back mistyped — the test already holds the reference it passed in.
   */
  using(value: Dependency): SolitaryTestBedBuilder<Class, Backend>;
  /** Supplies a partial stub, built from the active spy factory; unlisted members stay auto-mocked. */
  impl(setup: (mock: MockFactory<Backend>) => DeepPartial<Dependency>): SolitaryTestBedBuilder<Class, Backend>;
  /** Leaves the dependency unbound: an `optional()` slot resolves `undefined`, an `injectAll()` slot `[]`. */
  absent(): SolitaryTestBedBuilder<Class, Backend>;
  /** Supplies every element of an unconstrained `injectAll()` slot, in order. Sealed like `.using`. */
  all(values: ReadonlyArray<Dependency>): SolitaryTestBedBuilder<Class, Backend>;
}

/**
 * A solitary build in progress: register overrides, then compile.
 *
 * @typeParam Class - The class under test.
 * @typeParam Backend - The spy type the bed's mock factory produces.
 */
export interface SolitaryTestBedBuilder<Class, Backend extends MockFn = Spy> {
  /**
   * Replaces the auto-mock for one dependency with a hand-written stub or a concrete value.
   *
   * @remarks Pass `options` (a name or tags) to target one slot of a token bound several ways;
   * without them the override covers every slot of the token that has no more specific override.
   * Registering the same target twice replaces the earlier override wholesale.
   */
  mock<Dependency>(
    identifier: InjectionIdentifier<Dependency>,
    options?: InjectOptions,
  ): MockOverrideBuilder<Dependency, Class, Backend>;
  /** Instantiates the unit with every dependency mocked, running accessor injection and `@postConstruct`. */
  compile(): UnitTestBed<Class, Backend>;
  /** Async variant for a unit whose `@postConstruct` is async; otherwise identical to {@link compile}. */
  compileAsync(): Promise<UnitTestBed<Class, Backend>>;
}

/**
 * The default {@link SolitaryTestBedBuilder}, backed by a fresh container per compile.
 *
 * @typeParam Class - The class under test.
 * @typeParam Backend - The spy type the bed's mock factory produces.
 */
export class SolitaryBuilder<Class, Backend extends MockFn = Spy> implements SolitaryTestBedBuilder<Class, Backend> {
  readonly #target: Constructor<Class>;
  readonly #reader: MetadataReader;
  readonly #mockFactory: MockFactory<Backend>;
  readonly #overrides = new Map<DependencyKey, Array<SlottedOverride>>();

  constructor(target: Constructor<Class>, options?: TestBedOptions<Backend>) {
    this.#target = target;
    // A supplied reader is a claim — verify it the way the container itself does.
    this.#reader = verifyingMetadataReader(options?.metadataReader ?? defaultMetadataReader);
    // With no factory the caller's Backend defaulted to Spy, which is what the default produces.
    this.#mockFactory = options?.mockFactory ?? (defaultMockFactory as unknown as MockFactory<Backend>);
  }

  mock<Dependency>(
    identifier: InjectionIdentifier<Dependency>,
    options?: InjectOptions,
  ): MockOverrideBuilder<Dependency, Class, Backend> {
    const key = identifier as DependencyKey;
    const criteria = normalizeCriteria(options);
    const set = (override: SlottedOverride["override"]): this => {
      this.#register(key, criteria, override);
      return this;
    };
    return {
      using: (value) => set({ kind: "value", value }),
      impl: (setup) => set({ kind: "impl", seed: setup(this.#mockFactory) }),
      absent: () => set({ kind: "absent" }),
      all: (values) => set({ kind: "all", values }),
    };
  }

  compile(): UnitTestBed<Class, Backend> {
    const { container, mocks } = this.#prepare();
    try {
      const unit = container.resolve(this.#target);
      return createUnitTestBed(unit, mocks, container);
    } catch (error) {
      // A failed compile still owns the container — dispose it so no lifecycle state leaks.
      void container.dispose().catch(() => undefined);
      throw error;
    }
  }

  async compileAsync(): Promise<UnitTestBed<Class, Backend>> {
    const { container, mocks } = this.#prepare();
    try {
      const unit = await container.resolveAsync(this.#target);
      return createUnitTestBed(unit, mocks, container);
    } catch (error) {
      await container.dispose().catch(() => undefined);
      throw error;
    }
  }

  /** Records an override, replacing any earlier one that targets the same token and slot. */
  #register(key: DependencyKey, criteria: SlotCriteria | undefined, override: SlottedOverride["override"]): void {
    let list = this.#overrides.get(key);
    if (list === undefined) {
      list = [];
      this.#overrides.set(key, list);
    }
    const existing = list.findIndex((candidate) =>
      candidate.criteria === undefined || criteria === undefined
        ? candidate.criteria === criteria
        : criteriaEquals(candidate.criteria, criteria),
    );
    if (existing === -1) {
      list.push({ criteria, override });
    } else {
      list[existing] = { criteria, override };
    }
  }

  /** Builds the container, binds every dependency's mock, and registers the unit as a singleton. */
  #prepare(): { container: Container; mocks: ReadonlyMap<DependencyKey, ReadonlyArray<BoundMock>> } {
    const container = Container.create({ metadataReader: this.#reader });
    const dependencies = scanDependencies(this.#target, this.#reader);
    const mocks = bindMocks(container, dependencies, this.#overrides, this.#mockFactory);
    container.bind(this.#target).toSelf().singleton();
    return { container, mocks };
  }
}
