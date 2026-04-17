import { describe, expect, it } from "vitest";
import { Container } from "#/container";
import { Module } from "#/module";
import { token } from "#/token";

const TA = token<string>("A");
const TB = token<string>("B");
const TInternal = token<string>("CODEFAST_DI_InternalProbe");

describe("ContainerInspector", () => {
  it("inspect lists bindings with activation status", () => {
    const container = Container.create();
    container.bind(TA).toConstantValue("a");
    container
      .bind(TB)
      .toResolved((a) => `${a}b`, [TA])
      .singleton();

    const snapshot = container.inspect();
    expect(snapshot.bindings.length).toBe(2);
    expect(snapshot.bindings.map((row) => row.kind).sort()).toEqual(["constant", "resolved"]);
    const transientRow = snapshot.bindings.find((row) => row.scope === "transient");
    expect(transientRow).toBeUndefined();
  });

  it("generateDependencyGraphDot emits digraph, scope colors, and module subgraphs", () => {
    const FeatureMod = Module.create("FeatureModule", (api) => {
      api.bind(TA).toConstantValue("a");
      api
        .bind(TB)
        .toResolved((a) => `${a}b`, [TA])
        .scoped();
    });

    const container = Container.create();
    container.load(FeatureMod);

    const dot = container.generateDependencyGraphDot();
    expect(dot).toContain("digraph codefast_di");
    expect(dot).toContain("subgraph cluster_FeatureModule");
    expect(dot).toContain('label="FeatureModule"');
    expect(dot).toContain("fillcolor=lightgray");
    expect(dot).toContain('fillcolor="#FFD700"');
    expect(dot).toContain('fillcolor="#ADD8E6"');
    expect(dot).toContain("->");
    expect(dot).toContain(TA.name);
    expect(dot).toContain(TB.name);
  });

  it("generateDependencyGraphDot uses dashed edges for alias consumers and can hide internal tokens", () => {
    const container = Container.create();
    container.bind(TA).toConstantValue("a");
    container.bind(TB).toAlias(TA).singleton();
    container.bind(TInternal).toConstantValue("x");

    const full = container.generateDependencyGraphDot();
    expect(full).toContain(TInternal.name);
    expect(full).toMatch(/->.*style=dashed/s);

    const filtered = container.generateDependencyGraphDot({ hideInternals: true });
    expect(filtered).not.toContain(TInternal.name);
    expect(filtered).toContain(TA.name);
    expect(filtered).toContain(TB.name);
  });
});
