import { describe, expect, it } from "vitest";
import { Container, token } from "../src/index";

const TA = token<string>("A");
const TB = token<string>("B");

describe("ContainerInspector", () => {
  it("getSnapshot lists bindings with activation status", () => {
    const container = Container.create();
    container.bind(TA).toConstantValue("a").singleton().build();
    container
      .bind(TB)
      .toResolved((a) => `${a}b`, [TA])
      .singleton()
      .build();

    const inspector = container.inspect();
    const snapshot = inspector.getSnapshot();
    expect(snapshot.bindings.length).toBe(2);
    expect(snapshot.bindings.map((row) => row.kind).sort()).toEqual(["constant", "resolved"]);
    const transientRow = snapshot.bindings.find((row) => row.scope === "transient");
    expect(transientRow).toBeUndefined();
  });

  it("generateDotGraph emits a digraph with nodes and edges", () => {
    const container = Container.create();
    container.bind(TA).toConstantValue("a").singleton().build();
    container
      .bind(TB)
      .toResolved((a) => `${a}b`, [TA])
      .singleton()
      .build();

    const dot = container.inspect().generateDotGraph();
    expect(dot).toContain("digraph codefast_di");
    expect(dot).toContain("->");
    expect(dot).toContain(TA.name);
    expect(dot).toContain(TB.name);
  });
});
