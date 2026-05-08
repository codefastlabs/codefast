import { indentOfLineContaining } from "#/core/source-text-edit";

/**
 * @since 0.3.16-canary.0
 */
export function escapeTsStringLiteralContent(group: string): string {
  return group.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

/** Trailing comma on multiline Tailwind group lists (matches prior `cn` / `tv` array style). */
function commaAfterTailwindGroupLine(groupIndex: number, groupCount: number): string {
  return groupIndex < groupCount - 1 || groupCount > 1 ? "," : "";
}

/**
 * Multiline fragment for use *inside* an existing `cn(...)` — replaces one
 * string argument with several, without producing `cn(cn(...))`.
 */
function formatCnArguments(
  groups: Array<string>,
  options?: {
    indent?: string;
    commaAfterLastGroup?: boolean;
    trailingClassName?: boolean;
  },
): string {
  const indent = options?.indent ?? "  ";
  const commaAfterLast = options?.commaAfterLastGroup ?? options?.trailingClassName ?? false;
  const lines: Array<string> = [];
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    if (group === undefined) {
      throw new Error("invariant: formatCnArguments group missing");
    }
    const comma = i < groups.length - 1 || commaAfterLast ? "," : "";
    lines.push(`${indent}"${escapeTsStringLiteralContent(group)}"${comma}`);
  }
  if (options?.trailingClassName) {
    lines.push(`${indent}className,`);
  }
  return lines.join("\n");
}

/**
 * @since 0.3.16-canary.0
 */
export function formatCnCall(
  groups: Array<string>,
  options?: { trailingClassName?: boolean },
): string {
  const lines: Array<string> = ["cn("];
  const commaOnEachStringLine = groups.length > 1 || Boolean(options?.trailingClassName);
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    if (group === undefined) {
      throw new Error("invariant: formatCnCall group missing");
    }
    const comma = commaOnEachStringLine ? "," : "";
    lines.push(`  "${escapeTsStringLiteralContent(group)}"${comma}`);
  }
  if (options?.trailingClassName) {
    lines.push("  className,");
  }
  lines.push(")");
  return lines.join("\n");
}

/**
 * @since 0.3.16-canary.0
 */
export function formatArray(groups: Array<string>): string {
  const lines: Array<string> = ["["];
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    if (group === undefined) {
      throw new Error("invariant: formatArray group missing");
    }
    const comma = commaAfterTailwindGroupLine(i, groups.length);
    lines.push(`  "${escapeTsStringLiteralContent(group)}"${comma}`);
  }
  lines.push("]");
  return lines.join("\n");
}

/**
 * Multiple string literals as sequential lines for insertion **inside** an existing array
 * (e.g. `tv({ base: [ … ] })` — avoids `[[ "a", "b" ]]` when replacing one long string).
 *
 * @since 0.3.16-canary.0
 */
export function formatArrayElementsAsSiblingLines(
  groups: Array<string>,
  continuationPrefix: string,
): string {
  const segments: Array<string> = [];
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    if (group === undefined) {
      throw new Error("invariant: formatArrayElementsAsSiblingLines group missing");
    }
    const comma = commaAfterTailwindGroupLine(i, groups.length);
    const segment = `"${escapeTsStringLiteralContent(group)}"${comma}`;
    segments.push(i === 0 ? segment : `\n${continuationPrefix}${segment}`);
  }
  return segments.join("");
}

/**
 * @since 0.3.16-canary.0
 */
export function formatJsxCnAttributeValue(
  groups: Array<string>,
  source: string,
  valueNodeStart: number,
): string {
  const baseIndent = indentOfLineContaining(source, valueNodeStart);
  const argIndent = `${baseIndent}  `;
  const cnArgumentsBlock = formatCnArguments(groups, {
    indent: argIndent,
    commaAfterLastGroup: groups.length > 1,
  });
  return `{cn(\n${cnArgumentsBlock}\n${baseIndent})}`;
}
