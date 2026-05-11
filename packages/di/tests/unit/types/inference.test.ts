import { expectTypeOf } from "expect-type";
import { describe, it } from "vitest";
import { Container } from "#/container";
import { inject, injectAll, normalizeToDescriptor, optional } from "#/decorators/inject";
import { token } from "#/token";
import type { DependencyKey, TokenValue } from "#/types";
import type { InjectionDescriptor } from "#/decorators/inject";

describe("compile-time API inference", () => {
  it("resolves instance type from constructor token", () => {
    class ConstructorService {
      readonly kind = "svc" as const;
    }
    const container = Container.create();
    container.bind(ConstructorService).toSelf().singleton();
    const resolved = container.resolve(ConstructorService);
    expectTypeOf(resolved).toEqualTypeOf<ConstructorService>();
  });

  it("toResolved narrows factory parameters from deps tuple", () => {
    const FirstDepToken = token<{ id: "a" }>("A");
    const SecondDepToken = token<{ id: "b" }>("B");
    const OutputToken = token<{ out: true }>("out");
    const container = Container.create();
    container.bind(FirstDepToken).toConstantValue({ id: "a" });
    container.bind(SecondDepToken).toConstantValue({ id: "b" });
    container.bind(OutputToken).toResolved(
      (firstDep, secondDep) => {
        expectTypeOf(firstDep).toEqualTypeOf<{ id: "a" }>();
        expectTypeOf(secondDep).toEqualTypeOf<{ id: "b" }>();
        return { out: true };
      },
      [FirstDepToken, SecondDepToken],
    );
    expectTypeOf(container.resolve(OutputToken)).toEqualTypeOf<{ out: true }>();
  });

  it("TokenValue maps token and constructor", () => {
    const NumberToken = token<number>("n");
    class TokenValueCtor {}
    expectTypeOf<TokenValue<typeof NumberToken>>().toEqualTypeOf<number>();
    expectTypeOf<TokenValue<typeof TokenValueCtor>>().toEqualTypeOf<TokenValueCtor>();
    expectTypeOf(NumberToken).toExtend<DependencyKey>();
    expectTypeOf(TokenValueCtor).toExtend<DependencyKey>();
  });

  it("inject optional widens to undefined union in descriptor", () => {
    const StringToken = token<string>("s");
    const descriptor = optional(StringToken);
    expectTypeOf(descriptor).toExtend<InjectionDescriptor<string | undefined>>();
  });

  it("injectAll marks multi with array value type", () => {
    const StringToken = token<string>("s");
    const descriptor = injectAll(StringToken);
    expectTypeOf(descriptor).toExtend<InjectionDescriptor<Array<string>>>();
  });

  it("dual-role inject does not use Function#name as slot name", () => {
    const NumberToken = token<number>("n");
    const rawInjection = inject(NumberToken);
    const descriptor = normalizeToDescriptor(rawInjection);
    expectTypeOf(descriptor.name).toEqualTypeOf<string | undefined>();
    expect(descriptor.name).toBeUndefined();
  });

  it("inject preserves dual-role shape at type level", () => {
    const NumberToken = token<number>("n");
    const descriptor = inject(NumberToken);
    expectTypeOf(descriptor).toExtend<InjectionDescriptor<number>>();
  });
});
