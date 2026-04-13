import ts from "typescript";
import type { CliFs } from "#lib/infra/fs-contract";
import { LONG_STRING_TOKEN_THRESHOLD } from "#lib/arrange/constants";
import type { AnalyzeReport } from "#lib/arrange/types";
import { tokenizeClassString } from "#lib/arrange/tokenizer";
import { forEachStringLiteralInClassExpression } from "#lib/arrange/ast/collectors-cn";
import { jsxClassNameStaticLiteral } from "#lib/arrange/ast/collectors-jsx";
import { collectCnCallsInsideTv, traverseTvObject } from "#lib/arrange/ast/collectors-tv";
import { buildKnownCnTvBindings, isCnOrTvIdentifier, lineOf } from "#lib/arrange/ast/utils";
import { walkTsxFiles } from "#lib/arrange/walk";

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
  node: ts.CallExpression,
  sf: ts.SourceFile,
  sourceText: string,
  knownBindings: Set<string>,
  report: AnalyzeReport,
): void {
  if (isCnOrTvIdentifier(node.expression, "cn", knownBindings)) {
    report.cnCallExpressions++;
    analyzeCnCall(sf, node, report);
    return;
  }
  if (!isCnOrTvIdentifier(node.expression, "tv", knownBindings)) return;

  report.tvCallExpressions++;
  const arg0 = node.arguments[0];
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
    (strNode) => {
      const text = strNode.text;
      const tokenCount = tokenizeClassString(text).length;
      if (tokenCount >= LONG_STRING_TOKEN_THRESHOLD) {
        report.longTvStringLiterals.push({
          file: sf.fileName,
          line: lineOf(sf, strNode),
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
  node: ts.JsxAttribute,
  sf: ts.SourceFile,
  filePath: string,
  report: AnalyzeReport,
): void {
  if (!filePath.endsWith(".tsx")) return;
  const parsed = jsxClassNameStaticLiteral(node);
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

export function analyzeDirectory(target: string, fs: CliFs): AnalyzeReport {
  const report: AnalyzeReport = {
    files: 0,
    cnCallExpressions: 0,
    tvCallExpressions: 0,
    cnInsideTvCalls: [],
    longCnStringLiterals: [],
    longTvStringLiterals: [],
    longJsxClassNameLiterals: [],
  };

  const files = fs.statSync(target).isDirectory() ? walkTsxFiles(target, fs) : [target];

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
    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node)) {
        visitCallExpressionForArrangeAnalyze(node, sf, sourceText, knownBindings, report);
      }
      if (ts.isJsxAttribute(node)) {
        visitJsxAttributeForArrangeAnalyze(node, sf, filePath, report);
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  return report;
}
