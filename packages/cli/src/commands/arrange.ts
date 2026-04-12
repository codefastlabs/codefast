import path from "node:path";
import process from "node:process";
import type { Command } from "commander";
import { Option } from "commander";
import {
  ArrangeError,
  ArrangeErrorCode,
  analyzeDirectory,
  classifyToken,
  createNodeCliFs,
  createNodeCliLogger,
  DEFAULT_ARRANGE_TARGET,
  formatArray,
  formatCnCall,
  printAnalyzeReport,
  runOnTarget,
  suggestCnGroups,
  tokenizeClassString,
} from "#lib/arrange";

const arrangeFs = createNodeCliFs();
const arrangeLogger = createNodeCliLogger();

/** Commander attribute `withClassName` (second long flag `--with-class-name`). */
function createWithClassNameOption(): Option {
  return new Option(
    "--with-classname, --with-class-name",
    "Append className as final cn() argument",
  ).default(false);
}

function defaultTargetPath(): string {
  return path.resolve(process.cwd(), DEFAULT_ARRANGE_TARGET);
}

function handleArrangeLibError(e: unknown): boolean {
  if (e instanceof ArrangeError && e.code === ArrangeErrorCode.TARGET_NOT_FOUND) {
    arrangeLogger.err(e.message);
    process.exitCode = 1;
    return true;
  }
  return false;
}

type ArrangeCliRunOpts = {
  write: boolean;
  withClassName?: boolean;
  cnImport?: string;
};

function runArrangeAction(resolvedTarget: string, runOpts: ArrangeCliRunOpts): void {
  try {
    runOnTarget(
      resolvedTarget,
      {
        write: runOpts.write,
        withClassName: !!runOpts.withClassName,
        cnImport: runOpts.cnImport,
      },
      arrangeFs,
      arrangeLogger,
    );
  } catch (e) {
    if (!handleArrangeLibError(e)) throw e;
  }
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
      if (!arrangeFs.existsSync(resolved)) {
        arrangeLogger.err(`Không tìm thấy: ${resolved}`);
        process.exitCode = 1;
        return;
      }
      printAnalyzeReport(resolved, analyzeDirectory(resolved, arrangeFs), arrangeLogger);
    });

  arrange
    .command("preview")
    .description("Dry-run: print suggested replacements without writing files")
    .argument("[target]", "Directory or file (default: packages/ui/src/components)")
    .addOption(createWithClassNameOption())
    .option("--cn-import <spec>", "Override module specifier when adding cn import")
    .action((target: string | undefined, opts: { withClassName?: boolean; cnImport?: string }) => {
      const resolved = target ? path.resolve(target) : defaultTargetPath();
      runArrangeAction(resolved, {
        write: false,
        withClassName: opts.withClassName,
        cnImport: opts.cnImport,
      });
    });

  arrange
    .command("apply")
    .description("Apply grouping and cn-in-tv unwrap edits to files")
    .argument("[target]", "Directory or file (default: packages/ui/src/components)")
    .addOption(createWithClassNameOption())
    .option("--cn-import <spec>", "Override module specifier when adding cn import")
    .action((target: string | undefined, opts: { withClassName?: boolean; cnImport?: string }) => {
      const resolved = target ? path.resolve(target) : defaultTargetPath();
      runArrangeAction(resolved, {
        write: true,
        withClassName: opts.withClassName,
        cnImport: opts.cnImport,
      });
    });

  arrange
    .command("group")
    .description("Try grouping on a pasted class string (stdout: cn(...) or tv array with --tv)")
    .argument("[tokens...]", "Class tokens (quote a single string if it contains spaces)")
    .option("--tv", "Emit tv()-style array instead of cn() call", false)
    .addOption(createWithClassNameOption())
    .action((tokens: string[], opts: { tv?: boolean; withClassName?: boolean }) => {
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
        : formatCnCall(groups, { trailingClassName: !!opts.withClassName });
      process.stdout.write(`${result}\n`);
      const bucketSummary = groups.map((g) => {
        const uniq = new Set(tokenizeClassString(g).map(classifyToken));
        return uniq.size === 1 ? [...uniq][0]! : `mixed:${[...uniq].sort().join("+")}`;
      });
      process.stdout.write(`\n// Buckets: ${JSON.stringify(bucketSummary)}\n`);
    });
}
