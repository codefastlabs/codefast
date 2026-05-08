import type { ContainerGraphJson } from "#/dependency-graph";

/**
 * @since 0.3.16-canary.0
 */
export function toDotGraph(graph: ContainerGraphJson): string {
  const lines: Array<string> = ["digraph DI {", "  rankdir=TB;"];

  for (const node of graph.nodes) {
    const label = `${node.tokenName}\\n[${node.kind}/${node.scope}]`;
    const style = node.fromParent ? ' style="dashed"' : "";
    lines.push(`  "${node.id}" [label="${label}"${style}];`);
  }

  for (const edge of graph.edges) {
    const label = edge.label !== undefined ? ` [label="${edge.label}"]` : "";
    lines.push(`  "${edge.from}" -> "${edge.to}"${label};`);
  }

  lines.push("}");
  return lines.join("\n");
}
