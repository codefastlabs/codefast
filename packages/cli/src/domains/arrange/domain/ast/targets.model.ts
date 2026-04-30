import { APPLY_MIN_TOKENS } from "#/domains/arrange/domain/constants.domain";
import {
  areCnTailwindPartitionsEquivalent,
  suggestCnGroups,
  summarizeGroupBucketLabels,
} from "#/domains/arrange/domain/grouping.domain";
import {
  escapeTsStringLiteralContent,
  formatArray,
  formatArrayElementsAsSiblingLines,
  formatJsxCnAttributeValue,
} from "#/domains/arrange/domain/source-text-formatters.formatter";
import type {
  GroupTarget,
  PlannedGroupEdit,
  StringNode,
} from "#/domains/arrange/domain/types.domain";
import { tokenizeClassString } from "#/domains/arrange/domain/tailwind-token.value-object";
import { isUnsafeLiteralForCnStyleApplySplit } from "#/domains/arrange/domain/ast/collectors-cn.collector";
import { jsxClassNameStaticLiteral } from "#/domains/arrange/domain/ast/collectors-jsx.collector";
import {
  collectGroupableStringNodes,
  slotClassString,
} from "#/domains/arrange/domain/ast/collectors-tv.collector";
import {
  endAfterOptionalCommaFollowingInSource,
  indentOfLineContaining,
  textPrefixFromLineStartToPosition,
} from "#/shell/infrastructure/source-code/domain/text-edit.model";
import {
  isDomainArrayLiteralExpression,
  isDomainJsxAttribute,
  isDomainTailwindClassLiteral,
  forEachDomainChild,
} from "#/domains/arrange/domain/ast/ast-node.model";
import type { DomainAstNode, DomainSourceFile } from "#/domains/arrange/domain/ast/ast-node.model";

export function targetReplaceStart(target: GroupTarget): number {
  if (target.kind === "cnArg") {
    return target.item.cnCall ? target.item.cnCall.pos : target.item.primaryClassLiteral.pos;
  }
  return target.valueNode.pos;
}

function collectLongJsxClassNameTargets(sourceFile: DomainSourceFile): GroupTarget[] {
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

function formatCnCallReplacement(
  stringNode: StringNode,
  sourceText: string,
  withClassName: boolean,
): string {
  const call = stringNode.cnCall;
  if (call === undefined) {
    throw new Error("formatCnCallReplacement requires a cn() call on the string node");
  }
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
    const onlyGroup = groups[0];
    if (onlyGroup === undefined) {
      throw new Error("invariant: single cn group missing");
    }
    allArgs.push(`${argIndent}"${escapeTsStringLiteralContent(onlyGroup)}"`);
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
    const end = parentArray
      ? parentArray.end
      : endAfterOptionalCommaFollowingInSource(textAfterUnwrap, anchorClassLiteral.end);
    const baseIndent = indentOfLineContaining(textAfterUnwrap, start);
    const replacement = parentArray
      ? formatArray(groups)
          .split("\n")
          .map((line, lineIndex) => (lineIndex === 0 ? line : `${baseIndent}${line}`))
          .join("\n")
      : formatArrayElementsAsSiblingLines(
          groups,
          textPrefixFromLineStartToPosition(textAfterUnwrap, start),
        );
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
