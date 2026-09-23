import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { binding } from "#core/binding-declaration";
import type { BindingDeclaration } from "#core/binding-declaration";
import { Module } from "#core/module";
import type { SyncModule } from "#core/module";
import { token } from "#core/token";
import { InvalidBindingDeclarationError } from "#errors/errors";

const Port = token<number>("module-unit:Port");

/** `Module.fromBindings` as plain JavaScript reaches it, with list entries the types never checked. */
function fromUntypedList(name: string, entries: ReadonlyArray<unknown>): SyncModule {
  return Module.fromBindings(name, entries as ReadonlyArray<BindingDeclaration>);
}

describe("Module.fromBindings", () => {
  it("rejects an entry binding() did not make, naming the module and the position", () => {
    let caught: unknown;
    try {
      fromUntypedList("module-unit:Forged", [binding(Port, { toConstantValue: 1 }), { toConstantValue: 2 }]);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(InvalidBindingDeclarationError);
    expect(caught).toMatchObject({ tokenName: "module-unit:Forged[1]" });
    // Plain JavaScript can list `null`: still the library's error, never a TypeError from reading it.
    expect(() => fromUntypedList("module-unit:Null", [null])).toThrow(InvalidBindingDeclarationError);
  });

  it("loads what the list held when the module was made", () => {
    const declarations = [binding(Port, { toConstantValue: 1 })];
    const declared = Module.fromBindings("module-unit:Copied", declarations);
    declarations.push(binding(Port, { toConstantValue: 2 }));

    expect(Container.fromModules(declared).resolveAll(Port)).toStrictEqual([1]);
  });

  it("builds bindings of its own in every container it loads into", () => {
    class Service {}
    const declared = Module.fromBindings("module-unit:Shared", [
      binding(Service, { toSelf: true, scope: "singleton" }),
    ]);
    const first = Container.fromModules(declared);
    const second = Container.fromModules(declared);

    expect(first.resolve(Service)).toBe(first.resolve(Service));
    expect(first.resolve(Service)).not.toBe(second.resolve(Service));
    expect(first.inspect().ownBindings[0]!.id).not.toBe(second.inspect().ownBindings[0]!.id);
  });

  it("is reference-counted and unloaded like any module", () => {
    const declared = Module.fromBindings("module-unit:Counted", [binding(Port, { toConstantValue: 1 })]);
    const container = Container.create();
    container.load(declared);
    container.load(declared);

    container.unload(declared);
    expect(container.has(Port)).toBe(true);
    container.unload(declared);
    expect(container.has(Port)).toBe(false);
  });

  it("loads on the async lane too", async () => {
    const declared = Module.fromBindings("module-unit:Async", [binding(Port, { toConstantValue: 1 })]);
    const container = Container.create();
    await container.loadAsync(declared);

    expect(container.resolve(Port)).toBe(1);
  });
});
