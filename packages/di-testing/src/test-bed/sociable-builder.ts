/** The fluent builder that compiles a unit together with chosen real collaborators. */

import type { Constructor, DependencyKey, InjectOptions } from "@codefast/di";
import { Container } from "@codefast/di";

import { scanSociableDependencies } from "#/discovery/dependency-scanner";
import type { BoundMock } from "#/discovery/mock-binder";
import { bindMocks } from "#/discovery/mock-binder";
import { UndeclaredDependencyError } from "#/errors/errors";
import type { MockFunction } from "#/mocking/mock-factory";
import type { Spy } from "#/mocking/spy";
import type { MockOverrideBuilder } from "#/test-bed/bed-builder";
import { BedBuilder } from "#/test-bed/bed-builder";
import type { SociableUnitTestBed } from "#/test-bed/unit-test-bed";
import { createSociableUnitTestBed, createUnitTestBed } from "#/test-bed/unit-test-bed";
import type { InjectionIdentifier } from "#/types";

/**
 * A sociable build in progress: expose real collaborators, override the rest, then compile.
 *
 * @remarks Exposure follows class identity: a class-keyed dependency of the unit — or of another
 * exposed class — stays real when exposed. A `Token`-keyed dependency is always mocked, treating
 * tokens as the declared boundary between the logic under test and the outside world.
 *
 * @typeParam Class - The class under test.
 * @typeParam Backend - The spy type the bed's mock factory produces.
 */
export interface SociableTestBedBuilder<Class, Backend extends MockFunction = Spy> {
  /** Keeps a class-keyed collaborator real; its own dependencies follow the same exposure rules. */
  expose(target: Constructor): SociableTestBedBuilder<Class, Backend>;
  /** Replaces the auto-mock for one dependency with a hand-written stub or a concrete value. */
  mock<Dependency>(
    identifier: InjectionIdentifier<Dependency>,
    options?: InjectOptions,
  ): MockOverrideBuilder<Dependency, SociableTestBedBuilder<Class, Backend>, Backend>;
  /** Instantiates the unit and its exposed subtree, mocking everything else. */
  compile(): SociableUnitTestBed<Class, Backend>;
  /** Async variant for a subtree whose `@postConstruct` is async; otherwise identical to {@link compile}. */
  compileAsync(): Promise<SociableUnitTestBed<Class, Backend>>;
}

/**
 * The default {@link SociableTestBedBuilder}, backed by a fresh container per compile.
 *
 * @typeParam Class - The class under test.
 * @typeParam Backend - The spy type the bed's mock factory produces.
 */
export class SociableBuilder<Class, Backend extends MockFunction = Spy>
  extends BedBuilder<Class, Backend>
  implements SociableTestBedBuilder<Class, Backend>
{
  readonly #exposed = new Set<Constructor>();

  expose(target: Constructor): this {
    this.#exposed.add(target);
    return this;
  }

  compile(): SociableUnitTestBed<Class, Backend> {
    const { container, mocks, realClasses } = this.#prepare();
    try {
      const unit = container.resolve(this.target);
      return createSociableUnitTestBed(createUnitTestBed(unit, mocks, container), container, realClasses);
    } catch (error) {
      // A failed compile still owns the container — dispose it so no lifecycle state leaks.
      void container.dispose().catch(() => undefined);
      throw error;
    }
  }

  async compileAsync(): Promise<SociableUnitTestBed<Class, Backend>> {
    const { container, mocks, realClasses } = this.#prepare();
    try {
      const unit = await container.resolveAsync(this.target);
      return createSociableUnitTestBed(createUnitTestBed(unit, mocks, container), container, realClasses);
    } catch (error) {
      await container.dispose().catch(() => undefined);
      throw error;
    }
  }

  /** Scans across the exposed set, binds mocks for the boundary, and binds every real class. */
  #prepare(): {
    container: Container;
    mocks: ReadonlyMap<DependencyKey, ReadonlyArray<BoundMock>>;
    realClasses: ReadonlySet<Constructor>;
  } {
    const container = Container.create({ metadataReader: this.reader });
    const { mockSlots, realClasses } = scanSociableDependencies(this.target, this.#exposed, this.reader);

    // An exposed class the unit never reaches is a stale exposure — likely a typo or a refactor.
    for (const exposedClass of this.#exposed) {
      if (!realClasses.includes(exposedClass)) {
        throw new UndeclaredDependencyError(exposedClass.name, "exposed but unreachable");
      }
    }

    const mocks = bindMocks(container, mockSlots, this.overrides, this.mockFactory, this.#exposed);
    // Real collaborators are singletons, so the unit and bed.exposed() see one instance each,
    // and their @preDestroy hooks run on dispose.
    for (const realClass of realClasses) {
      container.bind(realClass).toSelf().singleton();
    }
    container.bind(this.target).toSelf().singleton();

    // Sealed entries so mocks.get points at bed.exposed() instead of handing back a fake Mocked.
    const merged = new Map(mocks);
    for (const realClass of realClasses) {
      merged.set(realClass, [{ criteria: undefined, value: undefined, sealed: true }]);
    }

    return { container, mocks: merged, realClasses: new Set(realClasses) };
  }
}
