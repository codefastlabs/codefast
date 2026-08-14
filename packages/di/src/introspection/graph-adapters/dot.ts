import type { ContainerGraphJson } from "#/introspection/dependency-graph";

// Token names are caller-supplied and land inside DOT quoted strings — ids included, since an
// unbound placeholder id embeds the name it was minted from.
function escapeDotString(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

/**
 * @since 0.3.16-canary.0
 */
export function toDotGraph(graph: ContainerGraphJson): string {
  const lines: Array<string> = ["digraph DI {", "  rankdir=TB;"];

  for (const node of graph.nodes) {
    const label = `${escapeDotString(node.tokenName)}\\n[${node.kind}/${node.scope}]`;
    // Dashed for anything that is not a live binding of this container: the parent chain
    // and unbound-optional placeholders.
    const style = node.fromParent || node.kind === "unbound" ? ' style="dashed"' : "";
    lines.push(`  "${escapeDotString(node.id)}" [label="${label}"${style}];`);
  }

  for (const edge of graph.edges) {
    const label = edge.label === undefined ? "" : ` [label="${escapeDotString(edge.label)}"]`;
    lines.push(`  "${escapeDotString(edge.from)}" -> "${escapeDotString(edge.to)}"${label};`);
  }

  lines.push("}");
  return lines.join("\n");
}
