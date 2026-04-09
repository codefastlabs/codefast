#!/usr/bin/env tsx
/**
 * Phân tích và gợi ý phân nhóm chuỗi Tailwind trong `cn(...)` / `tv(...)`.
 *
 * Quy ước tham chiếu: `.cursor/rules/ui-cn-classname-grouping.mdc` — oxlint/oxfmt sắp xếp
 * token trong từng chuỗi; script này chỉ gợi ý **ranh giới** giữa các đối số `cn()` /
 * phần tử mảng trong `tv().base` (heuristic, cần review tay).
 *
 * Usage:
 *   pnpm exec tsx scripts/group-tailwind-cn.ts analyze [dir]
 *   pnpm exec tsx scripts/group-tailwind-cn.ts group "flex gap-2 rounded-md border px-3"
 *   pnpm exec tsx scripts/group-tailwind-cn.ts group --file path/to/component.tsx --line 42
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

function out(line: string): void {
  process.stdout.write(`${line}\n`);
}

function err(line: string): void {
  process.stderr.write(`${line}\n`);
}

const LONG_STRING_TOKEN_THRESHOLD = 18;

type Bucket =
  | "layout"
  | "size"
  | "spacing"
  | "surface"
  | "typography"
  | "motion"
  | "state"
  | "arbitrary"
  | "other";

const RESPONSIVE_PREFIX =
  /^(?:@(?:[a-z]+(?:-[a-z]+)*)\/)?(?:sm|md|lg|xl|2xl|3xl|max-sm|max-md|max-lg|min-sm|min-md|min-lg):/;

function tokenizeClassString(s: string): string[] {
  return s.trim().split(/\s+/).filter(Boolean);
}

function classifyToken(token: string): Bucket {
  if (token.startsWith("[") || token.includes("[&")) {
    return "arbitrary";
  }

  const base = token.includes(":") ? (token.split(":").pop() ?? token) : token;
  const t = base;

  if (
    /^(?:flex|inline-flex|grid|inline-grid|block|inline|hidden|contents|flow-root|table|table-)/.test(
      t,
    ) ||
    /^(?:items|justify|content|self|place)-/.test(t) ||
    /^(?:gap|space-[xy]|col-|row-|grid-|auto-cols|auto-rows|order)/.test(t) ||
    /^(?:overflow|overscroll|object|isolate|isolation|z-|float|clear|columns|break-)/.test(t)
  ) {
    return "layout";
  }

  if (
    /^(?:w|h|min-w|max-w|min-h|max-h|size|aspect|shrink|grow|basis)-/.test(t) ||
    t === "shrink" ||
    t === "grow"
  ) {
    return "size";
  }

  if (
    /^(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|inset|top|right|bottom|left)-/.test(t) ||
    /^-?(?:inset|top|right|bottom|left)(?:\/|$)/.test(t)
  ) {
    return "spacing";
  }

  if (
    /^(?:rounded|border|ring|divide|bg|from|via|to|fill|stroke|shadow|opacity)-/.test(t) ||
    /^(?:rounded|border|ring|divide|shadow|opacity)(?:\/|$)/.test(t) ||
    t === "border" ||
    t === "rounded"
  ) {
    return "surface";
  }

  if (
    /^(?:text|font|leading|tracking|antialiased|subpixel-antialiased|underline|line-through|no-underline|list|indent|align|whitespace|break|truncate|line-clamp)-/.test(
      t,
    ) ||
    /^(?:text|font)-/.test(t)
  ) {
    return "typography";
  }

  if (
    /^(?:transition|duration|ease|delay|animate|will-change)-/.test(t) ||
    /^(?:transition|animate)/.test(t)
  ) {
    return "motion";
  }

  if (
    token !== t ||
    /^(?:hover|focus|active|disabled|group|peer|aria|data|dark|light|supports|motion|print|screen|starting|ltr|rtl|open|checked|invalid|required|placeholder|empty|first|last|only|odd|even|not)-/.test(
      token,
    ) ||
    RESPONSIVE_PREFIX.test(token) ||
    token.startsWith("file:") ||
    token.startsWith("selection:")
  ) {
    return "state";
  }

  if (
    /^(?:outline|cursor|pointer-events|select|appearance)-/.test(t) ||
    /^(?:outline|cursor|select)/.test(t)
  ) {
    return "motion";
  }

  return "other";
}

/** Gộp token liên tiếp cùng bucket thành một chuỗi đối số `cn`. */
export function suggestCnGroups(classString: string): string[] {
  const tokens = tokenizeClassString(classString);
  if (tokens.length === 0) {
    return [];
  }

  const groups: string[] = [];
  let currentBucket: Bucket | null = null;
  let currentTokens: string[] = [];

  const flush = () => {
    if (currentTokens.length > 0) {
      groups.push(currentTokens.join(" "));
      currentTokens = [];
    }
  };

  for (const tok of tokens) {
    const b = classifyToken(tok);
    if (currentBucket === null) {
      currentBucket = b;
      currentTokens.push(tok);
      continue;
    }
    if (b === currentBucket) {
      currentTokens.push(tok);
    } else {
      flush();
      currentBucket = b;
      currentTokens.push(tok);
    }
  }
  flush();

  return groups;
}

export function formatCnCall(groups: string[], options?: { trailingClassName?: boolean }): string {
  const lines: string[] = ["cn("];
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const comma = i < groups.length - 1 || options?.trailingClassName ? "," : "";
    lines.push(`  "${g.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"${comma}`);
  }
  if (options?.trailingClassName) {
    lines.push("  className,");
  }
  lines.push(")");
  return lines.join("\n");
}

function walkTsxFiles(root: string): string[] {
  const out: string[] = [];
  const visit = (p: string) => {
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      for (const name of fs.readdirSync(p)) {
        if (name === "node_modules" || name === "dist") {
          continue;
        }
        visit(path.join(p, name));
      }
      return;
    }
    if (p.endsWith(".tsx") || p.endsWith(".ts")) {
      out.push(p);
    }
  };
  visit(root);
  return out;
}

function isCnOrTvIdentifier(expr: ts.Expression, name: "cn" | "tv"): boolean {
  return ts.isIdentifier(expr) && expr.text === name;
}

function stringNodeText(node: ts.Node): string | undefined {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  return undefined;
}

function lineOf(sf: ts.SourceFile, node: ts.Node): number {
  return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
}

function analyzeCnCall(sf: ts.SourceFile, call: ts.CallExpression, report: AnalyzeReport): void {
  for (const arg of call.arguments) {
    const text = stringNodeText(arg);
    if (text === undefined) {
      continue;
    }
    const n = tokenizeClassString(text).length;
    if (n >= LONG_STRING_TOKEN_THRESHOLD) {
      report.longCnStringLiterals.push({
        file: sf.fileName,
        line: lineOf(sf, arg),
        tokenCount: n,
        preview: text.length > 72 ? `${text.slice(0, 72)}…` : text,
      });
    }
  }
}

function collectStringsInTvObject(
  sf: ts.SourceFile,
  obj: ts.ObjectLiteralExpression,
  report: AnalyzeReport,
  depth: number,
): void {
  if (depth > 12) {
    return;
  }
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) {
      continue;
    }
    const init = prop.initializer;

    if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) {
      const text = init.text;
      const n = tokenizeClassString(text).length;
      if (n >= LONG_STRING_TOKEN_THRESHOLD) {
        report.longTvStringLiterals.push({
          file: sf.fileName,
          line: lineOf(sf, init),
          tokenCount: n,
          preview: text.length > 72 ? `${text.slice(0, 72)}…` : text,
        });
      }
    } else if (ts.isArrayLiteralExpression(init)) {
      for (const el of init.elements) {
        const text = stringNodeText(el);
        if (text !== undefined) {
          const n = tokenizeClassString(text).length;
          if (n >= LONG_STRING_TOKEN_THRESHOLD) {
            report.longTvStringLiterals.push({
              file: sf.fileName,
              line: lineOf(sf, el),
              tokenCount: n,
              preview: text.length > 72 ? `${text.slice(0, 72)}…` : text,
            });
          }
        }
      }
    } else if (ts.isObjectLiteralExpression(init)) {
      collectStringsInTvObject(sf, init, report, depth + 1);
    } else if (ts.isCallExpression(init) && isCnOrTvIdentifier(init.expression, "cn")) {
      analyzeCnCall(sf, init, report);
    }
  }
}

type AnalyzeReport = {
  files: number;
  cnCallExpressions: number;
  tvCallExpressions: number;
  longCnStringLiterals: Array<{
    file: string;
    line: number;
    tokenCount: number;
    preview: string;
  }>;
  longTvStringLiterals: Array<{
    file: string;
    line: number;
    tokenCount: number;
    preview: string;
  }>;
};

function analyzeDirectory(dir: string): AnalyzeReport {
  const report: AnalyzeReport = {
    files: 0,
    cnCallExpressions: 0,
    tvCallExpressions: 0,
    longCnStringLiterals: [],
    longTvStringLiterals: [],
  };

  const files = walkTsxFiles(dir);
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

    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node)) {
        if (isCnOrTvIdentifier(node.expression, "cn")) {
          report.cnCallExpressions++;
          analyzeCnCall(sf, node, report);
        } else if (isCnOrTvIdentifier(node.expression, "tv")) {
          report.tvCallExpressions++;
          const arg0 = node.arguments[0];
          if (arg0 && ts.isObjectLiteralExpression(arg0)) {
            collectStringsInTvObject(sf, arg0, report, 0);
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  return report;
}

function printAnalyzeReport(dir: string, r: AnalyzeReport): void {
  out(`Thư mục: ${path.resolve(dir)}`);
  out(`File .ts/.tsx: ${r.files}`);
  out(`Số lần gọi cn(...): ${r.cnCallExpressions}`);
  out(`Số lần gọi tv(...): ${r.tvCallExpressions}`);
  out(
    `\nChuỗi literal trong cn có ≥${LONG_STRING_TOKEN_THRESHOLD} token (cân nhắc tách đối số): ${r.longCnStringLiterals.length}`,
  );
  for (const x of r.longCnStringLiterals.slice(0, 40)) {
    out(`  ${x.file}:${x.line}  (${x.tokenCount} token)  ${x.preview}`);
  }
  if (r.longCnStringLiterals.length > 40) {
    out(`  … và ${r.longCnStringLiterals.length - 40} vị trí khác`);
  }
  out(
    `\nChuỗi literal trong cấu hình tv (base/variants/…) ≥${LONG_STRING_TOKEN_THRESHOLD} token: ${r.longTvStringLiterals.length}`,
  );
  for (const x of r.longTvStringLiterals.slice(0, 40)) {
    out(`  ${x.file}:${x.line}  (${x.tokenCount} token)  ${x.preview}`);
  }
  if (r.longTvStringLiterals.length > 40) {
    out(`  … và ${r.longTvStringLiterals.length - 40} vị trí khác`);
  }
}

function findStringLiteralAtLine(sf: ts.SourceFile, targetLine: number): string | undefined {
  let found: string | undefined;
  const visit = (node: ts.Node): void => {
    if (found !== undefined) {
      return;
    }
    if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      lineOf(sf, node) === targetLine
    ) {
      found = node.text;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

function main(): void {
  const argv = process.argv.slice(2);
  const cmd = argv[0];

  if (!cmd || cmd === "--help" || cmd === "-h") {
    out(`Usage:
  pnpm exec tsx scripts/group-tailwind-cn.ts analyze [dir]
  pnpm exec tsx scripts/group-tailwind-cn.ts group "<classes>"
  pnpm exec tsx scripts/group-tailwind-cn.ts group --file <path> --line <n> [--with-classname]
`);
    process.exit(0);
  }

  if (cmd === "analyze") {
    const dir = path.resolve(argv[1] ?? "packages/ui/src/components");
    if (!fs.existsSync(dir)) {
      err(`Không tìm thấy thư mục: ${dir}`);
      process.exit(1);
    }
    const r = analyzeDirectory(dir);
    printAnalyzeReport(dir, r);
    return;
  }

  if (cmd === "group") {
    let classStr: string | undefined;
    let withClassName = false;
    if (argv[1] === "--file") {
      const filePath = path.resolve(argv[2] ?? "");
      const lineIdx = argv.indexOf("--line");
      const line = lineIdx >= 0 ? Number(argv[lineIdx + 1]) : NaN;
      if (!filePath || !Number.isFinite(line) || line < 1) {
        err("Cần --file <path> và --line <số dòng 1-based>.");
        process.exit(1);
      }
      if (argv.includes("--with-classname")) {
        withClassName = true;
      }
      const text = fs.readFileSync(filePath, "utf8");
      const sf = ts.createSourceFile(
        filePath,
        text,
        ts.ScriptTarget.Latest,
        true,
        filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      );
      classStr = findStringLiteralAtLine(sf, line);
      if (classStr === undefined) {
        err(`Không tìm thấy string literal tại dòng ${line} trong ${filePath}`);
        process.exit(1);
      }
    } else {
      const rest = argv.slice(1).filter((a) => a !== "--with-classname");
      if (argv.includes("--with-classname")) {
        withClassName = true;
      }
      classStr = rest.join(" ").trim();
    }

    if (!classStr) {
      err("Thiếu chuỗi class hoặc --file/--line.");
      process.exit(1);
    }

    const groups = suggestCnGroups(classStr);
    out(formatCnCall(groups, { trailingClassName: withClassName }));
    const bucketSummary = groups.map((g) => {
      const uniq = new Set(tokenizeClassString(g).map(classifyToken));
      return uniq.size === 1 ? [...uniq][0] : `mixed:${[...uniq].sort().join("+")}`;
    });
    out(`\n// Gợi ý bucket (heuristic, từng đối số): ${JSON.stringify(bucketSummary)}`);
    return;
  }

  err(`Lệnh không hợp lệ: ${cmd}`);
  process.exit(1);
}

main();
