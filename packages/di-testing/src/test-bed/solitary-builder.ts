/** The fluent builder that records overrides and compiles a solitary unit under test. */

import type { Constructor, DependencyKey, MetadataReader } from "@codefast/di";
import { Container, defaultMetadataReader } from "@codefast/di";

import { scanDependencies } from "#/discovery/dependency-scanner";
import type { MockOverride } from "#/discovery/mock-binder";
import { bindMocks } from "#/discovery/mock-binder";
import type { DeepPartial } from "#/mocking/auto-mock";
import type { MockFactory, StubFactory } from "#/mocking/mock-factory";
import { defaultMockFactory } from "#/mocking/mock-factory";
import type { UnitTestBed } from "#/test-bed/unit-test-bed";
import { createUnitTestBed } from "#/test-bed/unit-test-bed";
import type { InjectionIdentifier } from "#/types";

/**
 * Options that configure a whole solitary compile.
 */
export interface TestBedOptions {
  /** Spy factory each auto-mock property is materialized with; defaults to the built-in spy. */
  readonly mockFactory?: MockFactory | undefined;
  /** Reader the dependency scan and the compile container both consult; defaults to di's reader. */
  readonly metadataReader?: MetadataReader | undefined;
}

/**
 * The override step: choose how one named dependency is supplied instead of a plain auto-mock.
 *
 * @typeParam Dependency - The dependency's value type.
 * @typeParam Class - The class under test.
 */
export interface MockOverrideBuilder<Dependency, Class> {
  /** Supplies a fixed value for this dependency. */
  using(value: Dependency): SolitaryTestBedBuilder<Class>;
  /** Supplies a partial stub, built from the active spy factory; unlisted members stay auto-mocked. */
  impl(setup: (mock: StubFactory) => DeepPartial<Dependency>): SolitaryTestBedBuilder<Class>;
}

/**
 * A solitary build in progress: register overrides, then compile.
 *
 * @typeParam Class - The class under test.
 */
export interface SolitaryTestBedBuilder<Class> {
  /** Replaces the auto-mock for one dependency with a hand-written stub or a concrete value. */
  mock<Dependency>(identifier: InjectionIdentifier<Dependency>): MockOverrideBuilder<Dependency, Class>;
  /** Instantiates the unit with every dependency mocked, running accessor injection and `@postConstruct`. */
  compile(): UnitTestBed<Class>;
  /** Async variant for a unit whose `@postConstruct` is async; otherwise identical to {@link compile}. */
  compileAsync(): Promise<UnitTestBed<Class>>;
}

/**
 * The default {@link SolitaryTestBedBuilder}, backed by a fresh container per compile.
 *
 * @typeParam Class - The class under test.
 */
export class SolitaryBuilder<Class> implements SolitaryTestBedBuilder<Class> {
  readonly #target: Constructor<Class>;
  readonly #reader: MetadataReader;
  readonly #mockFactory: MockFactory;
  readonly #overrides = new Map<DependencyKey, MockOverride>();

  constructor(target: Constructor<Class>, options?: TestBedOptions) {
    this.#target = target;
    this.#reader = options?.metadataReader ?? defaultMetadataReader;
    this.#mockFactory = options?.mockFactory ?? defaultMockFactory;
  }

  mock<Dependency>(identifier: InjectionIdentifier<Dependency>): MockOverrideBuilder<Dependency, Class> {
    const key = identifier as DependencyKey;
    return {
      using: (value) => {
        this.#overrides.set(key, { kind: "value", value });
        return this;
      },
      impl: (setup) => {
        const seed = setup(this.#mockFactory as unknown as StubFactory);
        this.#overrides.set(key, { kind: "impl", seed });
        return this;
      },
    };
  }

  compile(): UnitTestBed<Class> {
    const { container, mocks } = this.#prepare();
    const unit = container.resolve(this.#target);
    return createUnitTestBed(unit, mocks, container);
  }

  async compileAsync(): Promise<UnitTestBed<Class>> {
    const { container, mocks } = this.#prepare();
    const unit = await container.resolveAsync(this.#target);
    return createUnitTestBed(unit, mocks, container);
  }

  /** Builds the container, binds every dependency's mock, and registers the unit as a singleton. */
  #prepare(): { container: Container; mocks: ReadonlyMap<DependencyKey, unknown> } {
    const container = Container.create({ metadataReader: this.#reader });
    const dependencies = scanDependencies(this.#target, this.#reader);
    const mocks = bindMocks(container, dependencies, this.#overrides, this.#mockFactory);
    container.bind(this.#target).toSelf().singleton();
    return { container, mocks };
  }
}
