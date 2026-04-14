import ts from "typescript";
import { APPLY_MIN_TOKENS } from "#lib/arrange/constants";
import {
  areCnTailwindPartitionsEquivalent,
  suggestCnGroups,
  summarizeGroupBucketLabels,
} from "#lib/arrange/grouping";
import {
  escapeTsStringLiteralContent,
  formatArray,
  formatJsxCnAttributeValue,
} from "#lib/arrange/formatters";
import type { GroupTarget, PlannedGroupEdit, StringNode } from "#lib/arrange/types";
import { tokenizeClassString } from "#lib/arrange/tokenizer";
import { isUnsafeLiteralForCnStyleApplySplit } from "#lib/arrange/ast/collectors-cn";
import { jsxClassNameStaticLiteral } from "#lib/arrange/ast/collectors-jsx";
import { collectGroupableStringNodes, slotClassString } from "#lib/arrange/ast/collectors-tv";
import { indentOfLineContaining } from "#lib/arrange/ast/utils";

export function targetReplaceStart(target: GroupTarget): number {
  if (target.kind === "cnArg") {
    return target.item.cnCall
      ? target.item.cnCall.getStart(target.item.sf)
      : target.item.primaryClassLiteral.getStart(target.item.sf);
  }
  return target.valueNode.getStart(target.sf);
}

export function collectLongJsxClassNameTargets(sf: ts.SourceFile): GroupTarget[] {
  const results: GroupTarget[] = [];
  const visitTypeScriptSubtree = (tsNode: ts.Node): void => {
    if (ts.isJsxAttribute(tsNode)) {
      const parsed = jsxClassNameStaticLiteral(tsNode);
      if (parsed && tokenizeClassString(parsed.lit.text).length >= APPLY_MIN_TOKENS) {
        results.push({
          kind: "jsxClassName",
          sf,
          lit: parsed.lit,
          valueNode: parsed.valueNode,
        });
      }
    }
    ts.forEachChild(tsNode, visitTypeScriptSubtree);
  };
  visitTypeScriptSubtree(sf);
  return results;
}

export function collectGroupTargets(sf: ts.SourceFile, filePath: string): GroupTarget[] {
  const cnPart = collectGroupableStringNodes(sf).map((stringNode) => ({
    kind: "cnArg" as const,
    item: stringNode,
  }));
  if (!filePath.endsWith(".tsx")) return cnPart;
  return [...cnPart, ...collectLongJsxClassNameTargets(sf)];
}

export function formatCnCallReplacement(
  stringNode: StringNode,
  sourceText: string,
  withClassName: boolean,
): string {
  const call = stringNode.cnCall!;
  const sf = stringNode.sf;
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

  const pool = slotClassString(stringNode);
  const groups = pool.trim() ? suggestCnGroups(pool) : [];

  const allArgs: string[] = [];

  if (groups.length > 1) {
    for (const group of groups) {
      allArgs.push(`${argIndent}"${escapeTsStringLiteralContent(group)}"`);
    }
  } else if (groups.length === 1) {
    allArgs.push(`${argIndent}"${escapeTsStringLiteralContent(groups[0]!)}"`);
  }

  for (const dynamicArgumentSource of dynamicArgTexts) {
    allArgs.push(`${argIndent}${dynamicArgumentSource}`);
  }

  if (withClassName) {
    allArgs.push(`${argIndent}className`);
  }

  // Keep formatter behavior explicit: multiline cn() calls with multiple args use trailing comma.
  const commaAfterLastArg = allArgs.length > 1;
  const argLines = allArgs.map((argLine, lineIndex) =>
    lineIndex < allArgs.length - 1 || commaAfterLastArg ? `${argLine},` : `${argLine}`,
  );
  return `cn(\n${argLines.join("\n")}\n${baseIndent})`;
}

export function planGroupEditForTarget(
  target: GroupTarget,
  textAfterUnwrap: string,
  withClassName: boolean,
): PlannedGroupEdit | undefined {
  if (target.kind === "jsxClassName") {
    const groups = suggestCnGroups(target.lit.text);
    if (groups.length <= 1) return undefined;
    const start = target.valueNode.getStart(target.sf);
    const end = target.valueNode.getEnd();
    const replacement = formatJsxCnAttributeValue(groups, textAfterUnwrap, start);
    return {
      start,
      end,
      replacement,
      bucketSummary: summarizeGroupBucketLabels(groups),
      jsxCn: true,
      lineSf: target.sf,
      reportNode: target.lit,
      label: "JSX className",
    };
  }

  const pool = slotClassString(target.item);
  const groups = suggestCnGroups(pool);
  if (groups.length <= 1) return undefined;

  if (
    areCnTailwindPartitionsEquivalent(
      target.item.nodes.map((classLiteral) => classLiteral.text),
      groups,
    )
  ) {
    return undefined;
  }

  if (!target.item.cnCall) {
    const anchorClassLiteral = target.item.primaryClassLiteral;
    const parentArray =
      target.item.nodes.length > 1 && ts.isArrayLiteralExpression(anchorClassLiteral.parent)
        ? anchorClassLiteral.parent
        : null;
    const start = parentArray
      ? parentArray.getStart(target.item.sf)
      : anchorClassLiteral.getStart(target.item.sf);
    const end = parentArray ? parentArray.getEnd() : anchorClassLiteral.getEnd();
    const baseIndent = indentOfLineContaining(textAfterUnwrap, start);
    const replacement = formatArray(groups)
      .split("\n")
      .map((line, lineIndex) => (lineIndex === 0 ? line : `${baseIndent}${line}`))
      .join("\n");
    return {
      start,
      end,
      replacement,
      bucketSummary: summarizeGroupBucketLabels(groups),
      jsxCn: false,
      lineSf: target.item.sf,
      reportNode: anchorClassLiteral,
      label: target.item.isTvContext ? "tv" : "cn",
    };
  }

  const call = target.item.cnCall;
  const start = call.getStart(target.item.sf);
  const end = call.getEnd();
  const replacement = formatCnCallReplacement(target.item, textAfterUnwrap, withClassName);
  return {
    start,
    end,
    replacement,
    bucketSummary: summarizeGroupBucketLabels(groups),
    jsxCn: false,
    lineSf: target.item.sf,
    reportNode: target.item.primaryClassLiteral,
    label: target.item.isTvContext ? "tv" : "cn",
  };
}
