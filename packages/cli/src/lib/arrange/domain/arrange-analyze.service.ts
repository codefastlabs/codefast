/**
 * Rich domain: Tailwind/cn/tv analysis rules (counts, long literals, nested cn in tv).
 * Pure orchestration of domain collectors and invariants — no I/O.
 */

import { LONG_STRING_TOKEN_THRESHOLD } from "#lib/arrange/domain/constants.domain";
import type { AnalyzeReport } from "#lib/arrange/domain/types.domain";
import { tokenizeClassString } from "#lib/arrange/domain/tokenizer.util";
import { forEachStringLiteralInClassExpression } from "#lib/arrange/domain/ast/collectors-cn.collector";
import { jsxClassNameStaticLiteral } from "#lib/arrange/domain/ast/collectors-jsx.collector";
import {
  collectCnCallsInsideTv,
  traverseTvObject,
} from "#lib/arrange/domain/ast/collectors-tv.collector";
import {
  buildKnownCnTvBindings,
  isCnOrTvIdentifier,
  lineOf,
} from "#lib/arrange/domain/ast/ast-helpers.helper";
import {
  type DomainAstNode,
  type DomainCallExpression,
  type DomainJsxAttribute,
  type DomainSourceFile,
  isDomainCallExpression,
  isDomainJsxAttribute,
  isDomainObjectLiteralExpression,
  forEachDomainChild,
} from "#lib/arrange/domain/ast/ast-node.model";

const PREVIEW_MAX_LENGTH = 72;

function previewText(text: string): string {
  return text.length > PREVIEW_MAX_LENGTH ? `${text.slice(0, PREVIEW_MAX_LENGTH)}…` : text;
}

export function createEmptyAnalyzeReport(): AnalyzeReport {
  return {
    files: 0,
    cnCallExpressions: 0,
    tvCallExpressions: 0,
    cnInsideTvCalls: [],
    longCnStringLiterals: [],
    longTvStringLiterals: [],
    longJsxClassNameLiterals: [],
  };
}

function analyzeCnCall(
  domainSf: DomainSourceFile,
  call: DomainCallExpression,
  report: AnalyzeReport,
): void {
  for (const arg of call.arguments) {
    forEachStringLiteralInClassExpression(arg, (lit) => {
      const text = lit.text;
      const tokenCount = tokenizeClassString(text).length;
      if (tokenCount >= LONG_STRING_TOKEN_THRESHOLD) {
        report.longCnStringLiterals.push({
          file: domainSf.fileName,
          line: lineOf(domainSf, lit),
          tokenCount,
          preview: previewText(text),
        });
      }
    });
  }
}

function visitCallExpressionForArrangeAnalyze(
  callExpression: DomainCallExpression,
  domainSf: DomainSourceFile,
  sourceText: string,
  knownBindings: Set<string>,
  report: AnalyzeReport,
): void {
  if (isCnOrTvIdentifier(callExpression.expression, "cn", knownBindings)) {
    report.cnCallExpressions++;
    analyzeCnCall(domainSf, callExpression, report);
    return;
  }
  if (!isCnOrTvIdentifier(callExpression.expression, "tv", knownBindings)) {
    return;
  }

  report.tvCallExpressions++;
  const arg0 = callExpression.arguments[0];
  if (!arg0 || !isDomainObjectLiteralExpression(arg0)) {
    return;
  }

  for (const nestedCn of collectCnCallsInsideTv(domainSf, arg0, knownBindings, 0)) {
    const src = sourceText.slice(nestedCn.pos, nestedCn.end);
    report.cnInsideTvCalls.push({
      file: domainSf.fileName,
      line: lineOf(domainSf, nestedCn),
      argCount: nestedCn.arguments.length,
      preview: previewText(src),
    });
  }
  traverseTvObject(
    domainSf,
    arg0,
    (classLiteral) => {
      const text = classLiteral.text;
      const tokenCount = tokenizeClassString(text).length;
      if (tokenCount >= LONG_STRING_TOKEN_THRESHOLD) {
        report.longTvStringLiterals.push({
          file: domainSf.fileName,
          line: lineOf(domainSf, classLiteral),
          tokenCount,
          preview: previewText(text),
        });
      }
    },
    0,
    knownBindings,
  );
}

function visitJsxAttributeForArrangeAnalyze(
  jsxClassAttribute: DomainJsxAttribute,
  domainSf: DomainSourceFile,
  filePath: string,
  report: AnalyzeReport,
): void {
  if (!filePath.endsWith(".tsx")) {
    return;
  }
  const parsed = jsxClassNameStaticLiteral(jsxClassAttribute);
  if (!parsed) {
    return;
  }
  const text = parsed.lit.text;
  const tokenCount = tokenizeClassString(text).length;
  if (tokenCount >= LONG_STRING_TOKEN_THRESHOLD) {
    report.longJsxClassNameLiterals.push({
      file: domainSf.fileName,
      line: lineOf(domainSf, parsed.lit),
      tokenCount,
      preview: previewText(text),
    });
  }
}

/**
 * Accumulates findings for one parsed source file into `report` (mutates report).
 */
export function accumulateAnalyzeReportForSourceFile(
  report: AnalyzeReport,
  domainSf: DomainSourceFile,
  sourceText: string,
  filePath: string,
): void {
  report.files++;
  const knownBindings = buildKnownCnTvBindings(domainSf);
  const visitTypeScriptSubtree = (tsNode: DomainAstNode): void => {
    if (isDomainCallExpression(tsNode)) {
      visitCallExpressionForArrangeAnalyze(tsNode, domainSf, sourceText, knownBindings, report);
    }
    if (isDomainJsxAttribute(tsNode)) {
      visitJsxAttributeForArrangeAnalyze(tsNode, domainSf, filePath, report);
    }
    forEachDomainChild(tsNode, visitTypeScriptSubtree);
  };
  for (const stmt of domainSf.statements) {
    visitTypeScriptSubtree(stmt);
  }
}
