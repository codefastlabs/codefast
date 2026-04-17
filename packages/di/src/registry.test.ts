import { describe, expect, it, vi } from "vitest";
import { type Binding, type BindingIdentifier } from "#/binding";
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

    // Remove console
    registry.removeById("console-id" as BindingIdentifier);
    const bindings = registry.get(LoggerToken);
    expect(bindings).toBeDefined();
    expect(bindings).toHaveLength(1);
    expect(bindings![0]!.id).toBe("file-id");

    // Remove file (last one)
    registry.removeById("file-id" as BindingIdentifier);
    expect(registry.get(LoggerToken)).toBeUndefined();
  });

  it("replaceKeyLastWins notifies on replacement", () => {
    const registry = new BindingRegistry();
    const LoggerToken = token("Logger");
    const oldBinding = mockBinding("old-id");
    const newBinding = mockBinding("new-id");
    const onReplaced = vi.fn();

    registry.add(LoggerToken, oldBinding);
    registry.replaceKeyLastWins(LoggerToken, newBinding, onReplaced);

    expect(onReplaced).toHaveBeenCalledWith(oldBinding);
    const bindings = registry.get(LoggerToken);
    expect(bindings).toHaveLength(1);
    expect(bindings![0]!.id).toBe("new-id");
  });
});
