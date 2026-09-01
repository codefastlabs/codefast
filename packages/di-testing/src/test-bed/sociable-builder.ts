/** The fluent builder that compiles a unit together with chosen real collaborators. */

import type { Constructor, DependencySlot, InjectOptions } from "@codefast/di";
import { Container, token } from "@codefast/di";

import { scanSociableDependencies } from "#/discovery/dependency-scanner";
import { bindMocks } from "#/discovery/mock-binder";
import { ExposureError } from "#/errors/errors";
import type { MockFunction } from "#/mocking/mock-factory";
import type { Spy } from "#/mocking/spy";
import type { MockOverrideBuilder, PreparedBed } from "#/test-bed/bed-builder";
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
 *
 * @since 0.1.0
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

/** What the sociable prepare step adds to the shared shape: the reachable exposed classes. */
type PreparedSociableBed = PreparedBed & { readonly realClasses: ReadonlySet<Constructor> };

/**
 * The default {@link SociableTestBedBuilder}, backed by a fresh container per compile.
 *
 * @typeParam Class - The class under test.
 * @typeParam Backend - The spy type the bed's mock factory produces.
 *
 * @since 0.1.0
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
    return this.compileWith(
      () => this.#prepare(),
      (unit, prepared) =>
        createSociableUnitTestBed(
          createUnitTestBed(unit, prepared.mocks, prepared.container),
          prepared.container,
          prepared.realClasses,
        ),
    );
  }

  async compileAsync(): Promise<SociableUnitTestBed<Class, Backend>> {
    return this.compileWithAsync(
      () => this.#prepare(),
      (unit, prepared) =>
        createSociableUnitTestBed(
          createUnitTestBed(unit, prepared.mocks, prepared.container),
          prepared.container,
          prepared.realClasses,
        ),
    );
  }

  /** Scans across the exposed set, binds mocks for the boundary, and binds every real class. */
  #prepare(): PreparedSociableBed {
    if (this.#exposed.has(this.target)) {
      throw new ExposureError(this.target.name, "the unit under test is already real — expose only its collaborators.");
    }

    const container = Container.create({ metadataReader: this.reader });
    const { mockSlots, realClasses, realSlots } = scanSociableDependencies(this.target, this.#exposed, this.reader);

    // An exposed class the unit never reaches is a stale exposure — likely a typo or a refactor.
    for (const exposedClass of this.#exposed) {
      if (!realClasses.has(exposedClass)) {
        throw new ExposureError(
          exposedClass.name,
          "the unit never reaches this class through exposed collaborators. Expose the intermediate classes on the path to it, or remove the exposure.",
        );
      }
    }

    const mocks = bindMocks(container, mockSlots, this.overrides, this.mockFactory, this.#exposed);

    const constrainedSlots = new Map<Constructor, Array<DependencySlot>>();
    for (const slot of realSlots) {
      const list = constrainedSlots.get(slot.token as Constructor) ?? [];
      list.push(slot);
      constrainedSlots.set(slot.token as Constructor, list);
    }

    // Real collaborators are singletons, so the unit and bed.exposed() see one instance each,
    // and their @preDestroy hooks run on dispose.
    const merged = new Map(mocks);
    for (const realClass of realClasses) {
      const slots = constrainedSlots.get(realClass);
      if (slots === undefined) {
        container.bind(realClass).toSelf().singleton();
      } else {
        // A name/tag-constrained slot needs its own binding, and di rejects a self-alias — so the
        // one real binding lives on a private token, and every slot of the class resolves it
        // through a factory (an alias would forward the slot's criteria to the private token).
        const realToken = token<unknown>(`di-testing:real:${realClass.name}`);
        container.bind(realToken).to(realClass).singleton();
        container.bind(realClass).toDynamic((context) => context.resolve(realToken));
        for (const slot of slots) {
          const builder = container.bind(realClass).toDynamic((context) => context.resolve(realToken));
          if (slot.name !== undefined) {
            builder.whenNamed(slot.name);
          }
          for (const tag of slot.tags ?? []) {
            builder.whenTagged(tag);
          }
        }
      }
      // Sealed entries so mocks.get points at bed.exposed() instead of handing back a fake Mocked.
      merged.set(realClass, [{ criteria: undefined, value: undefined, kind: "exposed" }]);
    }
    container.bind(this.target).toSelf().singleton();

    return { container, mocks: merged, realClasses };
  }
}
