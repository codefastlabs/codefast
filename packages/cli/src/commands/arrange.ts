import fs from "node:fs";
import path from "node:path";
import type { Command } from "commander";
import {
  analyzeDirectory,
  classifyToken,
  DEFAULT_ARRANGE_TARGET,
  formatArray,
  formatCnCall,
  printAnalyzeReport,
  runOnTarget,
  suggestCnGroups,
  tokenizeClassString,
} from "#lib/arrange";

function defaultTargetPath(): string {
  return path.resolve(process.cwd(), DEFAULT_ARRANGE_TARGET);
}

export function registerArrangeCommand(program: Command): void {
  const arrange = program
    .command("arrange")
    .description("Analyze and regroup Tailwind classes in cn() / tv() calls (Tailwind v4)");

  arrange
    .command("analyze")
    .description("Report long strings, nested cn in tv(), and related findings")
    .argument("[target]", "Directory or file (default: packages/ui/src/components)")
    .action((target: string | undefined) => {
      const resolved = target ? path.resolve(target) : defaultTargetPath();
      if (!fs.existsSync(resolved)) {
        process.stderr.write(`Không tìm thấy: ${resolved}\n`);
        process.exitCode = 1;
        return;
      }
      printAnalyzeReport(resolved, analyzeDirectory(resolved));
    });

  arrange
    .command("preview")
    .description("Dry-run: print suggested replacements without writing files")
    .argument("[target]", "Directory or file (default: packages/ui/src/components)")
    .option("--with-classname", "Append className as final cn() argument", false)
    .option("--cn-import <spec>", "Override module specifier when adding cn import")
    .action((target: string | undefined, opts: { withClassname?: boolean; cnImport?: string }) => {
      const resolved = target ? path.resolve(target) : defaultTargetPath();
      runOnTarget(resolved, {
        write: false,
        withClassName: !!opts.withClassname,
        cnImport: opts.cnImport,
      });
    });

  arrange
    .command("apply")
    .description("Apply grouping and cn-in-tv unwrap edits to files")
    .argument("[target]", "Directory or file (default: packages/ui/src/components)")
    .option("--with-classname", "Append className as final cn() argument", false)
    .option("--cn-import <spec>", "Override module specifier when adding cn import")
    .action((target: string | undefined, opts: { withClassname?: boolean; cnImport?: string }) => {
      const resolved = target ? path.resolve(target) : defaultTargetPath();
      runOnTarget(resolved, {
        write: true,
        withClassName: !!opts.withClassname,
        cnImport: opts.cnImport,
      });
    });

  arrange
    .command("group")
    .description("Try grouping on a pasted class string (stdout: cn(...) or tv array with --tv)")
    .argument("[tokens...]", "Class tokens (quote a single string if it contains spaces)")
    .option("--tv", "Emit tv()-style array instead of cn() call", false)
    .option("--with-classname", "Append className as final cn() argument", false)
    .action((tokens: string[], opts: { tv?: boolean; withClassname?: boolean }) => {
      const inlineClasses = tokens.join(" ").trim();
      if (!inlineClasses) {
        process.stderr.write(
          'Cần truyền chuỗi class. Ví dụ: codefast arrange group "flex gap-2 text-sm rounded-md"\n',
        );
        process.exitCode = 1;
        return;
      }
      const groups = suggestCnGroups(inlineClasses);
      const result = opts.tv
        ? formatArray(groups)
        : formatCnCall(groups, { trailingClassName: !!opts.withClassname });
      process.stdout.write(`${result}\n`);
      const bucketSummary = groups.map((g) => {
        const uniq = new Set(tokenizeClassString(g).map(classifyToken));
        return uniq.size === 1 ? [...uniq][0]! : `mixed:${[...uniq].sort().join("+")}`;
      });
      process.stdout.write(`\n// Buckets: ${JSON.stringify(bucketSummary)}\n`);
    });
}
