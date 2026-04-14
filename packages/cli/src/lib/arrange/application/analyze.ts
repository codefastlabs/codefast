import ts from "typescript";
import type { CliFs } from "#lib/infra/fs-contract";
import { LONG_STRING_TOKEN_THRESHOLD } from "#lib/arrange/domain/constants";
import type { AnalyzeReport } from "#lib/arrange/domain/types";
import { tokenizeClassString } from "#lib/arrange/domain/tokenizer";
import { forEachStringLiteralInClassExpression } from "#lib/arrange/domain/ast/collectors-cn";
import { jsxClassNameStaticLiteral } from "#lib/arrange/domain/ast/collectors-jsx";
import { collectCnCallsInsideTv, traverseTvObject } from "#lib/arrange/domain/ast/collectors-tv";
import {
  buildKnownCnTvBindings,
  isCnOrTvIdentifier,
  lineOf,
} from "#lib/arrange/domain/ast/ast-helpers";
import { walkTsxFiles } from "#lib/arrange/infra/walk";

function analyzeCnCall(sf: ts.SourceFile, call: ts.CallExpression, report: AnalyzeReport): void {
  for (const arg of call.arguments) {
    forEachStringLiteralInClassExpression(arg, (lit) => {
      const text = lit.text;
      const tokenCount = tokenizeClassString(text).length;
      if (tokenCount >= LONG_STRING_TOKEN_THRESHOLD) {
        report.longCnStringLiterals.push({
          file: sf.fileName,
          line: lineOf(sf, lit),
          tokenCount,
          preview: text.length > 72 ? `${text.slice(0, 72)}…` : text,
        });
      }
    });
  }
}

function visitCallExpressionForArrangeAnalyze(
  callExpression: ts.CallExpression,
  sf: ts.SourceFile,
  sourceText: string,
  knownBindings: Set<string>,
  report: AnalyzeReport,
): void {
  if (isCnOrTvIdentifier(callExpression.expression, "cn", knownBindings)) {
    report.cnCallExpressions++;
    analyzeCnCall(sf, callExpression, report);
    return;
  }
  if (!isCnOrTvIdentifier(callExpression.expression, "tv", knownBindings)) return;

  report.tvCallExpressions++;
  const arg0 = callExpression.arguments[0];
  if (!arg0 || !ts.isObjectLiteralExpression(arg0)) return;

  for (const nestedCn of collectCnCallsInsideTv(sf, arg0, knownBindings, 0)) {
    const src = sourceText.slice(nestedCn.getStart(sf), nestedCn.getEnd());
    const preview = src.length > 72 ? `${src.slice(0, 72)}…` : src;
    report.cnInsideTvCalls.push({
      file: sf.fileName,
      line: lineOf(sf, nestedCn),
      argCount: nestedCn.arguments.length,
      preview,
    });
  }
  traverseTvObject(
    sf,
    arg0,
    (classLiteral) => {
      const text = classLiteral.text;
      const tokenCount = tokenizeClassString(text).length;
      if (tokenCount >= LONG_STRING_TOKEN_THRESHOLD) {
        report.longTvStringLiterals.push({
          file: sf.fileName,
          line: lineOf(sf, classLiteral),
          tokenCount,
          preview: text.length > 72 ? `${text.slice(0, 72)}…` : text,
        });
      }
    },
    0,
    knownBindings,
  );
}

function visitJsxAttributeForArrangeAnalyze(
  jsxClassAttribute: ts.JsxAttribute,
  sf: ts.SourceFile,
  filePath: string,
  report: AnalyzeReport,
): void {
  if (!filePath.endsWith(".tsx")) return;
  const parsed = jsxClassNameStaticLiteral(jsxClassAttribute);
  if (!parsed) return;
  const text = parsed.lit.text;
  const tokenCount = tokenizeClassString(text).length;
  if (tokenCount >= LONG_STRING_TOKEN_THRESHOLD) {
    report.longJsxClassNameLiterals.push({
      file: sf.fileName,
      line: lineOf(sf, parsed.lit),
      tokenCount,
      preview: text.length > 72 ? `${text.slice(0, 72)}…` : text,
    });
  }
}

export function analyzeDirectory(analyzeRootPath: string, fs: CliFs): AnalyzeReport {
  const report: AnalyzeReport = {
    files: 0,
    cnCallExpressions: 0,
    tvCallExpressions: 0,
    cnInsideTvCalls: [],
    longCnStringLiterals: [],
    longTvStringLiterals: [],
    longJsxClassNameLiterals: [],
  };

  const files = fs.statSync(analyzeRootPath).isDirectory()
    ? walkTsxFiles(analyzeRootPath, fs)
    : [analyzeRootPath];

  for (const filePath of files) {
    const sourceText = fs.readFileSync(filePath, "utf8");
    const sf = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    report.files++;

    const knownBindings = buildKnownCnTvBindings(sf);
    const visitTypeScriptSubtree = (tsNode: ts.Node): void => {
      if (ts.isCallExpression(tsNode)) {
        visitCallExpressionForArrangeAnalyze(tsNode, sf, sourceText, knownBindings, report);
      }
      if (ts.isJsxAttribute(tsNode)) {
        visitJsxAttributeForArrangeAnalyze(tsNode, sf, filePath, report);
      }
      ts.forEachChild(tsNode, visitTypeScriptSubtree);
    };
    visitTypeScriptSubtree(sf);
  }

  return report;
}
