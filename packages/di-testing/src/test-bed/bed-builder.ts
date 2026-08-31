/** The override-recording core both test-bed builders extend. */

import type { Constructor, Container, DependencyKey, InjectOptions, MetadataReader } from "@codefast/di";
import { defaultMetadataReader } from "@codefast/di";
import { verifyingMetadataReader } from "@codefast/di/metadata/verifying-metadata-reader";

import type { BoundMock, SlotCriteria, SlottedOverride } from "#/discovery/mock-binder";
import { criteriaEquals, normalizeCriteria } from "#/discovery/mock-binder";
import type { DeepPartial } from "#/mocking/auto-mock";
import type { MockFactory, MockFn } from "#/mocking/mock-factory";
import { defaultMockFactory } from "#/mocking/mock-factory";
import type { Spy } from "#/mocking/spy";
import type { InjectionIdentifier } from "#/types";

/**
 * Options that configure a whole test-bed compile.
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
 * @typeParam Owner - The builder the chain returns to.
 * @typeParam Backend - The spy type the bed's mock factory produces.
 */
export interface MockOverrideBuilder<Dependency, Owner, Backend extends MockFn = Spy> {
  /**
   * Supplies a fixed value for this dependency.
   *
   * @remarks The value is bound as-is and sealed: it has no mock surface, so `unitRef.get` refuses
   * it rather than hand it back mistyped — the test already holds the reference it passed in.
   */
  using(value: Dependency): Owner;
  /** Supplies a partial stub, built from the active spy factory; unlisted members stay auto-mocked. */
  impl(setup: (mock: MockFactory<Backend>) => DeepPartial<Dependency>): Owner;
  /** Leaves the dependency unbound: an `optional()` slot resolves `undefined`, an `injectAll()` slot `[]`. */
  absent(): Owner;
  /** Supplies every element of an unconstrained `injectAll()` slot, in order. Sealed like `.using`. */
  all(values: ReadonlyArray<Dependency>): Owner;
}

/**
 * What a builder's prepare step hands the compile template: the container and the bound mock entries.
 */
export interface PreparedBed {
  readonly container: Container;
  readonly mocks: ReadonlyMap<DependencyKey, ReadonlyArray<BoundMock>>;
}

/**
 * The shared builder core: records overrides and resolves the reader and mock factory.
 *
 * @remarks Fields are `protected` rather than `#` so the two concrete builders stay thin; nothing
 * outside `test-bed/` extends this class.
 *
 * @typeParam Class - The class under test.
 * @typeParam Backend - The spy type the bed's mock factory produces.
 */
export abstract class BedBuilder<Class, Backend extends MockFn = Spy> {
  protected readonly target: Constructor<Class>;
  protected readonly reader: MetadataReader;
  protected readonly mockFactory: MockFactory<Backend>;
  protected readonly overrides: Map<DependencyKey, Array<SlottedOverride>> = new Map();

  constructor(target: Constructor<Class>, options?: TestBedOptions<Backend>) {
    this.target = target;
    // A supplied reader is a claim — verify it the way the container itself does.
    this.reader = verifyingMetadataReader(options?.metadataReader ?? defaultMetadataReader);
    // With no factory the caller's Backend defaulted to Spy, which is what the default produces.
    this.mockFactory = options?.mockFactory ?? (defaultMockFactory as unknown as MockFactory<Backend>);
  }

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
  ): MockOverrideBuilder<Dependency, this, Backend> {
    const key = identifier as DependencyKey;
    const criteria = normalizeCriteria(options);
    const set = (override: SlottedOverride["override"]): this => {
      this.register(key, criteria, override);
      return this;
    };
    return {
      using: (value) => set({ kind: "value", value }),
      impl: (setup) => set({ kind: "impl", seed: setup(this.mockFactory) }),
      absent: () => set({ kind: "absent" }),
      all: (values) => set({ kind: "all", values }),
    };
  }

  /** Records an override, replacing any earlier one that targets the same token and slot. */
  protected register(
    key: DependencyKey,
    criteria: SlotCriteria | undefined,
    override: SlottedOverride["override"],
  ): void {
    let list = this.overrides.get(key);
    if (list === undefined) {
      list = [];
      this.overrides.set(key, list);
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
}
