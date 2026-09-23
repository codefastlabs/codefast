import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { binding } from "#core/binding-declaration";
import type { BindingDeclaration } from "#core/binding-declaration";
import { Module } from "#core/module";
import { tag } from "#core/tag";
import { token } from "#core/token";
import { InvalidBindingDeclarationError } from "#errors/errors";

const Port = token<number, "admin">("bd-unit:Port");
const Region = tag<"eu" | "us">("bd-unit:region");

/** `binding()` as plain JavaScript reaches it, with every compile-time check out of the way. */
const looseBinding = binding as (key: unknown, definition: object) => BindingDeclaration;

function reasonOf(declare: () => unknown): string | undefined {
  try {
    declare();
  } catch (error) {
    if (error instanceof InvalidBindingDeclarationError) {
      return error.reason;
    }
    throw error;
  }
  return undefined;
}

describe("binding() checks what the compiler cannot reach", () => {
  it("names the token and the rule it broke", () => {
    let caught: unknown;
    try {
      looseBinding(Port, { toConstantValue: 1, scope: "transient" });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(InvalidBindingDeclarationError);
    expect(caught).toMatchObject({
      code: "INVALID_BINDING_DECLARATION",
      tokenName: "bd-unit:Port",
      reason: "`toConstantValue` takes no `scope`",
    });
  });

  it("rejects a key no strategy allows", () => {
    expect(reasonOf(() => looseBinding(Port, { toConstantValue: 1, whenname: "admin" }))).toBe(
      "`whenname` is not a definition key",
    );
  });

  it("counts a strategy key by its presence, so a constant may be undefined", () => {
    const Maybe = token<number | undefined>("bd-unit:Maybe");
    const container = Container.fromModules(
      Module.fromBindings("bd-unit:Maybe", [binding(Maybe, { toConstantValue: undefined })]),
    );

    expect(container.has(Maybe)).toBe(true);
    expect(container.resolve(Maybe)).toBeUndefined();
    expect(reasonOf(() => looseBinding(Port, { toConstantValue: 1, toDynamic: undefined }))).toBe(
      "it names two strategies, `toConstantValue` and `toDynamic`",
    );
  });

  it("rejects flags and scopes outside their values", () => {
    expect(reasonOf(() => looseBinding(Port, { toDynamic: () => 1, scope: "request" }))).toBe(
      "`scope` is not one of singleton, transient or scoped",
    );
    expect(reasonOf(() => looseBinding(Port, { toConstantValue: 1, many: false }))).toBe("`many` takes `true`");
    expect(reasonOf(() => looseBinding(class Keyed {}, { toSelf: false }))).toBe("`toSelf` takes `true`");
  });

  it("asks a resolved factory for its deps", () => {
    expect(reasonOf(() => looseBinding(Port, { toResolved: () => 1 }))).toBe("`toResolved` needs `deps`, an array");
  });

  it("treats an undefined slot, scope or hook as absent", () => {
    const declared = binding(Port, {
      toDynamic: () => 7,
      whenNamed: undefined,
      whenTagged: undefined,
      when: undefined,
      scope: undefined,
      onActivation: undefined,
    });
    const container = Container.fromModules(Module.fromBindings("bd-unit:Absent", [declared]));

    expect(container.resolve(Port)).toBe(7);
    expect(container.inspect().ownBindings.map((entry) => entry.scope)).toStrictEqual(["transient"]);
  });

  it("keeps the last criterion of a key repeated in whenTagged", () => {
    const container = Container.fromModules(
      Module.fromBindings("bd-unit:Tagged", [
        binding(Port, { toConstantValue: 1, whenTagged: [Region.of("eu"), Region.of("us")] }),
      ]),
    );

    expect(container.resolveOptional(Port, { tag: Region.of("us") })).toBe(1);
    expect(container.resolveOptional(Port, { tag: Region.of("eu") })).toBeUndefined();
  });
});
