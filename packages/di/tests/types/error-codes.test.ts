/**
 * `DiErrorCode` is the union a caller branches on, so it must name every error's code and nothing else.
 */
import { describe, expectTypeOf, it } from "vitest";

import type * as errors from "#errors";
import type { DiError, DiErrorCode } from "#errors";

// The abstract base is left out by name: a subclass with no constructor arguments is assignable to it.
type ErrorClasses = {
  [Name in Exclude<keyof typeof errors, "DiError">]: (typeof errors)[Name] extends abstract new (
    ...args: never
  ) => DiError
    ? (typeof errors)[Name]
    : never;
}[Exclude<keyof typeof errors, "DiError">];

type CodeOf<Class> = Class extends abstract new (...args: never) => infer Instance
  ? Instance extends { readonly code: infer Code }
    ? Code
    : never
  : never;

describe("DiErrorCode", () => {
  it("is exactly the codes the error classes carry", () => {
    expectTypeOf<Exclude<CodeOf<ErrorClasses>, DiErrorCode>>().toBeNever();
    expectTypeOf<Exclude<DiErrorCode, CodeOf<ErrorClasses>>>().toBeNever();
  });

  it("narrows a caught error's code to the union", () => {
    expectTypeOf<DiError["code"]>().toEqualTypeOf<DiErrorCode>();
  });
});
