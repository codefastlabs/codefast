import type { StaticDependencyEdge } from "#/dependency-graph";
import type { ContainerGraphJson } from "#/inspector";
import type { ReactFlowEdge, ReactFlowGraphJson, ReactFlowNode } from "#/graph-adapters/types";

const DEFAULT_X_GAP = 240;
const DEFAULT_Y_GAP = 110;

/**
 * Converts the canonical container graph JSON into React Flow nodes/edges format.
 */
export function toReactFlowGraph(graph: ContainerGraphJson): ReactFlowGraphJson {
  const nodes: ReactFlowNode[] = graph.nodes.map((node, index) => ({
    id: node.bindingId,
    position: {
      x: 0,
      y: index * DEFAULT_Y_GAP,
    },
    data: {
      label: node.registryKeyLabel,
      bindingId: node.bindingId,
      kind: node.kind,
      scope: node.scope,
      activationStatus: node.activationStatus,
      hasConditionalConstraint: node.hasConditionalConstraint,
      ...(node.moduleId === undefined ? {} : { moduleId: node.moduleId }),
    },
  }));

  const edges: ReactFlowEdge[] = graph.edges.map((edge) => ({
    id: edgeIdForReactFlow(edge),
    source: edge.fromBindingId,
    target: edge.toBindingId,
    label: edgeLabelForReactFlow(edge),
    data: {
      edgeKind: edge.edgeKind,
      ...(edge.injectHintLabel === undefined ? {} : { injectHintLabel: edge.injectHintLabel }),
      toBindingConditional: edge.toBindingConditional,
      isAliasEdge: edge.isAliasEdge,
      resolutionPath: [...edge.resolutionPath],
    },
  }));

  // Spread nodes on x-axis by module buckets when present.
  const moduleIndex = new Map<string, number>();
  let nextColumn = 1;
  const normalizedNodes = nodes.map((node) => {
    const moduleId = node.data.moduleId;
    if (moduleId === undefined) {
      return node;
    }
    const existingColumn = moduleIndex.get(moduleId);
    if (existingColumn !== undefined) {
      return {
        ...node,
        position: { ...node.position, x: existingColumn * DEFAULT_X_GAP },
      };
    }
    const column = nextColumn;
    nextColumn += 1;
    moduleIndex.set(moduleId, column);
    return {
      ...node,
      position: { ...node.position, x: column * DEFAULT_X_GAP },
    };
  });

  return { nodes: normalizedNodes, edges };
}

function edgeLabelForReactFlow(edge: StaticDependencyEdge): string {
  const parts: string[] = [];
  if (edge.injectHintLabel !== undefined) {
    parts.push(edge.injectHintLabel);
  }
  parts.push(edge.edgeKind);
  if (edge.toBindingConditional) {
    parts.push("conditional");
  }
  return parts.join(" | ");
}

function edgeIdForReactFlow(edge: StaticDependencyEdge): string {
  const hint = edge.injectHintLabel ?? "";
  const conditional = edge.toBindingConditional ? "conditional" : "plain";
  const alias = edge.isAliasEdge ? "alias" : "direct";
  const path = edge.resolutionPath.join("->");
  return `${edge.fromBindingId}->${edge.toBindingId}:${edge.edgeKind}:${hint}:${conditional}:${alias}:${path}`;
}
