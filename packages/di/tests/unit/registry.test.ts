import { describe, expect, it } from "vitest";
import type { Binding, BindingIdentifier } from "#/binding";
import { BindingRegistry } from "#/registry";
import { token } from "#/token";
function mockBinding(id: string): Binding<unknown> {
  return {
    id: id as BindingIdentifier,
    scope: "singleton",
    kind: "constant",
    value: null,
    tags: new Map(),
  };
}
describe("BindingRegistry", () => {
  it("removeById filters lists and removes empty entries", () => {
    const registry = new BindingRegistry();
    const LoggerToken = token("Logger");
    const consoleBinding = mockBinding("console-id");
    const fileBinding = mockBinding("file-id");
    registry.add(LoggerToken, consoleBinding);
    registry.add(LoggerToken, fileBinding);
    registry.removeById("console-id" as BindingIdentifier);
    const bindings = registry.get(LoggerToken);
    expect(bindings).toBeDefined();
    expect(bindings).toHaveLength(1);
    expect(bindings![0]!.id).toBe("file-id");
    registry.removeById("file-id" as BindingIdentifier);
    expect(registry.get(LoggerToken)).toBeUndefined();
  });
});
