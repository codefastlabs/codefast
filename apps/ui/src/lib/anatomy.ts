import type { AnatomyNode } from "#/registry/types";

export interface AnatomyRow {
  /** Branch connectors and indentation preceding the name (e.g. `"│   ├── "`). */
  readonly prefix: string;
  readonly name: string;
}

/** Flattens the anatomy tree into display rows, each carrying its ASCII branch prefix. */
export function anatomyToRows(
  nodes: ReadonlyArray<AnatomyNode>,
  ancestorsAreLast: ReadonlyArray<boolean> = [],
): Array<AnatomyRow> {
  const rows: Array<AnatomyRow> = [];

  nodes.forEach((node, index) => {
    const isLast = index === nodes.length - 1;
    const indent = ancestorsAreLast.map((last) => (last ? "    " : "│   ")).join("");
    const connector = ancestorsAreLast.length === 0 ? "" : isLast ? "└── " : "├── ";

    rows.push({ prefix: indent + connector, name: node.name });

    if (node.children?.length) {
      rows.push(...anatomyToRows(node.children, [...ancestorsAreLast, isLast]));
    }
  });

  return rows;
}

/** Renders the anatomy tree as plain text — used for the copy button and markdown export. */
export function anatomyToText(nodes: ReadonlyArray<AnatomyNode>): string {
  return anatomyToRows(nodes)
    .map((row) => row.prefix + row.name)
    .join("\n");
}
