/**
 * `Binding<Value>` must stay assignable to `Binding`, because the engine's internal lanes take the
 * erased type and cast to `Value` only at the public entry points, where the caller's token is the
 * claim. Declaring the lifecycle hooks as function-typed **properties** breaks that — `Value` sits in
 * a parameter position, `strictFunctionTypes` makes the binding invariant, and every internal
 * signature has to grow either a cast or a structural stand-in for the shape it wants. Method syntax
 * compares those parameters bivariantly, which is what keeps the erasure possible.
 */
import { describe, expectTypeOf, it } from "vitest";

import type {
  AliasBinding,
  Binding,
  ClassBinding,
  ConstantBinding,
  DynamicAsyncBinding,
  DynamicBinding,
  ResolvedAsyncBinding,
  ResolvedBinding,
} from "#/core/binding";
import type { ActivationHandler, ResolutionContext } from "#/core/types";

describe("a binding of a concrete value is still a binding", () => {
  it("widens to the erased union", () => {
    expectTypeOf<Binding<string>>().toExtend<Binding>();
    expectTypeOf<Binding<{ readonly nested: number }>>().toExtend<Binding>();
  });

  it("widens for every kind", () => {
    expectTypeOf<ClassBinding<string>>().toExtend<ClassBinding<unknown>>();
    expectTypeOf<DynamicBinding<string>>().toExtend<DynamicBinding<unknown>>();
    expectTypeOf<DynamicAsyncBinding<string>>().toExtend<DynamicAsyncBinding<unknown>>();
    expectTypeOf<ResolvedBinding<string>>().toExtend<ResolvedBinding<unknown>>();
    expectTypeOf<ResolvedAsyncBinding<string>>().toExtend<ResolvedAsyncBinding<unknown>>();
    expectTypeOf<ConstantBinding<string>>().toExtend<ConstantBinding<unknown>>();
    expectTypeOf<AliasBinding<string>>().toExtend<AliasBinding<unknown>>();
  });

  it("still accepts a handler written against the concrete value", () => {
    // The bivariance is confined to reading the field off a binding. A user's handler is checked
    // against `ActivationHandler<Value>`, which is a function-typed property and stays strict.
    const handler: ActivationHandler<string> = (_ctx: ResolutionContext, instance: string) => instance.toUpperCase();

    expectTypeOf(handler).toExtend<NonNullable<ClassBinding<string>["onActivation"]>>();
    expectTypeOf<ActivationHandler<string>>().parameter(1).toEqualTypeOf<string>();
  });
});
