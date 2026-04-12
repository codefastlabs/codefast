import ts from "typescript";
import type { ArrangeFs } from "#lib/arrange/fs-contract";
import { LONG_STRING_TOKEN_THRESHOLD } from "#lib/arrange/constants";
import type { AnalyzeReport } from "#lib/arrange/types";
import { tokenizeClassString } from "#lib/arrange/tokenizer";
import {
  collectCnCallsInsideTv,
  forEachStringLiteralInClassExpression,
  jsxClassNameStaticLiteral,
  traverseTvObject,
} from "#lib/arrange/ast/collectors";
import { buildKnownCnTvBindings, isCnOrTvIdentifier, lineOf } from "#lib/arrange/ast/utils";
import { walkTsxFiles } from "#lib/arrange/walk";

function analyzeCnCall(sf: ts.SourceFile, call: ts.CallExpression, report: AnalyzeReport): void {
  for (const arg of call.arguments) {
    forEachStringLiteralInClassExpression(arg, (lit) => {
      const text = lit.text;
      const n = tokenizeClassString(text).length;
      if (n >= LONG_STRING_TOKEN_THRESHOLD) {
        report.longCnStringLiterals.push({
          file: sf.fileName,
          line: lineOf(sf, lit),
          tokenCount: n,
          preview: text.length > 72 ? `${text.slice(0, 72)}…` : text,
        });
      }
    });
  }
}

export function analyzeDirectory(target: string, fs: ArrangeFs): AnalyzeReport {
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
        if (isCnOrTvIdentifier(node.expression, "cn", knownBindings)) {
          report.cnCallExpressions++;
          analyzeCnCall(sf, node, report);
        } else if (isCnOrTvIdentifier(node.expression, "tv", knownBindings)) {
          report.tvCallExpressions++;
          const arg0 = node.arguments[0];
          if (arg0 && ts.isObjectLiteralExpression(arg0)) {
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
                const n = tokenizeClassString(text).length;
                if (n >= LONG_STRING_TOKEN_THRESHOLD) {
                  report.longTvStringLiterals.push({
                    file: sf.fileName,
                    line: lineOf(sf, strNode),
                    tokenCount: n,
                    preview: text.length > 72 ? `${text.slice(0, 72)}…` : text,
                  });
                }
              },
              0,
              knownBindings,
            );
          }
        }
      }
      if (filePath.endsWith(".tsx") && ts.isJsxAttribute(node)) {
        const parsed = jsxClassNameStaticLiteral(node);
        if (parsed) {
          const text = parsed.lit.text;
          const n = tokenizeClassString(text).length;
          if (n >= LONG_STRING_TOKEN_THRESHOLD) {
            report.longJsxClassNameLiterals.push({
              file: sf.fileName,
              line: lineOf(sf, parsed.lit),
              tokenCount: n,
              preview: text.length > 72 ? `${text.slice(0, 72)}…` : text,
            });
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  return report;
}
