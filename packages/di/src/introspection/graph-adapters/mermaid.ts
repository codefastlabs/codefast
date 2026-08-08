import type { ContainerGraphJson } from "#/introspection/dependency-graph";

/**
 * Mermaid `flowchart TD` source for a container graph — renders anywhere Mermaid does
 * (GitHub markdown, docs tooling, mermaid.live) with no extra library.
 *
 * @since 0.6.0
 */
export function toMermaidGraph(graph: ContainerGraphJson): string {
  // Mermaid identifiers must stay word-safe; labels carry the real token names.
  const idByNode = new Map<string, string>();
  const lines: Array<string> = ["flowchart TD"];
  const parentIds: Array<string> = [];
  const unboundIds: Array<string> = [];

  graph.nodes.forEach((node, index) => {
    const id = `n${String(index)}`;

    idByNode.set(node.id, id);
    lines.push(`  ${id}["${node.tokenName}<br/>${node.kind} · ${node.scope}"]`);

    if (node.fromParent) {
      parentIds.push(id);
    }

    if (node.kind === "unbound") {
      unboundIds.push(id);
    }
  });

  for (const edge of graph.edges) {
    const from = idByNode.get(edge.from);
    const to = idByNode.get(edge.to);

    if (from === undefined || to === undefined) {
      continue;
    }

    lines.push(edge.label === undefined ? `  ${from} --> ${to}` : `  ${from} -->|"${edge.label}"| ${to}`);
  }

  if (parentIds.length > 0) {
    lines.push("  classDef fromParent stroke-dasharray: 4 4;");
    lines.push(`  class ${parentIds.join(",")} fromParent;`);
  }

  if (unboundIds.length > 0) {
    lines.push("  classDef unbound stroke-dasharray: 4 4,opacity:0.6;");
    lines.push(`  class ${unboundIds.join(",")} unbound;`);
  }

  return lines.join("\n");
}
