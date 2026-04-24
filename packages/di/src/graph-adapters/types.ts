import type { Binding, BindingIdentifier, BindingScope } from "#/binding";
import type { StaticDependencyEdge } from "#/dependency-graph";
export type CytoscapeNodeData = {
  readonly id: string;
  readonly label: string;
  readonly bindingId: BindingIdentifier;
  readonly kind: Binding<unknown>["kind"];
  readonly scope: BindingScope;
  readonly activationStatus: "cached" | "not-cached" | "transient";
  readonly hasConditionalConstraint: boolean;
  readonly moduleId?: string;
};
export type CytoscapeEdgeData = {
  readonly id: string;
  readonly source: StaticDependencyEdge["fromBindingId"];
  readonly target: StaticDependencyEdge["toBindingId"];
  readonly edgeKind: StaticDependencyEdge["edgeKind"];
  readonly injectHintLabel?: string;
  readonly isToBindingConditional: boolean;
  readonly isAliasEdge: boolean;
  readonly resolutionPath: readonly string[];
};
export type CytoscapeNode = {
  readonly data: CytoscapeNodeData;
};
export type CytoscapeEdge = {
  readonly data: CytoscapeEdgeData;
};
export type CytoscapeGraphJson = {
  readonly elements: {
    readonly nodes: CytoscapeNode[];
    readonly edges: CytoscapeEdge[];
  };
};
export type ReactFlowNodeData = {
  readonly label: string;
  readonly bindingId: BindingIdentifier;
  readonly kind: Binding<unknown>["kind"];
  readonly scope: BindingScope;
  readonly activationStatus: "cached" | "not-cached" | "transient";
  readonly hasConditionalConstraint: boolean;
  readonly moduleId?: string;
};
export type ReactFlowEdgeData = {
  readonly edgeKind: StaticDependencyEdge["edgeKind"];
  readonly injectHintLabel?: string;
  readonly isToBindingConditional: boolean;
  readonly isAliasEdge: boolean;
  readonly resolutionPath: readonly string[];
};
export type ReactFlowNode = {
  readonly id: string;
  readonly position: {
    readonly x: number;
    readonly y: number;
  };
  readonly data: ReactFlowNodeData;
};
export type ReactFlowEdge = {
  readonly id: string;
  readonly source: StaticDependencyEdge["fromBindingId"];
  readonly target: StaticDependencyEdge["toBindingId"];
  readonly label: string;
  readonly data: ReactFlowEdgeData;
};
export type ReactFlowGraphJson = {
  readonly nodes: ReactFlowNode[];
  readonly edges: ReactFlowEdge[];
};
