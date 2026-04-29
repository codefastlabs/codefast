import { expectTypeOf } from "expect-type";
import { describe, it } from "vitest";
import { Container } from "#/container";
import { inject, injectAll, normalizeToDescriptor, optional } from "#/decorators/inject";
import { token } from "#/token";
import type { DependencyKey, TokenValue } from "#/types";
import type { InjectionDescriptor } from "#/decorators/inject";

describe("compile-time API inference", () => {
  it("resolves instance type from constructor token", () => {
    class Service {
      readonly kind = "svc" as const;
    }
    const container = Container.create();
    container.bind(Service).toSelf().singleton();
    const resolved = container.resolve(Service);
    expectTypeOf(resolved).toEqualTypeOf<Service>();
  });

  it("toResolved narrows factory parameters from deps tuple", () => {
    const A = token<{ id: "a" }>("A");
    const B = token<{ id: "b" }>("B");
    const Out = token<{ out: true }>("out");
    const container = Container.create();
    container.bind(A).toConstantValue({ id: "a" });
    container.bind(B).toConstantValue({ id: "b" });
    container.bind(Out).toResolved(
      (a, b) => {
        expectTypeOf(a).toEqualTypeOf<{ id: "a" }>();
        expectTypeOf(b).toEqualTypeOf<{ id: "b" }>();
        return { out: true };
      },
      [A, B],
    );
    expectTypeOf(container.resolve(Out)).toEqualTypeOf<{ out: true }>();
  });

  it("TokenValue maps token and constructor", () => {
    const T = token<number>("n");
    class C {}
    expectTypeOf<TokenValue<typeof T>>().toEqualTypeOf<number>();
    expectTypeOf<TokenValue<typeof C>>().toEqualTypeOf<C>();
    expectTypeOf(T).toExtend<DependencyKey>();
    expectTypeOf(C).toExtend<DependencyKey>();
  });

  it("inject optional widens to undefined union in descriptor", () => {
    const T = token<string>("s");
    const d = optional(T);
    expectTypeOf(d).toExtend<InjectionDescriptor<string | undefined>>();
  });

  it("injectAll marks multi with array value type", () => {
    const T = token<string>("s");
    const d = injectAll(T);
    expectTypeOf(d).toExtend<InjectionDescriptor<string[]>>();
  });

  it("dual-role inject does not use Function#name as slot name", () => {
    const T = token<number>("n");
    const raw = inject(T);
    const d = normalizeToDescriptor(raw);
    expectTypeOf(d.name).toEqualTypeOf<string | undefined>();
    expect(d.name).toBeUndefined();
  });

  it("inject preserves dual-role shape at type level", () => {
    const T = token<number>("n");
    const d = inject(T);
    expectTypeOf(d).toExtend<InjectionDescriptor<number>>();
  });
});
