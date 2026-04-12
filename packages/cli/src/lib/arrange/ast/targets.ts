import ts from "typescript";
import { APPLY_MIN_TOKENS } from "#lib/arrange/constants";
import { areCnTailwindPartitionsEquivalent, suggestCnGroups } from "#lib/arrange/grouping";
import {
  escapeTsStringLiteralContent,
  formatArray,
  formatJsxCnAttributeValue,
} from "#lib/arrange/formatters";
import type { GroupTarget, PlannedGroupEdit, StringNode } from "#lib/arrange/types";
import { tokenizeClassString } from "#lib/arrange/tokenizer";
import { isUnsafeLiteralForCnStyleApplySplit } from "#lib/arrange/ast/collectors-cn";
import { jsxClassNameStaticLiteral } from "#lib/arrange/ast/collectors-jsx";
import { collectLongStringNodes, slotClassString } from "#lib/arrange/ast/collectors-tv";
import { indentOfLineContaining } from "#lib/arrange/ast/utils";

export function targetReplaceStart(t: GroupTarget): number {
  if (t.kind === "cnArg") {
    return t.item.cnCall ? t.item.cnCall.getStart(t.item.sf) : t.item.node.getStart(t.item.sf);
  }
  return t.valueNode.getStart(t.sf);
}

export function collectLongJsxClassNameTargets(sf: ts.SourceFile): GroupTarget[] {
  const results: GroupTarget[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isJsxAttribute(node)) {
      const parsed = jsxClassNameStaticLiteral(node);
      if (parsed && tokenizeClassString(parsed.lit.text).length >= APPLY_MIN_TOKENS) {
        results.push({
          kind: "jsxClassName",
          sf,
          lit: parsed.lit,
          valueNode: parsed.valueNode,
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return results;
}

export function collectGroupTargets(sf: ts.SourceFile, filePath: string): GroupTarget[] {
  const cnPart = collectLongStringNodes(sf).map((item) => ({ kind: "cnArg" as const, item }));
  if (!filePath.endsWith(".tsx")) return cnPart;
  return [...cnPart, ...collectLongJsxClassNameTargets(sf)];
}

export function formatCnCallReplacement(
  item: StringNode,
  sourceText: string,
  withClassName: boolean,
): string {
  const call = item.cnCall!;
  const sf = item.sf;
  const baseIndent = indentOfLineContaining(sourceText, call.getStart(sf));
  const argIndent = `${baseIndent}  `;

  const dynamicArgTexts: string[] = [];
  for (const arg of call.arguments) {
    const isSimpleStatic =
      (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) &&
      !isUnsafeLiteralForCnStyleApplySplit(arg);
    if (!isSimpleStatic) {
      dynamicArgTexts.push(sourceText.slice(arg.getStart(sf), arg.getEnd()));
    }
  }

  const pool = slotClassString(item);
  const groups = pool.trim() ? suggestCnGroups(pool) : [];

  const allArgs: string[] = [];

  if (groups.length > 1) {
    for (const group of groups) {
      allArgs.push(`${argIndent}"${escapeTsStringLiteralContent(group)}"`);
    }
  } else if (groups.length === 1) {
    allArgs.push(`${argIndent}"${escapeTsStringLiteralContent(groups[0]!)}"`);
  }

  for (const dyn of dynamicArgTexts) {
    allArgs.push(`${argIndent}${dyn}`);
  }

  if (withClassName) {
    allArgs.push(`${argIndent}className`);
  }

  const argLines = allArgs.map((a, i) => (i < allArgs.length - 1 ? `${a},` : `${a}`));
  if (allArgs.length > 1) {
    const li = allArgs.length - 1;
    argLines[li] = `${allArgs[li]},`;
  }
  return `cn(\n${argLines.join("\n")}\n${baseIndent})`;
}

export function planGroupEditForTarget(
  t: GroupTarget,
  textAfterUnwrap: string,
  withClassName: boolean,
): PlannedGroupEdit | undefined {
  if (t.kind === "jsxClassName") {
    const groups = suggestCnGroups(t.lit.text);
    if (groups.length <= 1) return undefined;
    const start = t.valueNode.getStart(t.sf);
    const end = t.valueNode.getEnd();
    const replacement = formatJsxCnAttributeValue(groups, textAfterUnwrap, start);
    return {
      start,
      end,
      replacement,
      jsxCn: true,
      lineSf: t.sf,
      reportNode: t.lit,
      label: "JSX className",
    };
  }

  const pool = slotClassString(t.item);
  const groups = suggestCnGroups(pool);
  if (groups.length <= 1) return undefined;

  if (
    areCnTailwindPartitionsEquivalent(
      t.item.nodes.map((n) => n.text),
      groups,
    )
  ) {
    return undefined;
  }

  if (!t.item.cnCall) {
    const firstNode = t.item.node;
    const parentArray =
      t.item.nodes.length > 1 && ts.isArrayLiteralExpression(firstNode.parent)
        ? firstNode.parent
        : null;
    const start = parentArray ? parentArray.getStart(t.item.sf) : firstNode.getStart(t.item.sf);
    const end = parentArray ? parentArray.getEnd() : firstNode.getEnd();
    const baseIndent = indentOfLineContaining(textAfterUnwrap, start);
    const replacement = formatArray(groups)
      .split("\n")
      .map((l, i) => (i === 0 ? l : `${baseIndent}${l}`))
      .join("\n");
    return {
      start,
      end,
      replacement,
      jsxCn: false,
      lineSf: t.item.sf,
      reportNode: firstNode,
      label: t.item.isTvContext ? "tv" : "cn",
    };
  }

  const call = t.item.cnCall;
  const start = call.getStart(t.item.sf);
  const end = call.getEnd();
  const replacement = formatCnCallReplacement(t.item, textAfterUnwrap, withClassName);
  return {
    start,
    end,
    replacement,
    jsxCn: false,
    lineSf: t.item.sf,
    reportNode: t.item.node,
    label: t.item.isTvContext ? "tv" : "cn",
  };
}
