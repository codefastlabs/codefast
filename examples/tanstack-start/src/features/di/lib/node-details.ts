import type { PreparedGraph } from "#/features/di/lib/graph-layout";

export interface NodeDetails {
  readonly label: string;
  readonly scope: string;
  readonly kind: string;
  readonly lifetime: string;
  readonly dependsOn: ReadonlyArray<{ readonly label: string; readonly note: string | undefined }>;
  readonly usedBy: ReadonlyArray<string>;
}

/** What the edge says about a dependency, in words — read off the edge fields, never its label. */
function noteFor(edge: PreparedGraph["edges"][number]): string | undefined {
  const parts: Array<string> = [];

  if (edge.slotName !== undefined) {
    parts.push(`slot ${edge.slotName}`);
  }

  if (edge.optional) {
    parts.push("optional");
  }

  return parts.length > 0 ? parts.join(" · ") : undefined;
}

/** Everything the details panel shows for one binding, or undefined when nothing is selected. */
export function describeNode(graph: PreparedGraph, selectedId: string | undefined): NodeDetails | undefined {
  const node = graph.nodes.find((candidate) => candidate.id === selectedId);

  if (node === undefined) {
    return undefined;
  }

  const labelOf = (id: string): string => graph.nodes.find((candidate) => candidate.id === id)?.data.label ?? id;
  const unbound = node.data.kind === "unbound";

  return {
    label: node.data.label,
    scope: unbound ? "—" : node.data.scope,
    kind: node.data.kind,
    lifetime: unbound ? "—" : node.data.fromParent ? "root container" : "request child",
    dependsOn: graph.edges
      .filter((edge) => edge.source === node.id)
      .map((edge) => ({ label: labelOf(edge.target), note: noteFor(edge) })),
    usedBy: graph.edges.filter((edge) => edge.target === node.id).map((edge) => labelOf(edge.source)),
  };
}
