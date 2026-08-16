/**
 * Chain-aggregation tests for `SymbolMetadataReader`.
 *
 * TC39 decorator metadata is minted per class as `Object.create(parentMetadata)`, so a subclass
 * decorator that wrote through the inherited record would register itself on the base class. These
 * cases pin the ownership boundary (each class's bucket holds only its own declarations) and the
 * reader-side aggregation (lifecycle and accessor answers cover the base chain, constructor
 * metadata stays own-only).
 */
import { describe, expect, it } from "vitest";

import { token } from "#/core/token";
import { inject } from "#/decorators/inject";
import { injectable } from "#/decorators/injectable";
import { postConstruct, preDestroy } from "#/decorators/lifecycle-decorators";
import { SymbolMetadataReader } from "#/metadata/symbol-metadata-reader";

const configToken = token<string>("reader.config");
const extraToken = token<number>("reader.extra");

describe("lifecycle metadata across class inheritance", () => {
  it("keeps a subclass hook off the base class's metadata", () => {
    class LifecycleBase {
      @postConstruct()
      initBase(): void {}
    }
    class LifecycleDerived extends LifecycleBase {
      @postConstruct()
      initDerived(): void {}
    }
    const reader = new SymbolMetadataReader();

    expect(reader.getLifecycleMetadata(LifecycleBase)?.postConstruct).toEqual(["initBase"]);
    expect(reader.getLifecycleMetadata(LifecycleDerived)?.postConstruct).toEqual(["initBase", "initDerived"]);
  });

  it("aggregates postConstruct base-first and preDestroy derived-first", () => {
    class OrderBase {
      @postConstruct()
      initBase(): void {}

      @preDestroy()
      closeBase(): void {}
    }
    class OrderDerived extends OrderBase {
      @postConstruct()
      initDerived(): void {}

      @preDestroy()
      closeDerived(): void {}
    }
    const reader = new SymbolMetadataReader();
    const merged = reader.getLifecycleMetadata(OrderDerived);

    expect(merged?.postConstruct).toEqual(["initBase", "initDerived"]);
    expect(merged?.preDestroy).toEqual(["closeDerived", "closeBase"]);
  });

  it("lists a re-decorated override once", () => {
    class OverrideBase {
      @postConstruct()
      init(): void {}
    }
    class OverrideDerived extends OverrideBase {
      @postConstruct()
      override init(): void {}
    }
    const reader = new SymbolMetadataReader();

    expect(reader.getLifecycleMetadata(OverrideDerived)?.postConstruct).toEqual(["init"]);
  });

  it("answers for an undecorated subclass with the base chain's hooks", () => {
    class DecoratedBase {
      @postConstruct()
      initBase(): void {}
    }
    class UndecoratedSub extends DecoratedBase {}
    const reader = new SymbolMetadataReader();

    expect(reader.getLifecycleMetadata(UndecoratedSub)?.postConstruct).toEqual(["initBase"]);
  });
});

describe("accessor metadata across class inheritance", () => {
  it("keeps a subclass accessor off the base class's metadata", () => {
    class AccessorBase {
      @inject(configToken) accessor config!: string;
    }
    class AccessorDerived extends AccessorBase {
      @inject(extraToken) accessor extra!: number;
    }
    const reader = new SymbolMetadataReader();

    const baseEntries = reader.getAccessorMetadata(AccessorBase);
    expect(baseEntries?.length).toBe(1);
    expect(baseEntries?.[0]?.key).toBe("config");

    const derivedEntries = reader.getAccessorMetadata(AccessorDerived);
    expect(derivedEntries?.map((entry) => entry.key)).toEqual(["config", "extra"]);
  });

  it("reports inherited accessors for a subclass that declares none of its own", () => {
    class InjectingBase {
      @inject(configToken) accessor config!: string;
    }

    @injectable([])
    class PlainSub extends InjectingBase {}

    const reader = new SymbolMetadataReader();
    const entries = reader.getAccessorMetadata(PlainSub);

    expect(entries?.length).toBe(1);
    expect(entries?.[0]?.key).toBe("config");
  });

  it("keeps constructor metadata own-only", () => {
    @injectable([configToken])
    class CtorBase {
      constructor(readonly config: string) {}
    }
    class CtorSub extends CtorBase {}

    const reader = new SymbolMetadataReader();

    expect(reader.getConstructorMetadata(CtorBase)?.params.length).toBe(1);
    expect(reader.getConstructorMetadata(CtorSub)).toBeUndefined();
  });
});
