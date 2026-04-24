import { describe, expect, it } from "vitest";
import type { Constructor } from "#/binding";
import { inject } from "#/decorators/inject";
import { getAutoRegistered, injectable } from "#/decorators/injectable";
import { InternalError } from "#/errors";
import {
  CODEFAST_DI_ACCESSOR_INJECTIONS,
  decoratorMetadataObjectSymbol,
} from "#/metadata/metadata-keys";
import { SymbolMetadataReader } from "#/metadata/symbol-metadata-reader";
import type { Token } from "#/token";
import { token } from "#/token";

function injectAccessorField<Value>(dep: Token<Value> | Constructor<Value>) {
  return inject(dep) as unknown as (target: unknown, context: unknown) => void;
}

const LoggerToken = token<{
  line: string;
}>("decorators-spec-logger");
@injectable([])
class Dashboard {
  constructor() {}
  @injectAccessorField(LoggerToken)
  accessor logger!: {
    line: string;
  };
}
describe("TC39 decorators + metadata (SPEC §6)", () => {
  const reader = new SymbolMetadataReader();
  it("Case A: subclass without @injectable does not inherit parent constructor metadata (Object.hasOwn)", () => {
    const Dep = token<number>("decorators-spec-dep");
    @injectable([inject(Dep)])
    class ParentService {
      constructor(public readonly value: number) {}
    }
    class ChildService extends ParentService {
      constructor() {
        super(0);
      }
    }
    expect(reader.getConstructorMetadata(ParentService)?.params.length).toBe(1);
    expect(reader.getConstructorMetadata(ChildService)).toBeUndefined();
  });
  it("Case B: @inject on accessor writes accessor metadata (TC39 Symbol.metadata)", () => {
    const sym = decoratorMetadataObjectSymbol();
    const raw = (Dashboard as unknown as Record<symbol, unknown>)[sym];
    expect(raw !== null && typeof raw === "object").toBe(true);
    const bucket = (raw as Record<PropertyKey, unknown>)[CODEFAST_DI_ACCESSOR_INJECTIONS];
    expect(Array.isArray(bucket)).toBe(true);
    expect(
      (
        bucket as {
          token: unknown;
        }[]
      )[0]?.token,
    ).toBe(LoggerToken);
  });
  it("Case C: inject() rejects non-accessor decorator contexts at runtime", () => {
    const fakeFieldContext = {
      kind: "field",
      name: "bad",
      metadata: {},
    } as const;
    expect(() => {
      inject(LoggerToken, fakeFieldContext as never);
    }).toThrow(InternalError);
  });
  it("Case D: autoRegister pushes once at class definition, not per instance", () => {
    const before = getAutoRegistered().length;
    @injectable([], { autoRegister: true })
    class AutoRegOnceForCaseD {}
    expect(getAutoRegistered().length).toBe(before + 1);
    new AutoRegOnceForCaseD();
    new AutoRegOnceForCaseD();
    expect(getAutoRegistered().length).toBe(before + 1);
  });
});
