import { describe, expect, it } from "vitest";
import { Container } from "#/container";
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

  it("generateDependencyGraphDot emits digraph, scope colors, and module subgraphs", () => {
    const InfrastructureModule = Module.create("InfraModule", (api) => {
      api.bind(LoggerToken).toConstantValue("console");
      api
        .bind(HttpClientToken)
        .toResolved((log) => `http-${log}`, [LoggerToken])
        .scoped();
    });

    const container = Container.create();
    container.load(InfrastructureModule);

    const dot = container.generateDependencyGraphDot();
    expect(dot).toContain("digraph codefast_di");
    expect(dot).toContain("subgraph cluster_InfraModule");
    expect(dot).toContain('label="InfraModule"');
    expect(dot).toContain("fillcolor=lightgray");
    expect(dot).toContain('fillcolor="#FFD700"');
    expect(dot).toContain('fillcolor="#ADD8E6"');
    expect(dot).toContain("->");
    expect(dot).toContain(LoggerToken.name);
    expect(dot).toContain(HttpClientToken.name);
  });

  it("generateDependencyGraphDot uses dashed edges for alias consumers and can hide internal tokens", () => {
    const container = Container.create();
    container.bind(LoggerToken).toConstantValue("console");
    container.bind(HttpClientToken).toAlias(LoggerToken).singleton();
    container.bind(InternalTelemetryToken).toConstantValue("trace-123");

    const full = container.generateDependencyGraphDot();
    expect(full).toContain(InternalTelemetryToken.name);
    expect(full).toMatch(/->.*style=dashed/s);

    const filtered = container.generateDependencyGraphDot({ hideInternals: true });
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

    const jsonStr = container.generateDependencyGraphJson({ hideInternals: true });
    const data = JSON.parse(jsonStr) as { nodes: ContainerBindingSnapshot[]; edges: unknown[] };

    const nodeLabels = data.nodes.map((n) => n.registryKeyLabel);
    expect(nodeLabels).not.toContain("CODEFAST_DI_InternalProbe");
    expect(data.edges).toBeDefined();
  });
});
