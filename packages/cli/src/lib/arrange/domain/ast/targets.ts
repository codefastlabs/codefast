import { APPLY_MIN_TOKENS } from "#lib/arrange/domain/constants";
import {
  areCnTailwindPartitionsEquivalent,
  suggestCnGroups,
  summarizeGroupBucketLabels,
} from "#lib/arrange/domain/grouping";
import {
  escapeTsStringLiteralContent,
  formatArray,
  formatJsxCnAttributeValue,
} from "#lib/arrange/domain/source-text-formatters";
import type { GroupTarget, PlannedGroupEdit, StringNode } from "#lib/arrange/domain/types";
import { tokenizeClassString } from "#lib/arrange/domain/tokenizer";
import { isUnsafeLiteralForCnStyleApplySplit } from "#lib/arrange/domain/ast/collectors-cn";
import { jsxClassNameStaticLiteral } from "#lib/arrange/domain/ast/collectors-jsx";
import {
  collectGroupableStringNodes,
  slotClassString,
} from "#lib/arrange/domain/ast/collectors-tv";
import { indentOfLineContaining } from "#lib/shared/source-code/domain/text-edit";
import {
  type DomainAstNode,
  type DomainSourceFile,
  isDomainArrayLiteralExpression,
  isDomainJsxAttribute,
  isDomainTailwindClassLiteral,
  forEachDomainChild,
} from "#lib/arrange/domain/ast/ast-node.model";

export function targetReplaceStart(target: GroupTarget): number {
  if (target.kind === "cnArg") {
    return target.item.cnCall ? target.item.cnCall.pos : target.item.primaryClassLiteral.pos;
  }
  return target.valueNode.pos;
}

export function collectLongJsxClassNameTargets(sourceFile: DomainSourceFile): GroupTarget[] {
  const results: GroupTarget[] = [];
  const visitTypeScriptSubtree = (tsNode: DomainAstNode): void => {
    if (isDomainJsxAttribute(tsNode)) {
      const parsed = jsxClassNameStaticLiteral(tsNode);
      if (parsed && tokenizeClassString(parsed.lit.text).length >= APPLY_MIN_TOKENS) {
        results.push({
          kind: "jsxClassName",
          sf: sourceFile,
          lit: parsed.lit,
          valueNode: parsed.valueNode,
        });
      }
    }
    forEachDomainChild(tsNode, visitTypeScriptSubtree);
  };
  for (const stmt of sourceFile.statements) {
    visitTypeScriptSubtree(stmt);
  }
  return results;
}

export function collectGroupTargets(sourceFile: DomainSourceFile, filePath: string): GroupTarget[] {
  const cnPart = collectGroupableStringNodes(sourceFile).map((stringNode) => ({
    kind: "cnArg" as const,
    item: stringNode,
  }));
  if (!filePath.endsWith(".tsx")) {
    return cnPart;
  }
  return [...cnPart, ...collectLongJsxClassNameTargets(sourceFile)];
}

export function formatCnCallReplacement(
  stringNode: StringNode,
  sourceText: string,
  withClassName: boolean,
): string {
  const call = stringNode.cnCall!;
  const baseIndent = indentOfLineContaining(sourceText, call.pos);
  const argIndent = `${baseIndent}  `;

  const dynamicArgTexts: string[] = [];
  for (const arg of call.arguments) {
    const isSimpleStatic =
      isDomainTailwindClassLiteral(arg) && !isUnsafeLiteralForCnStyleApplySplit(arg);
    if (!isSimpleStatic) {
      dynamicArgTexts.push(sourceText.slice(arg.pos, arg.end));
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
    if (groups.length <= 1) {
      return undefined;
    }
    const start = target.valueNode.pos;
    const end = target.valueNode.end;
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
  if (groups.length <= 1) {
    return undefined;
  }

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
      target.item.nodes.length > 1 &&
      anchorClassLiteral.parent !== null &&
      isDomainArrayLiteralExpression(anchorClassLiteral.parent)
        ? anchorClassLiteral.parent
        : null;
    const start = parentArray ? parentArray.pos : anchorClassLiteral.pos;
    const end = parentArray ? parentArray.end : anchorClassLiteral.end;
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
  const start = call.pos;
  const end = call.end;
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
