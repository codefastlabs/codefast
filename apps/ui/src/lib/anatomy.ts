import type { AnatomyNode } from "#/registry/types";

export interface AnatomyRow {
  /** Branch connectors and indentation preceding the name (e.g. `"│   ├── "`). */
  readonly prefix: string;
  readonly name: string;
}

/** Appends a subtree's rows with `tree`-style connectors; `ancestorsAreLast` excludes the root. */
function collectBranches(
  nodes: ReadonlyArray<AnatomyNode>,
  ancestorsAreLast: ReadonlyArray<boolean>,
  rows: Array<AnatomyRow>,
): void {
  nodes.forEach((node, index) => {
    const isLast = index === nodes.length - 1;
    const indent = ancestorsAreLast.map((last) => (last ? "    " : "│   ")).join("");

    rows.push({ prefix: indent + (isLast ? "└── " : "├── "), name: node.name });

    if (node.children?.length) {
      collectBranches(node.children, [...ancestorsAreLast, isLast], rows);
    }
  });
}

/**
 * Flattens the anatomy tree into display rows. Top-level parts are column-0
 * labels; only their descendants carry `tree`-style branch prefixes.
 */
export function anatomyToRows(nodes: ReadonlyArray<AnatomyNode>): Array<AnatomyRow> {
  const rows: Array<AnatomyRow> = [];

  for (const node of nodes) {
    rows.push({ prefix: "", name: node.name });

    if (node.children?.length) {
      collectBranches(node.children, [], rows);
    }
  }

  return rows;
}

/** Renders the anatomy tree as plain text — used for the copy button and markdown export. */
export function anatomyToText(nodes: ReadonlyArray<AnatomyNode>): string {
  return anatomyToRows(nodes)
    .map((row) => row.prefix + row.name)
    .join("\n");
}
