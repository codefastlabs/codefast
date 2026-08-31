/** The fluent builder that compiles a solitary unit under test. */

import type { InjectOptions } from "@codefast/di";
import { Container } from "@codefast/di";

import { scanDependencies } from "#/discovery/dependency-scanner";
import { bindMocks } from "#/discovery/mock-binder";
import type { MockFunction } from "#/mocking/mock-factory";
import type { Spy } from "#/mocking/spy";
import type { MockOverrideBuilder, PreparedBed } from "#/test-bed/bed-builder";
import { BedBuilder } from "#/test-bed/bed-builder";
import type { UnitTestBed } from "#/test-bed/unit-test-bed";
import { createUnitTestBed } from "#/test-bed/unit-test-bed";
import type { InjectionIdentifier } from "#/types";

/**
 * A solitary build in progress: register overrides, then compile.
 *
 * @typeParam Class - The class under test.
 * @typeParam Backend - The spy type the bed's mock factory produces.
 */
export interface SolitaryTestBedBuilder<Class, Backend extends MockFunction = Spy> {
  /** Replaces the auto-mock for one dependency with a hand-written stub or a concrete value. */
  mock<Dependency>(
    identifier: InjectionIdentifier<Dependency>,
    options?: InjectOptions,
  ): MockOverrideBuilder<Dependency, SolitaryTestBedBuilder<Class, Backend>, Backend>;
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
export class SolitaryBuilder<Class, Backend extends MockFunction = Spy>
  extends BedBuilder<Class, Backend>
  implements SolitaryTestBedBuilder<Class, Backend>
{
  compile(): UnitTestBed<Class, Backend> {
    const { container, mocks } = this.#prepare();
    try {
      const unit = container.resolve(this.target);
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
      const unit = await container.resolveAsync(this.target);
      return createUnitTestBed(unit, mocks, container);
    } catch (error) {
      await container.dispose().catch(() => undefined);
      throw error;
    }
  }

  /** Builds the container, binds every dependency's mock, and registers the unit as a singleton. */
  #prepare(): PreparedBed {
    const container = Container.create({ metadataReader: this.reader });
    const dependencies = scanDependencies(this.target, this.reader);
    const mocks = bindMocks(container, dependencies, this.overrides, this.mockFactory);
    container.bind(this.target).toSelf().singleton();
    return { container, mocks };
  }
}
