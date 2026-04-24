import type { BindingScope } from "#/binding";
import type { ContainerBindingSnapshot, ContainerGraphJson } from "#/inspector";
export function toDotGraph(graph: ContainerGraphJson): string {
  const lines: string[] = [
    "digraph codefast_di {",
    "  rankdir=LR;",
    '  graph [fontname="Arial", fontsize=12, nodesep=0.8, ranksep=1.2];',
    '  node  [fontname="Arial", fontsize=12, shape=box, style="filled,rounded", fillcolor="#F5F5F5"];',
    '  edge  [fontname="Arial", fontsize=10];',
  ];
  const byModule = new Map<string | undefined, ContainerBindingSnapshot[]>();
  for (const node of graph.nodes) {
    const group = byModule.get(node.moduleId);
    if (group === undefined) {
      byModule.set(node.moduleId, [node]);
    } else {
      group.push(node);
    }
  }
  const moduleGroups = [...byModule.entries()].filter(
    (entry): entry is [string, ContainerBindingSnapshot[]] => entry[0] !== undefined,
  );
  const ungrouped = byModule.get(undefined) ?? [];
  for (const [moduleName, nodes] of moduleGroups) {
    const clusterId = sanitizeClusterId(moduleName);
    lines.push(`  subgraph cluster_${clusterId} {`);
    lines.push(`    label="${dotEscapeLabel(moduleName)}";`);
    lines.push("    style=filled;");
    lines.push("    fillcolor=lightgray;");
    for (const node of nodes) {
      lines.push(nodeAttributeLine(node, "    "));
    }
    lines.push("  }");
  }
  for (const node of ungrouped) {
    lines.push(nodeAttributeLine(node, "  "));
  }
  const emittedNodeIds = new Set(graph.nodes.map((node) => node.bindingId));
  const edgeSeen = new Set<string>();
  for (const edge of graph.edges) {
    const edgeKey = `${edge.fromBindingId}->${edge.toBindingId}:${edge.edgeKind}:${edge.injectHintLabel ?? ""}`;
    if (edgeSeen.has(edgeKey)) {
      continue;
    }
    edgeSeen.add(edgeKey);
    if (!emittedNodeIds.has(edge.fromBindingId)) {
      emittedNodeIds.add(edge.fromBindingId);
      lines.push(
        `  "${dotEscapeId(edge.fromBindingId)}" [shape=box, style=dashed, label="(unlisted ${dotEscapeLabel(edge.fromBindingId)})"];`,
      );
    }
    if (!emittedNodeIds.has(edge.toBindingId)) {
      emittedNodeIds.add(edge.toBindingId);
      lines.push(
        `  "${dotEscapeId(edge.toBindingId)}" [shape=box, style=dashed, label="(unlisted ${dotEscapeLabel(edge.toBindingId)})"];`,
      );
    }
    const labelParts: string[] = [];
    if (edge.injectHintLabel !== undefined) {
      labelParts.push(edge.injectHintLabel);
    }
    labelParts.push(edge.edgeKind);
    if (edge.isToBindingConditional) {
      labelParts.push("conditional");
    }
    const edgeLabel = dotEscapeLabel(labelParts.join(" | "));
    const pathLabel = dotEscapeLabel(edge.resolutionPath.join(" -> "));
    const edgeStyle = edge.isAliasEdge ? ", style=dashed" : "";
    lines.push(
      `  "${dotEscapeId(edge.fromBindingId)}" -> "${dotEscapeId(edge.toBindingId)}" [label="${edgeLabel}", xlabel="${pathLabel}"${edgeStyle}];`,
    );
  }
  lines.push("}");
  return lines.join("\n");
}
function nodeAttributeLine(node: ContainerBindingSnapshot, indent: string): string {
  const shape = nodeShapeForKind(node.kind);
  const scopeAttrs = scopeVisualAttributes(node.scope);
  const labelLines = [node.kind, node.registryKeyLabel, `scope=${node.scope}`];
  if (node.hasConditionalConstraint) {
    labelLines.push("when(...)");
  }
  return `${indent}"${dotEscapeId(node.bindingId)}" [shape=${shape}, ${scopeAttrs}, label="${dotEscapeLabel(labelLines.join("\n"))}"];`;
}
function dotEscapeLabel(text: string): string {
  return text.replaceAll("\\", "\\\\").replaceAll('"', '\\"').replaceAll("\n", "\\n");
}
function dotEscapeId(id: string): string {
  return id.replaceAll("\\", "\\\\").replaceAll('"', '\\"').replaceAll("\n", "\\n");
}
function nodeShapeForKind(kind: ContainerBindingSnapshot["kind"]): string {
  switch (kind) {
    case "constant":
      return "ellipse";
    case "class":
      return "box";
    case "dynamic":
    case "async-dynamic":
    case "resolved":
      return "diamond";
    case "alias":
      return "octagon";
    default: {
      const exhaustiveCheck: never = kind;
      return exhaustiveCheck;
    }
  }
}
function scopeVisualAttributes(scope: BindingScope): string {
  switch (scope) {
    case "singleton":
      return 'style="filled", fillcolor="#FFD700", penwidth=2';
    case "scoped":
      return 'style="filled", fillcolor="#ADD8E6"';
    case "transient":
      return 'style="dashed"';
    default: {
      const exhaustive: never = scope;
      return exhaustive;
    }
  }
}
function sanitizeClusterId(moduleName: string): string {
  return moduleName.replace(/[^0-9a-zA-Z_]/g, "_");
}
