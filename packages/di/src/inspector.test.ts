import { describe, expect, it } from "vitest";
import { Container } from "#/container";
import { toCytoscapeGraph } from "#/graph-adapters/cytoscape";
import { toDotGraph } from "#/graph-adapters/dot";
import { toReactFlowGraph } from "#/graph-adapters/reactflow";
import { Module } from "#/module";
import { token } from "#/token";
import type { ContainerBindingSnapshot, ContainerSnapshot } from "#/inspector";

const LoggerToken = token<string>("Logger");
const HttpClientToken = token<string>("HttpClient");
const InternalTelemetryToken = token<string>("CODEFAST_DI_InternalProbe");

describe("ContainerInspector", () => {
  it("inspect lists bindings with activation status", () => {
    const container = Container.create();
    container.bind(LoggerToken).toConstantValue("console-logger");
    container
      .bind(HttpClientToken)
      .toResolved((logger) => `http-with-${logger}`, [LoggerToken])
      .singleton();

    const snapshot = container.inspect();
    const json = JSON.stringify(snapshot);
    const parsed = JSON.parse(json) as ContainerSnapshot;
    expect(parsed.bindings).toBeDefined();
    expect(parsed.bindings![0]!.registryKeyLabel).toBe("Logger");
  });

  it("toDotGraph emits digraph, scope colors, and module subgraphs", () => {
    const InfrastructureModule = Module.create("InfraModule", (api) => {
      api.bind(LoggerToken).toConstantValue("console");
      api
        .bind(HttpClientToken)
        .toResolved((log) => `http-${log}`, [LoggerToken])
        .scoped();
    });

    const container = Container.create();
    container.load(InfrastructureModule);

    const dot = toDotGraph(container.generateDependencyGraph());
    expect(dot).toContain("digraph codefast_di");
    expect(dot).toContain("subgraph cluster_InfraModule");
    expect(dot).toContain('label="InfraModule"');
    expect(dot).toContain("fillcolor=lightgray");
    expect(dot).toContain('fillcolor="#FFD700"');
    expect(dot).toContain('fillcolor="#ADD8E6"');
    expect(dot).not.toContain("label=<");
    expect(dot).toContain("->");
    expect(dot).toContain(LoggerToken.name);
    expect(dot).toContain(HttpClientToken.name);
  });

  it("toDotGraph uses dashed edges for alias consumers and can hide internal tokens", () => {
    const container = Container.create();
    container.bind(LoggerToken).toConstantValue("console");
    container.bind(HttpClientToken).toAlias(LoggerToken).singleton();
    container.bind(InternalTelemetryToken).toConstantValue("trace-123");

    const full = toDotGraph(container.generateDependencyGraph());
    expect(full).toContain(InternalTelemetryToken.name);
    expect(full).toMatch(/->.*style=dashed/s);

    const filtered = toDotGraph(container.generateDependencyGraph({ hideInternals: true }));
    expect(filtered).not.toContain(InternalTelemetryToken.name);
    expect(filtered).toContain(LoggerToken.name);
    expect(filtered).toContain(HttpClientToken.name);
  });

  it("generateDependencyGraphJson handles internal filtering and deduplication", () => {
    const container = Container.create();
    container.bind(LoggerToken).toConstantValue("console");
    container.bind(HttpClientToken).toAlias(LoggerToken);
    container.bind(InternalTelemetryToken).toConstantValue("trace-123");
    container.bind(token("SharedService")).toAlias(LoggerToken);

    const data = container.generateDependencyGraph({ hideInternals: true });

    const nodeLabels = data.nodes.map((n: ContainerBindingSnapshot) => n.registryKeyLabel);
    expect(nodeLabels).not.toContain("CODEFAST_DI_InternalProbe");
    expect(data.edges).toBeDefined();
  });

  it("generateDependencyGraph returns json by default", () => {
    const container = Container.create();
    container.bind(LoggerToken).toConstantValue("console");
    const graph = container.generateDependencyGraph();
    expect(graph.nodes).toBeDefined();
    expect(graph.edges).toBeDefined();
  });

  it("toCytoscapeGraph adapts canonical graph with graph metadata", () => {
    const container = Container.create();
    container
      .bind(LoggerToken)
      .toConstantValue("console")
      .when(() => true);
    container.bind(HttpClientToken).toAlias(LoggerToken).singleton();
    container.bind(InternalTelemetryToken).toConstantValue("trace-123");

    const graph = toCytoscapeGraph(container.generateDependencyGraph({ hideInternals: true }));
    expect(graph.elements.nodes.length).toBeGreaterThan(0);
    expect(graph.elements.edges.length).toBeGreaterThan(0);

    const nodeLabels = graph.elements.nodes.map((node) => node.data.label);
    expect(nodeLabels).not.toContain(InternalTelemetryToken.name);

    const aliasEdge = graph.elements.edges.find((edge) => edge.data.isAliasEdge);
    expect(aliasEdge).toBeDefined();
    expect(aliasEdge?.data.toBindingConditional).toBe(true);
    expect(aliasEdge?.data.edgeKind).toBe("sync");
    expect(aliasEdge?.data.resolutionPath.length).toBeGreaterThan(0);
  });

  it("toReactFlowGraph adapts canonical graph with graph metadata", () => {
    const container = Container.create();
    container
      .bind(LoggerToken)
      .toConstantValue("console")
      .when(() => true);
    container.bind(HttpClientToken).toAlias(LoggerToken).singleton();
    container.bind(InternalTelemetryToken).toConstantValue("trace-123");

    const graph = toReactFlowGraph(container.generateDependencyGraph({ hideInternals: true }));
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);

    const nodeLabels = graph.nodes.map((node) => node.data.label);
    expect(nodeLabels).not.toContain(InternalTelemetryToken.name);

    const aliasEdge = graph.edges.find((edge) => edge.data.isAliasEdge);
    expect(aliasEdge).toBeDefined();
    expect(aliasEdge?.data.toBindingConditional).toBe(true);
    expect(aliasEdge?.data.edgeKind).toBe("sync");
    expect(aliasEdge?.data.resolutionPath.length).toBeGreaterThan(0);
    expect(aliasEdge?.source).toBeDefined();
    expect(aliasEdge?.target).toBeDefined();
  });
});
