import { indentOfLineContaining } from "#lib/arrange/ast/utils";

export function escapeTsStringLiteralContent(group: string): string {
  return group.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

/**
 * Multiline fragment for use *inside* an existing `cn(...)` — replaces one
 * string argument with several, without producing `cn(cn(...))`.
 */
export function formatCnArguments(
  groups: string[],
  options?: {
    indent?: string;
    commaAfterLastGroup?: boolean;
    trailingClassName?: boolean;
  },
): string {
  const indent = options?.indent ?? "  ";
  const commaAfterLast = options?.commaAfterLastGroup ?? options?.trailingClassName ?? false;
  const lines: string[] = [];
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const comma = i < groups.length - 1 || commaAfterLast ? "," : "";
    lines.push(`${indent}"${escapeTsStringLiteralContent(group)}"${comma}`);
  }
  if (options?.trailingClassName) {
    lines.push(`${indent}className,`);
  }
  return lines.join("\n");
}

export function formatCnCall(groups: string[], options?: { trailingClassName?: boolean }): string {
  const lines: string[] = ["cn("];
  const commaOnEachStringLine = groups.length > 1 || Boolean(options?.trailingClassName);
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const comma = commaOnEachStringLine ? "," : "";
    lines.push(`  "${escapeTsStringLiteralContent(group)}"${comma}`);
  }
  if (options?.trailingClassName) {
    lines.push("  className,");
  }
  lines.push(")");
  return lines.join("\n");
}

export function formatArray(groups: string[]): string {
  const lines: string[] = ["["];
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const comma = i < groups.length - 1 || groups.length > 1 ? "," : "";
    lines.push(`  "${escapeTsStringLiteralContent(group)}"${comma}`);
  }
  lines.push("]");
  return lines.join("\n");
}

export function formatJsxCnAttributeValue(
  groups: string[],
  source: string,
  valueNodeStart: number,
): string {
  const baseIndent = indentOfLineContaining(source, valueNodeStart);
  const argIndent = `${baseIndent}  `;
  const inner = formatCnArguments(groups, {
    indent: argIndent,
    commaAfterLastGroup: groups.length > 1,
  });
  return `{cn(\n${inner}\n${baseIndent})}`;
}
